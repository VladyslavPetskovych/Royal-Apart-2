import React, { useMemo } from "react";
import flowerImage from "../../assets/newDesign/home/flowerRight2.png";
import {
  Square,
  BedDouble,
  Users,
  Bath,
  Droplet,
  Tv,
  Coffee,
  Wifi,
  WashingMachine,
  Star,
  Headphones,
} from "lucide-react";

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

const ADDITIONAL_PROP_LABELS = {
  checkInTime: (v) => (v ? `Заїзд ${v}` : null),
  airConditioning: (v) => (v ? "Кондиціонер" : null),
  elevator: (v) => (v ? "Ліфт" : null),
  bathroomType: (v) => (v ? String(v) : null),
  balcony: (v) => (v ? "Балкон" : null),
  walkingMinutesToCenter: (v) =>
    v != null && v !== "" ? `${v} хв до центру` : null,
};

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
  if (status !== "succeeded" || !apartment) return null;

  const title = useMemo(() => {
    const name = (apartment?.name || "").toString().toUpperCase();
    return `ВУЛ. ${name}`;
  }, [apartment]);

  const surface = apartment?.surface ?? 75;
  const beds = apartment?.beds ?? 2;
  const guests = apartment?.guests ?? 6;

  return (
    <section className="relative overflow-hidden bg-[#F8F5EF]">
      {/* flower watermark on the right */}
      <img
        src={flowerImage}
        alt=""
        draggable={false}
        className="pointer-events-none select-none absolute right-0 top-[70px] w-[320px]  "
      />

      <div className="mx-auto w-full px-6 md:px-10 lg:px-20 py-14">
        {/* top grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[560px_1fr]">
          {/* LEFT column */}
          <div>
            <h1 className="font-finlandica text-[40px] leading-[1.05] text-start font-extrabold uppercase text-brand-black">
              {title}
            </h1>

            {/* meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-brand-black/70">
              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <Square size={16} strokeWidth={2} />
                </IconWrap>
                {surface} m2
              </span>

              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <BedDouble size={16} strokeWidth={2} />
                </IconWrap>
                {beds} Спальні
              </span>

              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <Users size={16} strokeWidth={2} />
                </IconWrap>
                {guests} Осіб
              </span>

              <span className="inline-flex items-center gap-2">
                <IconWrap>
                  <Bath size={16} strokeWidth={2} />
                </IconWrap>
                1 Ванна Кімната
              </span>
            </div>

            {/* chips from additionalProperties */}
            {(() => {
              const props = apartment?.additionalProperties || {};
              const chips = Object.entries(ADDITIONAL_PROP_LABELS)
                .map(([key, fn]) => fn(props[key]))
                .filter(Boolean);
              if (chips.length === 0) return null;
              return (
                <div className="mt-5 flex flex-wrap gap-2 text-brand-beigeDark">
                  {chips.map((label, i) => (
                    <Chip key={i}>{label}</Chip>
                  ))}
                </div>
              );
            })()}

            {/* description */}
            <p className="mt-6 max-w-[520px] text-start text-[12px] leading-[1.7] text-[#1b1b1b]/70">
              {apartment.description}
            </p>
          </div>

          {/* RIGHT column (features) */}
          <div className="flex flex-col gap-4 pt-10 lg:pt-[140px]">
            <FeatureRow
              icon={<Wifi size={16} strokeWidth={2} />}
              label="БЕЗКОШТОВНИЙ WI-FI"
            />
            <FeatureRow
              icon={<Tv size={16} strokeWidth={2} />}
              label="ТЕЛЕВІЗОР SMART TV"
            />
            <FeatureRow
              icon={<Headphones size={16} strokeWidth={2} />}
              label="ДОПОМОГА МЕНЕДЖЕРА 24/7"
            />
          </div>
        </div>

        {/* service section */}
        <div className="mt-12 font-finlandica">
          <h2 className=" text-[22px] text-start font-extrabold uppercase tracking-[0.10em] text-[#1b1b1b]">
            НАШ СЕРВІС
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[560px_1fr]">
            {/* paragraph */}
            <p className="max-w-[520px] text-[12px] text-start leading-[1.75] text-[#1b1b1b]/70">
              Адаптуючи кожен візит до потреб наших гостей, наша місія полягає в
              тому, щоб зробити ваше перебування унікальним і незабутнім, а
              також забезпечити вам найкращий можливий досвід. Наша команда,
              доступна в будь-який час протягом усього перебування, може
              допомогти вам з будь-якими конкретними запитами або додатковими
              послугами.
            </p>

            {/* services list (2 columns) */}
            <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-1 sm:gap-x-14">
              <FeatureRow
                icon={<WashingMachine size={16} strokeWidth={2} />}
                label="ПОБУТОВА ТЕХНІКА"
              />
              <FeatureRow
                icon={<Droplet size={16} strokeWidth={2} />}
                label="БЕЗКОШТОВНІ КОМУНАЛЬНІ ПОСЛУГИ"
              />
              <FeatureRow
                icon={<Star size={16} strokeWidth={2} />}
                label="УСЕ НЕОБХІДНЕ"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
