import React from "react";
import {
  AirVent,
  ArrowUpDown,
  Bath,
  ShowerHead,
  Sun,
  Waves,
} from "lucide-react";
import roomFilterIcon from "../../../assets/roomFilterIcon.png";

const squareBtnClass = (active) =>
  [
    "flex flex-col items-center justify-center gap-1.5 w-[72px] h-[72px] rounded-lg border transition-all duration-200 shrink-0",
    active
      ? "border-black bg-black text-white shadow-sm"
      : "border-black/15 bg-white text-black hover:border-black/40",
  ].join(" ");

export default function RoomsIconFilter({
  value: roomsValue = "all",
  onChange: onRoomsChange,
  filter = {},
  setFilter = () => {},
}) {
  const airCond = filter.airConditioning;
  const elevator = filter.elevator;
  const bathroomType = filter.bathroomType ?? "all";
  const balcony = filter.balcony;

  const roomItems = [
    { key: "1", label: "1", sub: "кімн." },
    { key: "2", label: "2", sub: "кімн." },
    { key: "3", label: "3", sub: "кімн." },
  ];

  const bathroomItems = [
    { key: "душ", label: "Душ", Icon: ShowerHead },
    { key: "джакузі", label: "Джакузі", Icon: Waves },
    { key: "ванна", label: "Ванна", Icon: Bath },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {/* Rooms */}
      {roomItems.map((it) => {
        const active = String(roomsValue) === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onRoomsChange(active ? "all" : it.key)}
            className={squareBtnClass(active)}
            title={`${it.label} ${it.sub}`}
          >
            <img
              src={roomFilterIcon}
              alt=""
              width={22}
              height={22}
              className={active ? "invert" : ""}
            />
            <span className="text-[11px] font-medium leading-tight">
              {it.label} {it.sub}
            </span>
          </button>
        );
      })}

      {/* Amenities */}
      <button
        type="button"
        onClick={() =>
          setFilter((p) => ({
            ...p,
            airConditioning: p.airConditioning === true ? null : true,
          }))
        }
        className={squareBtnClass(airCond === true)}
        title="Кондиціонер"
      >
        <AirVent size={22} strokeWidth={1.8} />
        <span className="text-[10px] font-medium leading-tight text-center px-0.5">Кондиціонер</span>
      </button>

      <button
        type="button"
        onClick={() =>
          setFilter((p) => ({
            ...p,
            elevator: p.elevator === true ? null : true,
          }))
        }
        className={squareBtnClass(elevator === true)}
        title="Ліфт"
      >
        <ArrowUpDown size={22} strokeWidth={1.8} />
        <span className="text-[10px] font-medium leading-tight text-center">Ліфт</span>
      </button>

      {bathroomItems.map(({ key, label, Icon }) => {
        const active = bathroomType === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() =>
              setFilter((p) => ({
                ...p,
                bathroomType: active ? "all" : key,
              }))
            }
            className={squareBtnClass(active)}
            title={label}
          >
            <Icon size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() =>
          setFilter((p) => ({
            ...p,
            balcony: p.balcony === true ? null : true,
          }))
        }
        className={squareBtnClass(balcony === true)}
        title="Балкон"
      >
        <Sun size={22} strokeWidth={1.8} />
        <span className="text-[10px] font-medium leading-tight text-center">Балкон</span>
      </button>
    </div>
  );
}
