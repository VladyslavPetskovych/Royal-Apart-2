"""
Forecasting engine for Royal Apart (runs daily in the ml container).

Input  : reservations synced from Zak (GET /adminStats/dataset) and current WuBook
         prices / availability (GET /adminStats/roomValues).
Output : ML_FORECAST_OUTPUT (JSON) read by the Telegram admin panel:
         - occupancy forecast for the next 60 days (on-the-books + expected pickup, with a range)
         - revenue / ADR forecast
         - pace vs last year (same weekday, same lead time)
         - price recommendations per apartment (rule-based on top of the demand forecast)
         - backtest accuracy vs simple baselines

Usage:
  python forecast_engine.py                       # fetch from API_URL, write output
  python forecast_engine.py --dataset ds.json [--room-values rv.json] [--today 2026-10-15]
"""
import argparse
import json
import math
import os
import sys
import urllib.request
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

KYIV = ZoneInfo("Europe/Kyiv")
API_URL = os.environ.get("API_URL", "http://api:3000").rstrip("/")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")
OUTPUT = os.environ.get("ML_FORECAST_OUTPUT", "/ml-data/forecast.json")

HORIZON = 60          # days to forecast
MAX_LEAD = 60         # leads used for training
TEST_DAYS = 120       # backtest window (most recent stay dates)
HISTORY_START = pd.Timestamp("2023-03-01")  # earlier stays miss bookings made before the data starts
NEGOTIABLE_PRICE = 10000


def log(msg):
    print(f"[forecast] {datetime.now(KYIV):%Y-%m-%d %H:%M:%S} {msg}", flush=True)


# ---------------------------------------------------------------- calendar

def orthodox_easter(year):
    a, b, c = year % 4, year % 7, year % 19
    d = (19 * c + 15) % 30
    e = (2 * a + 4 * b - d + 34) % 7
    month = (d + e + 114) // 31
    day = (d + e + 114) % 31 + 1
    return date(year, month, day) + timedelta(days=13)  # Julian -> Gregorian (1900-2099)


def holiday_flags(dates):
    """1 for public holidays / their long weekends in Ukraine, plus a festive-season flag."""
    years = {d.year for d in dates}
    days = set()
    for y in years:
        for m, dd in [(1, 1), (3, 8), (5, 1), (6, 28), (8, 24), (10, 1), (12, 25), (1, 7)]:
            days.add(date(y, m, dd))
        easter = orthodox_easter(y)
        days.update({easter, easter + timedelta(days=1), easter + timedelta(days=49), easter + timedelta(days=50)})
    # nights before a holiday are what guests book
    near = set()
    for d in days:
        near.update({d - timedelta(days=1), d})
    hol = np.array([1 if d.date() in near else 0 for d in dates])
    festive = np.array([1 if (d.month == 12 and d.day >= 20) or (d.month == 1 and d.day <= 10) else 0 for d in dates])
    return hol, festive


# ---------------------------------------------------------------- data

