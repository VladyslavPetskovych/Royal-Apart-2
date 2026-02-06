import React from "react";
import { useTranslation } from "react-i18next";

// ✅ replace these imports with your real filenames/paths
import v1 from "../../assets/instagram/vid1.mp4";
import v2 from "../../assets/instagram/vid2.mp4";
import v3 from "../../assets/instagram/vid3.mp4";
import v4 from "../../assets/instagram/vid4.mp4";
import v5 from "../../assets/instagram/vid5.mp4";
import v6 from "../../assets/instagram/vid6.mp4";

function IgTile({ src, href, startAt = 0 }) {
  const onLoaded = (e) => {
    e.currentTarget.currentTime = startAt;
  };

  const onEnter = (e) => {
    const v = e.currentTarget;
    if (v.paused) {
      v.play().catch(() => {});
    }
  };

  const onEnded = (e) => {
    const v = e.currentTarget;
    v.currentTime = startAt; // ⬅ reset to placeholder frame
    v.pause();
  };

  return (
    <a href={href} target="_blank" rel="noreferrer">
      <div className="relative aspect-square w-full">
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onMouseEnter={onEnter}
          onEnded={onEnded}
          className="h-full w-full object-cover"
        />
      </div>
    </a>
  );
}

export default function Instagram() {
  const { t } = useTranslation();
  const items = [
    { src: v1, href: "https://www.instagram.com/p/DOAzGxUiPzN/" },
    { src: v2, href: "https://www.instagram.com/p/DKRcNzoo0c-/" },
    { src: v3, href: "https://www.instagram.com/p/DKVCGiLoUY9/" },
    { src: v4, href: "https://www.instagram.com/p/DNNd939I56V/" },
    { src: v5, href: "https://www.instagram.com/p/DRMawNsiAru/" },
    { src: v6, href: "https://www.instagram.com/p/DLh1IrBIEGt/" },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-12">
        <h2 className="font-finlandica text-[18px] font-semibold uppercase tracking-[0.14em] text-black">
          {t("follow_instagram")}
        </h2>

        {/* row like on screenshot */}
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {items.map((it, idx) => (
            <IgTile key={idx} src={it.src} href={it.href} />
          ))}
        </div>
      </div>
    </section>
  );
}
