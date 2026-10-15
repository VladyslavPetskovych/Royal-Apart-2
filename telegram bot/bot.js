const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");
require('dotenv').config();

const tokenT = process.env.token;

const bot = new TelegramApi(tokenT, { polling: true });

// Authenticate the bot's calls to our own API (no-op until INTERNAL_API_KEY is set)
const API_BASE = "https://royalapart.online/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";
axios.interceptors.request.use((config) => {
  if (INTERNAL_API_KEY && String(config.url || "").startsWith(API_BASE)) {
    config.headers = config.headers || {};
    config.headers["x-api-key"] = INTERNAL_API_KEY;
  }
  return config;
});

module.exports = bot