def fetch_json(path):
    req = urllib.request.Request(f"{API_URL}{path}")
    if INTERNAL_API_KEY:
        req.add_header("x-api-key", INTERNAL_API_KEY)
    with urllib.request.urlopen(req, timeout=300) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_nights(dataset):
    """One row per reserved room-night: stay date, room type, created, cancel date, price."""
    rows = []
    for r in dataset["reservations"]:
        status = str(r.get("status") or "").lower()
        if status.startswith("cancel"):
            cancelled = True
        elif status == "confirmed":
            cancelled = False
        else:
            continue  # waiting / expired / unknown
        created = r.get("created")
        if not created:
            continue
        cancel_date = r.get("statusDate") if cancelled else None
        if cancelled and not cancel_date:
            cancel_date = created  # unknown cancel time: assume it never sat on the books
        for rt, dfrom, dto, total in r.get("rooms") or []:
            if not (rt and dfrom and dto):
                continue
            rows.append((rt, dfrom, dto, total, created, cancel_date, cancelled, r.get("channel") or "--"))

    df = pd.DataFrame(rows, columns=["rt", "dfrom", "dto", "total", "created", "cancel", "cancelled", "channel"])
    for c in ["dfrom", "dto", "created", "cancel"]:
        df[c] = pd.to_datetime(df[c], errors="coerce")
    df = df.dropna(subset=["dfrom", "dto", "created"])
    df["n"] = (df["dto"] - df["dfrom"]).dt.days
    df = df[(df["n"] > 0) & (df["n"] <= 120)]
    df["night_price"] = df["total"] / df["n"]

    reps = df["n"].to_numpy()
    nights = df.loc[df.index.repeat(reps)].reset_index(drop=True)
    offsets = np.concatenate([np.arange(k) for k in reps])
    nights["d"] = nights["dfrom"] + pd.to_timedelta(offsets, unit="D")
    nights["a"] = (nights["d"] - nights["created"]).dt.days.clip(lower=0)            # booked a days before
    nights["b"] = (nights["d"] - nights["cancel"]).dt.days.fillna(-10_000)          # cancelled b days before
    # one confirmed reservation per room and night (Zak duplicates / overlaps)
    conf = nights[~nights["cancelled"]].sort_values("created").drop_duplicates(["rt", "d"])
    canc = nights[nights["cancelled"]]
    return pd.concat([conf, canc], ignore_index=True)


def capacity_series(nights, rooms, dates, today):
    """Apartments available for sale per date: active from first stay to last stay (current ones stay active)."""
    current = {int(r["roomType"]) for r in rooms}
    span = nights[~nights["cancelled"]].groupby("rt")["d"].agg(["min", "max"])
    far = today + pd.Timedelta(days=400)
    starts, ends = [], []
    for rt, row in span.iterrows():
        starts.append(row["min"])
        ends.append(far if int(rt) in current else row["max"])
    for rt in current - set(int(x) for x in span.index):
        starts.append(today)
        ends.append(far)
    starts, ends = np.array(starts, dtype="datetime64[ns]"), np.array(ends, dtype="datetime64[ns]")
    dv = dates.to_numpy()[:, None]
    return pd.Series(((dv >= starts) & (dv <= ends)).sum(axis=1), index=dates)


# ---------------------------------------------------------------- features

def otb_matrix(nights, dates, leads):
    """otb[d, L] = rooms on the books for stay date d, L days before it."""
    idx = {d: i for i, d in enumerate(dates)}
    sub = nights[nights["d"].isin(idx.keys())]
    di = sub["d"].map(idx).to_numpy()
    a, b = sub["a"].to_numpy(), sub["b"].to_numpy()
    out = np.zeros((len(dates), len(leads)))
    for j, L in enumerate(leads):
        on = (a >= L) & (b < L)
        out[:, j] = np.bincount(di[on], minlength=len(dates))
    return out


def build_features(dates, otb_rate, final_rate, leads, cap):
    """Feature rows for (stay date i, lead j). final_rate may contain NaN for the future."""
    n = len(dates)
    hol, festive = holiday_flags(dates)
    dow = dates.dayofweek.to_numpy()
    doy = dates.dayofyear.to_numpy()
    pos = {d: i for i, d in enumerate(dates)}
    ly_idx = np.array([pos.get(d - pd.Timedelta(days=364), -1) for d in dates])
    ly_final = np.where(ly_idx >= 0, final_rate[np.maximum(ly_idx, 0)], np.nan)

    feats, keys = [], []
    for j, L in enumerate(leads):
        for i in range(n):
            t = i - L  # index of the "as of" day (may be outside the range)
            # recent realized level and recent pickup at this lead, known at time t
            lo, hi = max(0, t - 28), t
            recent = np.nanmean(final_rate[lo:hi]) if hi - lo >= 7 else np.nan
            plo, phi = max(0, t - 14), t
            if phi - plo >= 5:
                pick = final_rate[plo:phi] - otb_rate[plo:phi, j]
                recent_pickup = np.nanmean(pick) if np.isfinite(pick).any() else np.nan
            else:
                recent_pickup = np.nan
            ly_otb = otb_rate[ly_idx[i], j] if ly_idx[i] >= 0 else np.nan
            feats.append([
                L, otb_rate[i, j], dow[i], dates[i].month,
                math.sin(2 * math.pi * doy[i] / 365.25), math.cos(2 * math.pi * doy[i] / 365.25),
                1 if dow[i] in (4, 5) else 0, hol[i], festive[i],
                ly_final[i], ly_otb, recent, recent_pickup, cap[i],
            ])
            keys.append((i, j))
    return np.array(feats, dtype=float), keys


