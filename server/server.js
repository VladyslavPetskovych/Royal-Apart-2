const express = require("express");
const app = express();
var cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");
const dbConfig = require("./db");
const {
  requireInternal,
  requireAdmin,
  accessRules,
  attachInternalKey,
} = require("./middleware/auth");

attachInternalKey(axios);

app.use(cors());
app.use(express.json());
app.use("/imgs", express.static("imgs"));
app.use("/imgsRoyal", express.static("imgsRoyal"));
app.use("/advertImgs", express.static("advertImgs"));
app.get("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json({ text: " 53 квартири на сьогодні" });
});

const apartRouter = require("./routes/apart");
const userRouter = require("./routes/user");
const froomsRouter = require("./routes/freeRooms");
const pricesRouter = require("./routes/getprices");
const emailRouter = require("./routes/email");
const authRouter = require("./routes/auth");
const siteRouter = require("./routes/siteRoyal");
const advertRouter = require("./routes/advert");
const allchatIdRouter = require("./routes/getAllUsers");
const salesRouter = require("./routes/sales")
const wubookRouter = require("./routes/analis");
const forecastRouter = require('./routes/forecast');
const revenueRouter = require("./routes/revenue");
const adminStatsRouter = require("./routes/adminStats");

// Access levels (see middleware/auth.js). In mixed routers anything not listed is admin-only.
// public: website · internal: telegram bot / cron · admin: admin panel (JWT) or internal key
app.use('/forecast', requireAdmin, forecastRouter);
app.use(
  "/aparts",
  accessRules([{ method: "GET", path: /^\/?$/, level: "public" }]),
  apartRouter
);
app.use("/users", requireInternal, userRouter);
app.use("/freeRooms", requireInternal, froomsRouter);
app.use(
  "/getprices",
  accessRules([{ method: "GET", path: /^\/getprices\/?$/i, level: "internal" }]),
  pricesRouter
);
app.use("/email", requireInternal, emailRouter);
app.use("/auth", authRouter);
app.use(
  "/siteRoyal",
  accessRules([
    { method: "GET", path: /^\/copied-rooms\/?$/i, level: "public" },
    { method: "GET", path: /^\/get-all-wodoo\/?$/i, level: "public" },
  ]),
  siteRouter
);
app.use(
  "/advert",
  accessRules([{ method: "GET", path: /^\/consume\/?$/i, level: "internal" }]),
  advertRouter
);
app.use("/getAllUsers", requireInternal, allchatIdRouter);
app.use(
  "/sales",
  accessRules([{ method: "GET", path: /^\/[^/]+\/?$/, level: "public" }]), // /all and /:roomId
  salesRouter
)
app.use("/analis", requireAdmin, wubookRouter);
app.use("/revenue", requireAdmin, revenueRouter);
app.use("/adminStats", requireAdmin, adminStatsRouter);

// Proxy to Telegram bot (getData - send adverts to users)


// Runs every 2 hours (00:00, 02:00, 04:00, ...).
// Each step runs independently so one failure doesn't block the price update.
cron.schedule("0 */2 * * *", async () => {
  try {
    const response = await axios.delete("https://royalapart.online/api/sales/delete-expired");
    console.log(response.data);
  } catch (error) {
    console.error("Error deleting expired sales:", error.message);
  }

  try {
    await axios.get(
      "https://royalapart.online/api/getprices"
    );
    console.log("First request: Prices updated successfully.");
  } catch (error) {
    console.error("Error updating globalIds:", error.message);
  }

  try {
    await axios.get(
      "https://royalapart.online/api/getprices/setPrice"
    );
    console.log("Second request: Successfully fetched data.");
  } catch (error) {
    console.error("Error setting prices:", error.message);
  }
});

app.listen(3000);

// Background sync of Zak reservations for analytics / forecasting (ZAK_SYNC=off disables)
require("./services/zakSync").start();
