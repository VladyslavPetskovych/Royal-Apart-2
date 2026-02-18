const axios = require("axios");
const fs = require("fs");
const bot = require("./bot");
const path = require("path");

const tempImgDir = path.join(__dirname, "tempImg");
if (!fs.existsSync(tempImgDir)) fs.mkdirSync(tempImgDir, { recursive: true });

const API_URL = process.env.API_URL || "http://api:3000";
const CHECK_INTERVAL_MS = 3 * 60 * 1000; // 3 min (change to 2-4 hours when ready)

async function checkAndSendAdvert() {
  try {
    const response = await axios.get(`${API_URL}/advert/consume`, {
      validateStatus: () => true,
      timeout: 10000,
    });

    if (response.status === 404) return;
    if (response.status !== 200) {
      console.error("[Advert] Consume failed:", response.status);
      return;
    }

    const { msg, imgData } = response.data;
    const caption = msg || "";

    const chatIdsResponse = await axios.get(`${API_URL}/getAllUsers/AllUsers`, {
      timeout: 10000,
    });
    const chatIds = (chatIdsResponse.data.userIds || []).filter(Boolean);
    if (chatIds.length === 0) return;

    console.log("[Advert] Sending to", chatIds.length, "users");

    let tempImagePath = null;
    if (imgData) {
      const imageBuffer = Buffer.from(imgData, "base64");
      tempImagePath = path.join(tempImgDir, "tempImage.jpg");
      fs.writeFileSync(tempImagePath, imageBuffer);
    }

    for (let i = 0; i < chatIds.length; i++) {
      try {
        if (tempImagePath && fs.existsSync(tempImagePath)) {
          await bot.sendPhoto(chatIds[i], tempImagePath, { caption });
        } else {
          await bot.sendMessage(chatIds[i], caption);
        }
        await new Promise((r) => setTimeout(r, 50));
      } catch (err) {
        console.error(`[Advert] Error sending to ${chatIds[i]}:`, err.message);
      }
    }

    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }

    console.log("[Advert] Done");
  } catch (error) {
    if (error.response?.status === 404) return;
    console.error("[Advert] Error:", error.message);
  }
}

setInterval(checkAndSendAdvert, CHECK_INTERVAL_MS);
setTimeout(checkAndSendAdvert, 5000);
