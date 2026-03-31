import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import ApartmentHero from "../../components2/RoomPage/ApartmentHero";
import ApartmentInfo from "../../components2/RoomPage/ApartmentInfo";
import ApartmentGallery from "../../components2/RoomPage/ApartmentGallery";
import ApartmentMap from "../../components2/RoomPage/ApartmentMap";
import {
  fetchApartments,
  selectApartments,
  selectApartStatus,
} from "../../redux/apartSlice";
import { selectLanguage } from "../../redux/languageSlice";
import YouMayAlsoLike from "../../components2/utils/YouMayAlsoLike";

export default function RoomPage() {
  const params = useParams();
  const wubid =
    params.roomId ?? params.wubid ?? params.id ?? Object.values(params)[0];

  const dispatch = useDispatch();
  const apartments = useSelector(selectApartments) || [];
  const status = useSelector(selectApartStatus);
  const lang = useSelector(selectLanguage);
  const { i18n } = useTranslation();

  useEffect(() => {
    const current = (i18n.language || "uk").split("-")[0];
    const target = (lang || "uk").split("-")[0];
    if (target && current !== target) {
      i18n.changeLanguage(target);
    }
  }, [lang, i18n]);

  useEffect(() => {
    if (status === "idle") dispatch(fetchApartments());
  }, [status, dispatch]);

  const apartment = useMemo(() => {
    const n = Number(wubid);
    if (!Number.isFinite(n)) return null;
    return apartments.find((a) => Number(a?.wubid) === n) || null;
  }, [apartments, wubid]);

  return (
    <div className="pt-16 bg-brand-black">
      <ApartmentHero wubid={wubid} apartments={apartments} status={status} />
      <ApartmentInfo apartment={apartment} status={status} />
      <ApartmentGallery apartment={apartment} status={status} />
      <ApartmentMap apartment={apartment} status={status} />
      <YouMayAlsoLike excludeWubid={wubid} />
    </div>
  );
}
