"""
Daily ML price check for the Telegram admin panel.

Takes today's WuBook price for every apartment (via the API), runs the existing
price-normality model (app.predict_price_normality) and writes the result to
ML_OUTPUT as JSON, which the Telegram bot reads.

Usage:
  python ml_price_check.py          # one run
  python ml_price_check.py --loop   # run now if results are stale, then every day at ML_RUN_HOUR (Kyiv)
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

API_URL = os.environ.get("API_URL", "http://api:3000").rstrip("/")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")
OUTPUT = os.environ.get("ML_OUTPUT", "/ml-data/price_check.json")
RUN_HOUR = int(os.environ.get("ML_RUN_HOUR", "9"))
STALE_HOURS = 20
NEGOTIABLE_PRICE = 10000
KYIV = ZoneInfo("Europe/Kyiv")


def log(msg):
    print(f"[ml] {datetime.now(KYIV):%Y-%m-%d %H:%M:%S} {msg}", flush=True)


def fetch_today_prices(today):
    req = urllib.request.Request(f"{API_URL}/analis/tarifPrices/current")
    if INTERNAL_API_KEY:
        req.add_header("x-api-key", INTERNAL_API_KEY)
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    rooms = {}
    for p in data.get("prices", []):
        try:
            price = float(p.get("price") or 0)
        except (TypeError, ValueError):
            continue
        name = str(p.get("roomName") or "").strip()
        if p.get("date") == today and name and 0 < price < NEGOTIABLE_PRICE:
            rooms[name] = price
    return rooms


def run_once():
    # Imported here so the --loop parent process stays small
    from app import load_real_data, predict_price_normality

    today = datetime.now(KYIV).strftime("%d/%m/%Y")
    rooms = fetch_today_prices(today)
    log(f"{len(rooms)} apartments with a price for {today}")

    real_df = load_real_data()
    results, errors = [], 0
    for name, price in sorted(rooms.items()):
        try:
            r = predict_price_normality(name, today, price, real_df=real_df)
            if not r:
                errors += 1
                continue
            results.append({
                "room": name,
                "price": price,
                "predicted": r.get("predicted_price"),
                "optimal": r.get("optimal_price"),
                "status": r.get("status"),
                "statusCode": r.get("status_code"),
                "confidence": r.get("confidence"),
                "similarCount": r.get("similar_bookings_count"),
            })
        except Exception as e:  # one bad room must not stop the batch
            errors += 1
            log(f"prediction failed for {name}: {e}")

    payload = {
        "generatedAt": datetime.now(KYIV).isoformat(),
        "date": today,
        "total": len(rooms),
        "errors": errors,
        "results": results,
    }
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    tmp = OUTPUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, OUTPUT)  # atomic: the bot never reads a half-written file
    log(f"done: {len(results)} ok, {errors} errors -> {OUTPUT}")


FORECAST_OUTPUT = os.environ.get("ML_FORECAST_OUTPUT", "/ml-data/forecast.json")


def is_stale(path=OUTPUT):
    try:
        return time.time() - os.path.getmtime(path) > STALE_HOURS * 3600
    except OSError:
        return True


def seconds_until_next_run():
    now = datetime.now(KYIV)
    nxt = now.replace(hour=RUN_HOUR, minute=0, second=0, microsecond=0)
    if nxt <= now:
        nxt += timedelta(days=1)
    return (nxt - now).total_seconds()


FORECAST_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "forecast_engine.py")


def run_in_subprocess():
    # Separate processes so pandas/sklearn memory is released between runs;
    # one failing job does not stop the other
    for script in (os.path.abspath(__file__), FORECAST_SCRIPT):
        code = subprocess.run([sys.executable, "-u", script]).returncode
        if code != 0:
            log(f"{os.path.basename(script)} failed with exit code {code}")


if __name__ == "__main__":
    if "--loop" not in sys.argv:
        run_once()
        sys.exit(0)

    log(f"loop started, daily run at {RUN_HOUR:02d}:00 Kyiv")
    if is_stale() or is_stale(FORECAST_OUTPUT):
        time.sleep(60)  # give the API time to start after a deploy
        run_in_subprocess()
    while True:
        # Until the first forecast exists (reservation history still syncing), retry hourly
        if is_stale(FORECAST_OUTPUT):
            time.sleep(min(3600, seconds_until_next_run()))
        else:
            time.sleep(seconds_until_next_run())
        run_in_subprocess()
