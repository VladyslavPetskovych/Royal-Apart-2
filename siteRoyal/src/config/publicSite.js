/**
 * Публічний origin сайту (без слешу в кінці).
 * Для staging/local можна задати VITE_SITE_ORIGIN у .env — у проді без зміни .env лишається production URL.
 */
const DEFAULT_SITE_ORIGIN = "https://royalapart.online";

function normalizeOrigin(raw) {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  return t.replace(/\/+$/, "");
}

export function getSiteOrigin() {
  const fromEnv = normalizeOrigin(import.meta.env.VITE_SITE_ORIGIN);
  return fromEnv || DEFAULT_SITE_ORIGIN;
}

/** Повний URL до API-шляху, напр. apiUrl("/api/aparts") */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${p}`;
}
