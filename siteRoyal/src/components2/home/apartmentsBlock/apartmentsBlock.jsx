import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ApartmentsGrid from "./ApartmentsGrid";
import ApartmentsHeader from "./ApartmentsHeader";

export default function ApartmentsBlock() {
  const apartments = useSelector((s) => s.apartStore.apartments) || [];

  const [limit, setLimit] = useState(12);

  // ✅ filters (strings because <select/> uses string values)
  const [filter, setFilter] = useState({
    rooms: "all",
    floor: "all",
    guests: "all",
    airConditioning: null,
    elevator: null,
    bathroomType: "all",
    balcony: null,
  });

  useEffect(() => {
    const updateLimit = () => {
      const width = window.innerWidth;
      if (width < 768) setLimit(4);
      else if (width < 1024) setLimit(8);
      else setLimit(12);
    };

    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  // ✅ build dropdown options from data
  const { roomsOptions, floorsOptions, guestsOptions } = useMemo(() => {
    const r = new Set();
    const f = new Set();
    const g = new Set();

    apartments.forEach((a) => {
      if (Number.isFinite(a?.numrooms)) r.add(a.numrooms);
      if (Number.isFinite(a?.floor)) f.add(a.floor);
      if (Number.isFinite(a?.guests)) g.add(a.guests);
    });

    const sortNum = (arr) => arr.sort((x, y) => x - y);

    return {
      roomsOptions: sortNum(Array.from(r)),
      floorsOptions: sortNum(Array.from(f)),
      guestsOptions: sortNum(Array.from(g)),
    };
  }, [apartments]);

  // ✅ apply filters
  const filtered = useMemo(() => {
    const roomsVal = filter.rooms === "all" ? null : Number(filter.rooms);
    const floorVal = filter.floor === "all" ? null : Number(filter.floor);
    const guestsVal = filter.guests === "all" ? null : Number(filter.guests);
    const airCondVal = filter.airConditioning;
    const elevatorVal = filter.elevator;
    const bathroomVal = filter.bathroomType === "all" ? null : filter.bathroomType;
    const balconyVal = filter.balcony;

    return apartments.filter((a) => {
      if (roomsVal !== null && Number(a?.numrooms) !== roomsVal) return false;
      if (floorVal !== null && Number(a?.floor) !== floorVal) return false;
      if (guestsVal !== null && Number(a?.guests) < guestsVal) return false;

      const props = a?.additionalProperties || {};
      if (airCondVal !== null && airCondVal !== undefined) {
        if (!!props.airConditioning !== airCondVal) return false;
      }
      if (elevatorVal !== null && elevatorVal !== undefined) {
        if (!!props.elevator !== elevatorVal) return false;
      }
      if (bathroomVal) {
        const aptVal = String(props.bathroomType ?? "").toLowerCase().trim();
        const aliases = {
          душ: ["душ", "shower"],
          джакузі: ["джакузі", "jacuzzi", "джакузи"],
          ванна: ["ванна", "bathtub"],
        };
        const matchList = aliases[bathroomVal.toLowerCase()] || [bathroomVal.toLowerCase()];
        if (!matchList.some((m) => aptVal === m || aptVal.includes(m))) return false;
      }
      if (balconyVal !== null && balconyVal !== undefined) {
        if (!!props.balcony !== balconyVal) return false;
      }

      return true;
    });
  }, [
    apartments,
    filter.rooms,
    filter.floor,
    filter.guests,
    filter.airConditioning,
    filter.elevator,
    filter.bathroomType,
    filter.balcony,
  ]);

  const visible = filtered.slice(0, limit);

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 pb-16 pt-10">
        <ApartmentsHeader
          roomsOptions={roomsOptions}
          floorsOptions={floorsOptions}
          guestsOptions={guestsOptions}
          filter={filter}
          setFilter={setFilter}
        />

        <ApartmentsGrid apartments={visible} />
      </div>
    </section>
  );
}
