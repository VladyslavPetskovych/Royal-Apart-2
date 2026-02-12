import React from "react";

export default function RoomsIconFilter({ value = "all", onChange }) {
  const items = [
    { key: "1", label: "1 кімната" },
    { key: "2", label: "2 кімнати" },
    { key: "3", label: "3 кімнати" },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {items.map((it) => {
        const active = String(value) === it.key;

        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(active ? "all" : it.key)}
            className={[
              "flex items-center gap-2 rounded-xl border px-4 py-2 transition-all duration-200",
              active
                ? "border-black bg-black text-white shadow-sm"
                : "border-black/15 bg-white text-black hover:border-black/40",
            ].join(" ")}
          >
            {/* Modern Bed Icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* headboard */}
              <rect x="3" y="6" width="4" height="6" rx="1" />

              {/* mattress */}
              <rect x="7" y="9" width="14" height="5" rx="1" />

              {/* base */}
              <path d="M3 14h18v3" />
            </svg>

            <span className="text-sm font-medium">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
