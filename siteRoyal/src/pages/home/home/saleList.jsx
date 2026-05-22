import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { apiUrl } from "../../../config/publicSite";
import { formatApartmentNameForLang } from "../../../utils/apartmentNameDisplay";

function normalizeRoomId(id) {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function normalizeName(name) {
  return (name ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

function calculateTimeLeft(tillDate) {
  const difference = new Date(tillDate) - new Date();
  if (difference <= 0) return null;
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
  };
}

function formatTimeShort(timeLeft) {
  if (!timeLeft) return null;
  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days} дн`);
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours} год`);
  if (parts.length === 0 && timeLeft.minutes > 0) {
    parts.push(`${timeLeft.minutes} хв`);
  }
  return parts.join(" · ") || "< 1 хв";
}

function OneSale({ sale, room }) {
  const { i18n } = useTranslation();
  const displayName = formatApartmentNameForLang(room.name, i18n.language);
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(sale.tillDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(sale.tillDate));
    }, 60000);
    return () => clearInterval(timer);
  }, [sale.tillDate]);

  const isContract = room.price > 10000;
  const discountedPrice = (
    room.price -
    room.price * (sale.discount / 100)
  ).toFixed();

  const imgSrc = room.imgurl?.[0]
    ? apiUrl(`/api/imgsRoyal/${room.wubid}/${room.imgurl[0]}`)
    : null;

  return (
    <Link
      to={`/room/${room.wubid}`}
      className="flex gap-3 overflow-hidden rounded-[3px] border border-brand-black/8 bg-white/90 p-3 transition hover:border-brand-bordo/25 hover:shadow-[0_4px_16px_rgba(99,18,27,0.08)] sm:gap-4 sm:p-4"
    >
      {imgSrc && (
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[2px] bg-brand-beige sm:h-20 sm:w-20">
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-finlandica text-[15px] font-semibold text-brand-black sm:text-[16px]">
            {displayName}
          </h3>
          <span className="shrink-0 font-finlandica text-[13px] font-semibold text-brand-bordo">
            −{sale.discount}%
          </span>
        </div>

        <p className="font-finlandica text-[14px] text-brand-black/80">
          {isContract ? (
            "договірна"
          ) : (
            <>
              <span className="text-brand-black/35 line-through">
                {room.price}
              </span>{" "}
              <span className="font-semibold text-brand-bordo">
                {discountedPrice} грн
              </span>
            </>
          )}
        </p>

        {timeLeft && (
          <p className="font-finlandica text-[12px] text-brand-black/45">
            {formatTimeShort(timeLeft)}
          </p>
        )}
      </div>
    </Link>
  );
}

function SaleList({ sales, rooms }) {
  const filteredRooms = useMemo(() => {
    const now = new Date();
    const activeSales = sales.filter((s) => new Date(s.tillDate) > now);

    const roomsById = new Map();
    for (const room of rooms) {
      const id = normalizeRoomId(room.wubid);
      if (id == null || roomsById.has(id)) continue;
      roomsById.set(id, room);
    }

    const saleByRoomId = new Map();
    for (const sale of activeSales) {
      const roomId = normalizeRoomId(sale.roomId);
      if (roomId == null) continue;
      const existing = saleByRoomId.get(roomId);
      if (
        !existing ||
        new Date(sale.tillDate) > new Date(existing.tillDate)
      ) {
        saleByRoomId.set(roomId, sale);
      }
    }

    const seenNames = new Set();
    const result = [];

    for (const [roomId, sale] of saleByRoomId) {
      const room = roomsById.get(roomId);
      if (!room) continue;

      const nameKey = normalizeName(room.name);
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);

      result.push({ ...room, sale });
    }

    return result;
  }, [sales, rooms]);

  if (filteredRooms.length === 0) {
    return (
      <p className="py-10 text-center font-finlandica text-[14px] text-brand-black/50">
        Немає активних акцій
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {filteredRooms.map((room) => (
        <li key={normalizeRoomId(room.wubid)}>
          <OneSale sale={room.sale} room={room} />
        </li>
      ))}
    </ul>
  );
}

export default SaleList;
