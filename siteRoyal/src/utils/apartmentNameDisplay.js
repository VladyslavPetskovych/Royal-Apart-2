import { slugify } from "transliteration";

/**
 * Latin, title-cased street name for English UI (Ukrainian Cyrillic → Latin via transliteration).
 */
export function transliterateStreetNameLatin(text) {
  const raw = (text ?? "").toString().trim();
  if (!raw) return "";
  const slug = slugify(raw, { lowercase: true, separator: "-" });
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Apartment / street `name` from API: unchanged for Ukrainian, transliterated for English.
 * @param {string} name
 * @param {string} lang - i18n language code (e.g. "en", "en-US", "uk")
 */
export function formatApartmentNameForLang(name, lang) {
  const raw = (name ?? "").toString().trim();
  if (!raw) return "";
  const code = (lang ?? "uk").split("-")[0].toLowerCase();
  if (code !== "en") return raw;
  return transliterateStreetNameLatin(raw);
}

/**
 * Lowercase haystack for search: original + Latin form (for EN keyboards).
 */
export function apartmentNameSearchHaystack(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return "";
  const latin = transliterateStreetNameLatin(raw).toLowerCase();
  const orig = raw.toLowerCase();
  return orig === latin ? orig : `${orig} ${latin}`;
}
