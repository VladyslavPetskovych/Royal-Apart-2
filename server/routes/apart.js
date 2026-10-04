const express = require("express");
const router = express.Router();
let Roomsr = require("../models/rooms");
router.use(express.json());
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const axios = require('axios')
const mongoose = require("mongoose");
const { sortRooms, getTopSortOrder } = require("../services/roomOrder");

require("dotenv").config();

router.get("/", async (req, res) => {
  try {
    let rooms = await Roomsr.find({});
    rooms = sortRooms(rooms);

    return res.json({ data: rooms });
  } catch (error) {
    console.log("all rooms" + error);
  }
});
router.get("/roomType", async (req, res) => {
  try {

    const response = await axios.post(
      "https://kapi.wubook.net/kp/property/fetch_rooms",
      {},
      {
        headers: {
          "x-api-key": process.env.WUDOO_API_KEY,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
        },
      }
    );

    res.json(response.data);
  } catch (error) {

    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    console.log(roomId);

    const room = await Roomsr.findById(roomId);
    console.log(room);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const imagePath = path.join(__dirname, "../imgs", room.imgurl[0]);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Roomsr.findByIdAndDelete(roomId);

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ error: "Server error" });
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../imgs"));
  },
  filename: function (req, file, cb) {
    const hash = crypto
      .createHash("md5")
      .update(file.originalname)
      .digest("hex");
    cb(null, `${hash}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Save room display order from admin panel drag & drop.
// body: { order: ["<roomId>", "<roomId>", ...] } — first id = shown first.
// Also syncs sortOrder into copy_aparts / wodoo_aparts (same matching as copy-db),
// so the site order changes immediately without "Оновити дані на сайті".
router.post("/reorder", async (req, res) => {
  try {
    const order = Array.isArray(req.body?.order) ? req.body.order : null;
    if (!order || order.length === 0) {
      return res.status(400).json({ error: "order must be a non-empty array of room ids" });
    }

    const ids = order
      .map((id) => String(id))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    await Roomsr.bulkWrite(
      ids.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { sortOrder: index } },
        },
      }))
    );

    const rooms = await Roomsr.find({ _id: { $in: ids } })
      .select("name wubid sortOrder")
      .lean();

    const db = mongoose.connection.useDb("apartments");
    const copyCollection = db.collection("copy_aparts");
    const wodooCollection = db.collection("wodoo_aparts");

    for (const room of rooms) {
      try {
        await copyCollection.updateOne(
          { name: room.name },
          { $set: { sortOrder: room.sortOrder } }
        );
        const matchQuery =
          room.wubid != null ? { wubid: room.wubid } : { name: room.name };
        await wodooCollection.updateOne(matchQuery, {
          $set: { sortOrder: room.sortOrder },
        });
      } catch (syncErr) {
        console.error(`Error syncing sortOrder for '${room.name}':`, syncErr);
      }
    }

    return res.json({ message: "Order saved", count: ids.length });
  } catch (error) {
    console.error("Error saving room order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", upload.single("file"), async (req, res) => {
  const roomId = req.params.id;
  const updatedData = { ...req.body };

  try {

    const room = await Roomsr.findById(roomId);

    if (!room) {

      return res.status(404).json({ error: "Room not found" });
    }

    if (req.body.additionalProperties) {
      try {
        updatedData.additionalProperties = typeof req.body.additionalProperties === "string"
          ? JSON.parse(req.body.additionalProperties)
          : req.body.additionalProperties;
      } catch (e) {
        console.warn("Could not parse additionalProperties:", e.message);
      }
    }

    if (req.file) {

      const previousFile = room.imgurl[0];
      const previousFilePath = path.join(__dirname, "../imgs", previousFile);
      if (fs.existsSync(previousFilePath)) {
        fs.unlinkSync(previousFilePath);
        console.log(`Previous file ${previousFile} deleted`);
      }


      const fileName = req.file.filename;
      updatedData.imgurl = [fileName];
      console.log(fileName);
      console.log("Saving file to disk:", req.file);

      const targetPath = path.join(__dirname, "../imgs", fileName);
      fs.renameSync(req.file.path, targetPath);

      console.log("File saved to disk:", targetPath);
    }

    const updatedRoom = await Roomsr.findByIdAndUpdate(roomId, updatedData, {
      new: true,
    });

    return res.json({
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Error updating room:", error);

    return res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/newRoom", upload.single("image"), async (req, res) => {
  try {
    const {
      address, body, category, roomcount, price, floor, beds, guests, square, wubid, wdid,
      additionalProperties,
    } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }
    let parsedAdditional = {};
    if (additionalProperties) {
      try {
        parsedAdditional = typeof additionalProperties === "string"
          ? JSON.parse(additionalProperties)
          : additionalProperties;
      } catch (e) {
        console.warn("Could not parse additionalProperties:", e.message);
      }
    }
    // new rooms are shown first
    let sortOrder = 0;
    try {
      sortOrder = await getTopSortOrder(Roomsr);
    } catch (e) {
      console.warn("Could not compute sortOrder for new room:", e.message);
    }
    const newRoom = new Roomsr({
      name: address, 
      numrooms: roomcount,
      description: body,
      category: category,
      price: price,
      imgurl: req.file.filename, 
      beds: beds,
      guests: guests,
      floor: floor,
      surface: square,
      wubid: wubid,
      wdid: wdid,
      sortOrder: sortOrder,
      additionalProperties: parsedAdditional,
    });
    await newRoom.save();
    res.status(201).json({ message: "Room created successfully" });
  } catch (error) {
    console.error("Error saving room:", error);
    res.status(500).json({ message: "Failed to save room" });
  }
});

module.exports = router;