FEATURE_NAMES = ["lead", "otb_rate", "dow", "month", "doy_sin", "doy_cos", "weekend", "holiday",
                 "festive", "ly_final", "ly_otb_same_lead", "recent_level_28d", "recent_pickup_14d", "capacity",
                 "recent_level_7d"]

LEAD_BUCKETS = [(0, 0), (1, 3), (4, 7), (8, 14), (15, 30), (31, 60)]


def make_model(loss="absolute_error"):
    # Chosen by backtest (see accuracy in the output): absolute loss on the pickup fraction
    return HistGradientBoostingRegressor(loss=loss, max_iter=400, learning_rate=0.05, max_leaf_nodes=31,
                                         min_samples_leaf=40, l2_regularization=1.0, random_state=42)


def add_recent7(X, keys, final_rate):
    """Append the realized occupancy of the 7 days before the as-of day."""
    t_idx = keys[:, 0] - keys[:, 1]
    r7 = np.array([np.nanmean(final_rate[t - 7:t]) if t >= 7 and np.isfinite(final_rate[t - 7:t]).any() else np.nan
                   for t in t_idx])
    return np.column_stack([X, r7])


# The model predicts the share of still-free apartments that will be booked by the stay date:
#   pickup_frac = (final - otb) / (1 - otb)   ->   final = otb + pickup_frac * (1 - otb)
# so a forecast is never below what is already booked and short leads are nearly exact.
def to_pickup_frac(final_rate, otb_rate):
    return np.clip((final_rate - otb_rate) / np.maximum(1 - otb_rate, 1e-6), 0, 1)


def from_pickup_frac(frac, otb_rate):
    return np.clip(otb_rate + np.clip(frac, 0, 1) * (1 - otb_rate), 0, 1)


# ---------------------------------------------------------------- main pipeline

