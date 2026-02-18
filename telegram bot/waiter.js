const express = require("express");
const app = express();
const axios = require("axios");
const fs = require("fs");
const bot = require("./bot");
const path = require("path");
const cors = require("cors");

const tempImgDir = path.join(__dirname, "tempImg");
if (!fs.existsSync(tempImgDir)) fs.mkdirSync(tempImgDir, { recursive: true });

app.use(cors());
app.use("/tempImg", express.static("tempImg"));

const API_URL = process.env.API_URL || "http://api:3000";
const CHECK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes (for testing; change to 2-4 hours when ready)

async function checkAndSendAdvert() {
  try {
    const response = await axios.get(`${API_URL}/advert/consume`, {
      validateStatus: () => true,
      timeout: 10000,
    });

    if (response.status === 404) return;
    if (response.status !== 200) {
      console.error("Advert consume failed:", response.status, response.data);
      return;
    }

    const { msg, imgData } = response.data;
    const caption = msg || "";

    const chatIdsResponse = await axios.get(`${API_URL}/getAllUsers/AllUsers`, {
      timeout: 10000,
    });
    const chatIds = (chatIdsResponse.data.userIds || []).filter(Boolean);
    if (chatIds.length === 0) {
      console.log("No users to send advert to");
      return;
    }

    console.log("Sending advert to", chatIds.length, "users");

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
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error sending to ${chatIds[i]}:`, err.message);
      }
    }

    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }

    console.log("Advert sent to", chatIds.length, "users");
  } catch (error) {
    if (error.response?.status === 404) return;
    console.error("Error in advert check:", error.message);
    if (error.code) console.error("Error code:", error.code);
  }
}

setInterval(checkAndSendAdvert, CHECK_INTERVAL_MS);
setTimeout(checkAndSendAdvert, 5000); // First check after 5 sec (let bot initialize)

app.listen(3001, () => {
  console.log("Express server running on port 3001");
  console.log("Advert check every 3 minutes, API:", API_URL);
});
