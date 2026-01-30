import React from "react";

export default function SearchBar({
  value = "",
  onChange,
  onClear,
  placeholder = "Пошук апартаментів…",
}) {
  return (
    <div className="mt-6">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="
            w-full
            rounded-xl
            border border-black/10
            bg-white
            px-11 py-3
            font-finlandica
            text-[14px]
            text-black/80
            outline-none
            placeholder:text-black/35
            focus:border-black/20
          "
        />

        {/* left icon */}
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M16.5 16.5 21 21"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* clear button */}
        {value?.trim?.() ? (
          <button
            type="button"
            onClick={() => onClear?.()}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              rounded-lg px-2 py-1
              text-black/40 hover:text-black
              transition
            "
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