def run(dataset, room_values, today):
    today = pd.Timestamp(today)
    rooms = dataset.get("rooms") or []
    nights = build_nights(dataset)
    log(f"{len(dataset['reservations'])} reservations -> {len(nights)} room-nights")

    hist_dates = pd.date_range(HISTORY_START, today - pd.Timedelta(days=1))
    fut_dates = pd.date_range(today, today + pd.Timedelta(days=HORIZON - 1))
    all_dates = hist_dates.append(fut_dates)
    leads = list(range(0, MAX_LEAD + 1))

    cap = capacity_series(nights, rooms, all_dates, today).to_numpy().astype(float)
    cap = np.maximum(cap, 1)
    otb = otb_matrix(nights, all_dates, leads)
    otb_rate = np.minimum(otb / cap[:, None], 1.0)

    conf = nights[~nights["cancelled"]]
    final_rooms = conf.groupby("d").size().reindex(all_dates, fill_value=0).to_numpy().astype(float)
    final_rate = np.minimum(final_rooms / cap, 1.0)
    n_hist = len(hist_dates)
    final_rate_known = final_rate.copy()
    final_rate_known[n_hist:] = np.nan  # the future is unknown

    # realized revenue / ADR per date
    rev = conf.groupby("d")["night_price"].sum().reindex(all_dates, fill_value=0).to_numpy()
    adr = np.where(final_rooms > 0, rev / np.maximum(final_rooms, 1), np.nan)

    X, keys = build_features(all_dates, otb_rate, final_rate_known, leads, cap)
    keys = np.array(keys)
    X = add_recent7(X, keys, final_rate_known)
    y = final_rate_known[keys[:, 0]]
    stay_idx = keys[:, 0]
    lead_arr = keys[:, 1]
    otb_col, ly_col, recent_col, recent7_col = X[:, 1], X[:, 9], X[:, 11], X[:, 14]
    y_frac = to_pickup_frac(y, otb_col)

    # samples whose "as of" day is inside history and the outcome is known
    known = (stay_idx < n_hist) & (stay_idx - lead_arr >= 28) & np.isfinite(y)

    # -------- backtest: last TEST_DAYS stay dates, trained only on earlier stay dates
    test_start = n_hist - TEST_DAYS
    train_m = known & (stay_idx < test_start)
    test_m = known & (stay_idx >= test_start)
    model = make_model()
    model.fit(X[train_m], y_frac[train_m])
    pred = from_pickup_frac(model.predict(X[test_m]), otb_col[test_m])

    # baselines
    tr = pd.DataFrame({"L": lead_arr[train_m], "dow": X[train_m][:, 2], "pick": y[train_m] - otb_col[train_m]})
    avg_pick = tr.groupby(["L", "dow"])["pick"].mean()
    te_keys = list(zip(lead_arr[test_m], X[test_m][:, 2]))
    otb_t = otb_col[test_m]
    b_pickup = np.clip(otb_t + np.array([avg_pick.get(k, 0.0) for k in te_keys]), 0, 1)
    b_ly = np.maximum(np.where(np.isfinite(ly_col[test_m]), ly_col[test_m], recent_col[test_m]), otb_t)
    b_recent = np.maximum(recent_col[test_m], otb_t)
    b_recent7 = np.maximum(recent7_col[test_m], otb_t)

    yt = y[test_m]
    cap_t = X[test_m][:, 13]
    lt = lead_arr[test_m]

    def mae_pts(p, m=None):
        m = np.ones(len(p), bool) if m is None else m
        ok = m & np.isfinite(p)
        return round(float(np.mean(np.abs(p[ok] - yt[ok])) * 100), 1)

    by_lead, residual_q = [], {}
    for lo, hi in LEAD_BUCKETS:
        m = (lt >= lo) & (lt <= hi)
        by_lead.append({
            "leads": f"{lo}-{hi}" if lo != hi else f"{lo}",
            "model": mae_pts(pred, m),
            "pickupBaseline": mae_pts(b_pickup, m),
            "recent7d": mae_pts(b_recent7, m),
            "lastYear": mae_pts(b_ly, m),
        })
        # empirical 10%/90% errors per horizon -> calibrated forecast ranges
        err = yt[m] - pred[m]
        residual_q[(lo, hi)] = (float(np.quantile(err, 0.1)), float(np.quantile(err, 0.9)))
    accuracy = {
        "testFrom": str(hist_dates[test_start].date()),
        "testTo": str(hist_dates[-1].date()),
        "samples": int(test_m.sum()),
        "maePts": {
            "model": mae_pts(pred),
            "otbPlusAvgPickup": mae_pts(b_pickup),
            "lastYearSameWeekday": mae_pts(b_ly),
            "recent28dAverage": mae_pts(b_recent),
            "recent7dAverage": mae_pts(b_recent7),
        },
        "maeRooms": {
            "model": round(float(np.mean(np.abs(pred - yt) * cap_t)), 1),
            "otbPlusAvgPickup": round(float(np.mean(np.abs(b_pickup - yt) * cap_t)), 1),
        },
        "biasPts": round(float(np.mean(pred - yt)) * 100, 1),
        "byLead": by_lead,
    }
    log(f"backtest MAE: model {accuracy['maePts']['model']} pts | recent 7d {accuracy['maePts']['recent7dAverage']} | "
        f"recent 28d {accuracy['maePts']['recent28dAverage']} | last year {accuracy['maePts']['lastYearSameWeekday']} | "
        f"OTB+avg pickup {accuracy['maePts']['otbPlusAvgPickup']}")

    # -------- final model on all known data
    model = make_model()
    model.fit(X[known], y_frac[known])

    # forecast rows: future stay dates as of today (lead = days ahead)
    row_of = {(int(i), int(j)): r for r, (i, j) in enumerate(keys)}
    fut_rows = [row_of[(n_hist + k, k)] for k in range(len(fut_dates))]
    Xf = X[fut_rows]
    otb_now = Xf[:, 1]
    f_mid = from_pickup_frac(model.predict(Xf), otb_now)

    def bucket_q(L):
        for (lo, hi), q in residual_q.items():
            if lo <= L <= hi:
                return q
        return residual_q[LEAD_BUCKETS[-1]]

    qs = np.array([bucket_q(k) for k in range(len(fut_dates))])
    f_lo = np.clip(np.minimum(f_mid + qs[:, 0], f_mid), otb_now, 1)
    f_hi = np.clip(np.maximum(f_mid + qs[:, 1], f_mid), 0, 1)
    cap_f = cap[n_hist:]

    # -------- revenue / ADR
    # on-the-books revenue for future dates (confirmed, already created)
    fut_conf = conf[(conf["d"] >= today) & (conf["created"] <= today)]
    otb_rev = fut_conf.groupby("d")["night_price"].sum().reindex(fut_dates, fill_value=0).to_numpy()
    otb_rooms_exact = fut_conf.groupby("d").size().reindex(fut_dates, fill_value=0).to_numpy()
    # price of late bookings: recent nights booked within 7 days of stay, by weekday
    recent_conf = conf[(conf["d"] >= today - pd.Timedelta(days=90)) & (conf["d"] < today)]
    late = recent_conf[recent_conf["a"] <= 7]
    late_adr_dow = late.groupby(late["d"].dt.dayofweek)["night_price"].median()
    overall_late = float(late["night_price"].median()) if len(late) else float(np.nanmedian(adr[:n_hist]))
    # seasonality: last year's ADR in the same week relative to last year's average
    ly_adr = []
    for d in fut_dates:
        w = conf[(conf["d"] >= d - pd.Timedelta(days=367)) & (conf["d"] <= d - pd.Timedelta(days=361))]["night_price"]
        ly_adr.append(float(w.median()) if len(w) else np.nan)
    ly_base = conf[(conf["d"] >= today - pd.Timedelta(days=455)) & (conf["d"] < today - pd.Timedelta(days=275))]["night_price"]
    ly_base = float(ly_base.median()) if len(ly_base) else np.nan
    season_idx = np.where(np.isfinite(ly_adr) & np.isfinite(ly_base) & (ly_base > 0), np.array(ly_adr) / ly_base, 1.0)
    season_idx = np.clip(season_idx, 0.8, 1.5)
    pickup_adr = np.array([late_adr_dow.get(d.dayofweek, overall_late) for d in fut_dates]) * season_idx

    f_rooms = f_mid * cap_f
    pickup_rooms = np.maximum(f_rooms - otb_rooms_exact, 0)
    rev_fc = otb_rev + pickup_rooms * pickup_adr

    # -------- pace vs last year (same weekday, same lead)
    ly_pos = {d: i for i, d in enumerate(all_dates)}
    pace = []
    for k, d in enumerate(fut_dates):
        i_ly = ly_pos.get(d - pd.Timedelta(days=364))
        L = min(k, MAX_LEAD)
        pace.append({
            "otb": float(otb[n_hist + k, L]),
            "otbLy": float(otb[i_ly, L]) if i_ly is not None else None,
            "finalLy": float(final_rooms[i_ly]) if i_ly is not None else None,
        })

    # -------- price recommendations per apartment (unsold nights, next 21 days)
    recs = price_recommendations(room_values, rooms, conf, fut_dates, f_mid, final_rate[:n_hist], hist_dates, today)

    # -------- assemble
    days_out = []
    for k, d in enumerate(fut_dates):
        days_out.append({
            "date": str(d.date()),
            "capacity": int(cap_f[k]),
            "otbRooms": int(otb_rooms_exact[k]),
            "forecastRooms": round(float(f_rooms[k]), 1),
            "forecastRate": round(float(f_mid[k]) * 100, 1),
            "lowRate": round(float(f_lo[k]) * 100, 1),
            "highRate": round(float(f_hi[k]) * 100, 1),
            "otbRevenue": round(float(otb_rev[k])),
            "forecastRevenue": round(float(rev_fc[k])),
            "forecastAdr": round(float(rev_fc[k] / f_rooms[k])) if f_rooms[k] > 0.5 else None,
            "otbLy": pace[k]["otbLy"],
            "finalLy": pace[k]["finalLy"],
        })

    def window(n):
        sl = slice(0, n)
        cap_sum = float(cap_f[sl].sum())
        p = pace[:n]
        ly_otb = [x["otbLy"] for x in p if x["otbLy"] is not None]
        ly_fin = [x["finalLy"] for x in p if x["finalLy"] is not None]
        return {
            "days": n,
            "otbRooms": int(otb_rooms_exact[sl].sum()),
            "forecastRooms": round(float(f_rooms[sl].sum())),
            "forecastRate": round(float(f_rooms[sl].sum()) / cap_sum * 100, 1) if cap_sum else None,
            "otbRevenue": round(float(otb_rev[sl].sum())),
            "forecastRevenue": round(float(rev_fc[sl].sum())),
            "otbRoomsLySameLead": round(float(sum(ly_otb))) if len(ly_otb) == n else None,
            "finalRoomsLy": round(float(sum(ly_fin))) if len(ly_fin) == n else None,
        }

    month_end = (today + pd.offsets.MonthEnd(0))
    month_n = int((month_end - today).days) + 1
    # this month: realized so far + forecast for the rest
    month_start = today.replace(day=1)
    past_m = conf[(conf["d"] >= month_start) & (conf["d"] < today)]
    month = {
        "month": today.strftime("%Y-%m"),
        "realizedRevenue": round(float(past_m["night_price"].sum())),
        "realizedRooms": int(len(past_m)),
        "remaining": window(min(month_n, HORIZON)),
    }

    importances = feature_importance(model, X[known][-5000:], y_frac[known][-5000:])

    return {
        "generatedAt": datetime.now(KYIV).isoformat(),
        "asOf": str(today.date()),
        "dataThrough": dataset.get("sync", {}).get("backfilledThrough"),
        "reservations": len(dataset["reservations"]),
        "accuracy": accuracy,
        "featureImportance": importances,
        "summary": {"next7": window(7), "next30": window(30), "next60": window(60), "month": month},
        "days": days_out,
        "priceRecommendations": recs,
    }


