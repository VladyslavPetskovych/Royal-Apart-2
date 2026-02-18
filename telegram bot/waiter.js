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

const CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

async function checkAndSendAdvert() {
  try {
    const response = await axios.get(
      "https://royalapart.online/api/advert/consume",
      { validateStatus: () => true }
    );

    if (response.status !== 200) return;

    const { msg, imgData } = response.data;
    const caption = msg || "";

    const chatIdsResponse = await axios.get(
      "https://royalapart.online/api/getAllUsers/AllUsers"
    );
    const chatIds = chatIdsResponse.data.userIds || [];
    if (chatIds.length === 0) return;

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
    // 404 is expected when no advert - ignore
    if (error.response?.status !== 404) {
      console.error("Error in advert check:", error.message);
    }
  }
}

setInterval(checkAndSendAdvert, CHECK_INTERVAL_MS);
checkAndSendAdvert(); // Run once on startup

app.listen(3001, () => {
  console.log("Express server running on port 3001");
  console.log("Advert check every 2 minutes");
});
