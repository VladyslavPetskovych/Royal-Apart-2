const express = require("express");
const app = express();
var cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");
const dbConfig = require("./db");

app.use(cors());

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

app.use("/aparts", apartRouter);
app.use("/users", userRouter);
app.use("/freeRooms", froomsRouter);
app.use("/getprices", pricesRouter);
app.use("/email", emailRouter);
app.use("/auth", authRouter);
app.use("/siteRoyal", siteRouter);
app.use("/advert", advertRouter);
app.use("/getAllUsers", allchatIdRouter);
app.use("/sales", salesRouter)
app.use("/analis", wubookRouter);

cron.schedule("0 * * * *", async () => {
  try {

    const response = await axios.delete("https://royalapart.online/api/sales/delete-expired");
    console.log(response.data);
    await axios.get(
      "https://royalapart.online/api/getprices"
    );
    console.log("First request: Prices updated successfully.");

    await axios.get(
      "https://royalapart.online/api/getprices/setPrice"
    );
    console.log("Second request: Successfully fetched data.");
  } catch (error) {
    console.error("Error:", error);
  }
});

app.listen(3000);
