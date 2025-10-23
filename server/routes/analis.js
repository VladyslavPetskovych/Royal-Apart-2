const express = require("express");
const router = express.Router();
const advertModel = require("../models/adverts");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

router.get("/PreviousData", upload.single("image"), async (req, res) => {
  
});