// API access control.
//
// Levels:
//   public   - anyone (website)
//   internal - services only (telegram bot, server cron, ml): header x-api-key = INTERNAL_API_KEY
//   admin    - internal key OR admin JWT from POST /auth/login (Authorization: Bearer <token>)
//
// Safe rollout (nothing changes until configured):
//   INTERNAL_API_KEY unset       -> internal endpoints stay open (warning logged once)
//   ADMIN_AUTH_ENFORCE != "true" -> admin endpoints stay open (warning logged once)
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const ADMIN_AUTH_ENFORCE = process.env.ADMIN_AUTH_ENFORCE === "true";
const ADMIN_TOKEN_TTL = "12h";

// Base URLs of this API that internal calls (cron, email) go through
const SELF_URLS = ["https://royalapart.online/api", "http://localhost:3000", "http://api:3000"];

const warned = new Set();
const warnOnce = (key, message) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[auth] ${message}`);
};

const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));

const hasInternalKey = (req) => {
  const key = req.get("x-api-key");
  return Boolean(INTERNAL_API_KEY && key && safeEqual(key, INTERNAL_API_KEY));
};

const hasAdminToken = (req) => {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !ADMIN_JWT_SECRET) return false;
  try {
    const payload = jwt.verify(match[1], ADMIN_JWT_SECRET, { algorithms: ["HS256"] });
    return payload && payload.role === "admin";
  } catch (_e) {
    return false;
  }
};

const deny = (res) => res.status(401).json({ error: "Unauthorized" });

const checkInternal = (req, res, next) => {
  if (!INTERNAL_API_KEY) {
    warnOnce("internal", "INTERNAL_API_KEY is not set: internal endpoints are NOT protected");
    return next();
  }
  return hasInternalKey(req) ? next() : deny(res);
};

const checkAdmin = (req, res, next) => {
  if (!ADMIN_AUTH_ENFORCE) {
    warnOnce("admin", "ADMIN_AUTH_ENFORCE is not 'true': admin endpoints are NOT protected");
    return next();
  }
  return hasInternalKey(req) || hasAdminToken(req) ? next() : deny(res);
};

// Services only, closed by default: without INTERNAL_API_KEY configured nobody gets in.
// For endpoints added together with this protection (no old clients to keep working).
const checkInternalStrict = (req, res, next) => {
  if (!INTERNAL_API_KEY) {
    warnOnce("strict", "INTERNAL_API_KEY is not set: service-only endpoints are disabled");
    return res.status(503).json({ error: "Not configured" });
  }
  return hasInternalKey(req) ? next() : deny(res);
};

const CHECKS = { public: (req, res, next) => next(), internal: checkInternal, admin: checkAdmin };

// Whole router at one level
const requireInternal = checkInternal;
const requireAdmin = checkAdmin;
const requireService = checkInternalStrict;

// Mixed router: first matching rule wins, anything not listed is "admin".
// rules: [{ method: "GET", path: /^\/all\/?$/i, level: "public" }]
const accessRules = (rules) => (req, res, next) => {
  if (req.method === "OPTIONS") return next(); // CORS preflight
  const rule = rules.find((r) => r.method === req.method && r.path.test(req.path));
  return CHECKS[rule ? rule.level : "admin"](req, res, next);
};

const signAdminToken = () =>
  ADMIN_JWT_SECRET
    ? jwt.sign({ role: "admin" }, ADMIN_JWT_SECRET, { algorithm: "HS256", expiresIn: ADMIN_TOKEN_TTL })
    : null;

// Adds the internal key to this server's own calls to its API (cron jobs, email route)
const attachInternalKey = (axios) => {
  axios.interceptors.request.use((config) => {
    const url = String(config.url || "");
    if (INTERNAL_API_KEY && SELF_URLS.some((base) => url.startsWith(base))) {
      config.headers = config.headers || {};
      config.headers["x-api-key"] = INTERNAL_API_KEY;
    }
    return config;
  });
};

module.exports = {
  requireInternal,
  requireAdmin,
  requireService,
  accessRules,
  signAdminToken,
  attachInternalKey,
  safeEqual,
};
