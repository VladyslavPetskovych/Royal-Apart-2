const express = require("express");
const { signAdminToken, safeEqual } = require("../middleware/auth");

require("dotenv").config();

const router = express.Router();
router.use(express.json());

// Brute-force protection: max failed attempts per IP per window
const MAX_FAILS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map(); // ip -> { count, start }

const clientIp = (req) => req.get("x-real-ip") || req.ip;

router.post("/login", (req, res) => {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = fails.get(ip);
  if (entry && now - entry.start > WINDOW_MS) fails.delete(ip);
  if (fails.get(ip)?.count >= MAX_FAILS) {
    return res.status(429).json({ message: "Too many attempts, try again later" });
  }

  const { login, password } = req.body || {};
  const envLogin = process.env.LGTOKEN;
  const envPassword = process.env.PSTOKEN;

  const valid =
    Boolean(envLogin && envPassword) &&
    typeof login === "string" &&
    typeof password === "string" &&
    safeEqual(login, envLogin) &&
    safeEqual(password, envPassword);

  if (valid) {
    fails.delete(ip);
    return res.status(200).json({ message: "Login successful", token: signAdminToken() });
  }

  const current = fails.get(ip) || { count: 0, start: now };
  current.count++;
  fails.set(ip, current);
  console.warn(`[auth] Failed admin login from ${ip}`);
  return res.status(401).json({ message: "Invalid credentials" });
});

module.exports = router;
