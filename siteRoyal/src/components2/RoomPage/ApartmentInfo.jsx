import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import flowerImage from "../../assets/newDesign/home/flowerRight2.png";
import {
  Box,
  BedDouble,
  Users,
  Bath,
  Droplet,
  Tv,
  Wifi,
  WashingMachine,
  Star,
  Headphones,
} from "lucide-react";
import { formatApartmentNameForLang } from "../../utils/apartmentNameDisplay";

/** API bathroomType (UK/RU/EN variants) → i18n key */
function labelBathroomType(raw, t) {
  const s = String(raw ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFC");
  const keys = {
    душ: "room_bath_shower",
    shower: "room_bath_shower",
    джакузі: "room_bath_jacuzzi",
    джакузи: "room_bath_jacuzzi",
    jacuzzi: "room_bath_jacuzzi",
    ванна: "room_bath_bathtub",
    bathtub: "room_bath_bathtub",
  };
  const key = keys[s];
  if (key) return t(key);
  if (s.includes("душ") || s.includes("shower")) return t("room_bath_shower");
  if (s.includes("джакуз") || s.includes("jacuzz")) return t("room_bath_jacuzzi");
  if (s.includes("ванн") || s.includes("bath")) return t("room_bath_bathtub");
  return String(raw ?? "").trim() || "";
}

function IconWrap({ children }) {
  return (
    <span className="inline-flex h-[16px] w-[16px] items-center justify-center text-[#1b1b1b]/70">
      {children}
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center bg-[#ECE4D8] px-[10px] py-[6px] text-[12px] font-medium text-[#1b1b1b]">
      {children}
    </span>
  );
}

function FeatureRow({ icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <IconWrap>{icon}</IconWrap>
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1b1b1b]/80">
        {label}
      </span>
    </div>
  );
}

export default function ApartmentInfo({ apartment, status }) {
  const { t, i18n } = useTranslation();
  const [descDisplay, setDescDisplay] = useState("");

  useEffect(() => {
    const raw = apartment?.description || "";
    const lang = (i18n.language || "uk").split("-")[0];
    if (!raw) {
      setDescDisplay("");
      return;
    }
    if (lang === "uk") {
      setDescDisplay(raw);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(raw)}`
        );
        const data = await response.json();
        if (cancelled) return;
        if (data[0]) {
          const translated = data[0].map((seg) => seg[0]).join("");
          setDescDisplay(translated);
        } else {
          setDescDisplay(raw);
        }
      } catch {
        if (!cancelled) setDescDisplay(raw);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apartment?.description, i18n.language]);

  const additionalChips = useMemo(() => {
    if (!apartment) return [];
    const props = apartment?.additionalProperties || {};
    const out = [];
    if (props.checkInTime) {
      out.push(t("room_chip_check_in", { time: props.checkInTime }));
    }
    if (props.airConditioning) out.push(t("room_chip_ac"));
    if (props.elevator) out.push(t("room_chip_elevator"));
    if (props.bathroomType) {
      out.push(labelBathroomType(props.bathroomType, t));
    }
    if (props.balcony) out.push(t("room_chip_balcony"));
    if (props.walkingMinutesToCenter != null && props.walkingMinutesToCenter !== "") {
      out.push(
        t("room_chip_walk", { minutes: props.walkingMinutesToCenter })
      );
    }
    return out;
  }, [apartment, t]);

  const title = useMemo(() => {
    if (!apartment) return "";
    const raw = (apartment?.name || "").toString();
    const lang = (i18n.language || "uk").split("-")[0];
    const name =
      lang === "en"
        ? formatApartmentNameForLang(raw, "en").toUpperCase()
        : raw.toUpperCase();
    return `${t("room_street_prefix")} ${name}`;
  }, [apartment, t, i18n.language]);

  if (status !== "succeeded" || !apartment) return null;

  const surface = apartment?.surface ?? 75;
  const rooms = apartment?.numrooms ?? 2;
  const guests = apartment?.guests ?? 6;

  return (
    <section className="relative overflow-hidden bg-[#F8F5EF]">
      <img
        src={flowerImage}
        alt=""
        draggable={false}
        className="pointer-events-none select-none absolute right-0 top-[70px] w-[320px]  "
      />

      <div className="mx-auto w-full px-6 md:px-10 lg:px-20 py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[560px_1fr]">
          <div>
            <h1 className="font-finlandica text-[40px] leading-[1.05] text-start font-extrabold uppercase text-brand-black">
              {title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-brand-black/70">
              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <Box size={16} strokeWidth={2} />
                </IconWrap>
                {surface} {t("room_card_m2")}
              </span>

              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <BedDouble size={16} strokeWidth={2} />
                </IconWrap>
                {rooms} {t("room_meta_rooms")}
              </span>

              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <Users size={16} strokeWidth={2} />
                </IconWrap>
                {guests} {t("room_meta_guests")}
              </span>

              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <Bath size={16} strokeWidth={2} />
                </IconWrap>
                {t("room_meta_bath")}
              </span>
            </div>

            {additionalChips.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2 text-brand-beigeDark">
                {additionalChips.map((label, i) => (
                  <Chip key={i}>{label}</Chip>
                ))}
              </div>
            ) : null}

            <p className="mt-6 max-w-[520px] text-start text-[12px] leading-[1.7] text-[#1b1b1b]/70">
              {descDisplay}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-10 lg:pt-[140px]">
            <FeatureRow
              icon={<Wifi size={16} strokeWidth={2} />}
              label={t("room_feature_wifi")}
            />
            <FeatureRow
              icon={<Tv size={16} strokeWidth={2} />}
              label={t("room_feature_tv")}
            />
            <FeatureRow
              icon={<Headphones size={16} strokeWidth={2} />}
              label={t("room_feature_manager")}
            />
          </div>
        </div>

        <div className="mt-12 font-finlandica">
          <h2 className=" text-[22px] text-start font-extrabold uppercase tracking-[0.10em] text-[#1b1b1b]">
            {t("room_service_title")}
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[560px_1fr]">
            <p className="max-w-[520px] text-[12px] text-start leading-[1.75] text-[#1b1b1b]/70">
              {t("room_service_body")}
            </p>

            <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-1 sm:gap-x-14">
              <FeatureRow
                icon={<WashingMachine size={16} strokeWidth={2} />}
                label={t("room_feature_appliances")}
              />
              <FeatureRow
                icon={<Droplet size={16} strokeWidth={2} />}
                label={t("room_feature_utilities")}
              />
              <FeatureRow
                icon={<Star size={16} strokeWidth={2} />}
                label={t("room_feature_essentials")}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