def feature_importance(model, X, y):
    """Permutation importance on a sample (top 6), in percentage points of MAE increase."""
    try:
        rng = np.random.default_rng(0)
        base = np.mean(np.abs(model.predict(X) - y))
        out = []
        for j, name in enumerate(FEATURE_NAMES):
            Xp = X.copy()
            Xp[:, j] = rng.permutation(Xp[:, j])
            out.append((name, float(np.mean(np.abs(model.predict(Xp) - y)) - base) * 100))
        out.sort(key=lambda x: -x[1])
        return [{"feature": n, "maeIncreasePts": round(v, 2)} for n, v in out[:6]]
    except Exception:
        return []


def norm_name(s):
    return "".join(ch for ch in str(s or "").lower() if ch.isalnum())


def price_recommendations(room_values, rooms, conf, fut_dates, f_mid, hist_rate, hist_dates, today, days=21):
    """Suggestions for unsold apartment-nights (next `days` days). Rule-based on top of the forecast.

    1. Peer position: an apartment's realized price index (what guests actually paid in the last
       120 days vs the portfolio median) compared with its listed price index (its current WuBook
       price vs the portfolio median). Comparing indexes removes the overall gap between listed and
       paid prices (discounts, OTA promotions), so the portfolio as a whole is not pushed up or down.
         peer = clip(sqrt(realized_idx / listed_idx), 0.85, 1.15)
    2. Demand: forecast occupancy for that night vs the usual occupancy for that weekday
       (last 90 days):  demand = clip(1 + 0.8 * (forecast - usual), 0.88, 1.20)
       Last minute (<= 2 days) with weak demand (< 75%): extra -7%.
    recommended = current * peer * demand, rounded to 50; shown when the change is >= 10%.
    """
    if not room_values or not room_values.get("rooms"):
        return []
    rt_by_name = {norm_name(r["name"]): int(r["roomType"]) for r in rooms}

    recent = conf[(conf["d"] >= today - pd.Timedelta(days=120)) & (conf["d"] < today) & (conf["night_price"] > 0)]
    realized = recent.groupby("rt")["night_price"].median()
    if realized.empty:
        return []
    realized_idx = realized / realized.median()

    listed = {}
    for room in room_values["rooms"]:
        rt = rt_by_name.get(norm_name(room.get("name")))
        prices = [d["price"] for d in room.get("days", []) if d.get("price") and d["price"] < NEGOTIABLE_PRICE]
        if rt is not None and prices:
            listed[rt] = float(np.median(prices))
    if not listed:
        return []
    listed_median = float(np.median(list(listed.values())))

    hr = pd.Series(hist_rate, index=hist_dates)
    usual = hr[hr.index >= today - pd.Timedelta(days=90)].groupby(lambda d: d.dayofweek).mean()
    fc = {d.strftime("%Y-%m-%d"): float(f_mid[k]) for k, d in enumerate(fut_dates)}

    out = []
    for room in room_values["rooms"]:
        rt = rt_by_name.get(norm_name(room.get("name")))
        if rt is None or rt not in listed or rt not in realized_idx.index:
            continue
        listed_idx = listed[rt] / listed_median
        peer = float(np.clip(math.sqrt(realized_idx[rt] / listed_idx), 0.85, 1.15))
        for day in room.get("days", [])[:days]:
            price = day.get("price")
            if not price or price >= NEGOTIABLE_PRICE or day.get("closed") or day.get("avail", 0) <= 0:
                continue
            f = fc.get(day["date"])
            if f is None:
                continue
            d = pd.Timestamp(day["date"])
            u = float(usual.get(d.dayofweek, f))
            demand = float(np.clip(1 + 0.8 * (f - u), 0.88, 1.20))
            lead = (d - today).days
            reasons = []
            if peer >= 1.05:
                reasons.append("дешевша за схожі, хоча гості платять більше")
            elif peer <= 0.95:
                reasons.append("дорожча за схожі відносно реальних оплат")
            if f > u + 0.05:
                reasons.append("попит вищий за звичайний")
            elif f < u - 0.05:
                reasons.append("попит нижчий за звичайний")
            if lead <= 2 and f < 0.75:
                demand *= 0.93
                reasons.append("остання хвилина")
            rec = round(price * peer * demand / 50) * 50
            diff = (rec - price) / price
            if abs(diff) >= 0.10:
                out.append({
                    "room": room.get("name"),
                    "date": day["date"],
                    "current": round(price),
                    "recommended": int(rec),
                    "diffPct": round(diff * 100),
                    "forecastRate": round(f * 100),
                    "usualRate": round(u * 100),
                    "reason": ", ".join(reasons) or "позиція відносно схожих квартир",
                })
    out.sort(key=lambda r: (r["date"], -abs(r["diffPct"])))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset")
    ap.add_argument("--room-values")
    ap.add_argument("--today")
    ap.add_argument("--output", default=OUTPUT)
    args = ap.parse_args()

    today = args.today or datetime.now(KYIV).strftime("%Y-%m-%d")
    if args.dataset:
        with open(args.dataset, encoding="utf-8") as f:
            dataset = json.load(f)
    else:
        dataset = fetch_json("/adminStats/dataset?since=2023-01-01")
    if args.room_values:
        with open(args.room_values, encoding="utf-8") as f:
            room_values = json.load(f)
    elif args.dataset:
        room_values = None
    else:
        try:
            room_values = fetch_json("/adminStats/roomValues?days=30")
        except Exception as e:
            log(f"room values unavailable: {e}")
            room_values = None

    if len(dataset.get("reservations") or []) < 1000:
        log("not enough reservations synced yet — skipping")
        return 0

    result = run(dataset, room_values, today)
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    tmp = args.output + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)
    os.replace(tmp, args.output)
    log(f"written {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
