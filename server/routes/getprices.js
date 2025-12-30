const express = require("express");
const router = express.Router();
const axios = require('axios');
const Roomsrr = require("../models/rooms");
require("dotenv").config();

router.get("/", async (req, res) => {
  try {
    const apiUrl = 'https://kapi.wubook.net/kp/property/fetch_products';
    const apiKey = process.env.WUDOO_API_KEY; 
    const response = await axios.post(apiUrl, {}, {
      headers: {
        'x-api-key': apiKey,
      },
    });
    const responseData = response.data.data;
    for (const room of responseData) {
      try {
        const updateResult = await Roomsrr.updateOne(
          { wubid: room.id_zak_room_type },
          {
            $set: {
              globalId: room.id, 
            }
          }
        );
        if (updateResult.nModified > 0) {
          console.log('Updated globalId in MongoDB:', updateResult);
        } else {
          console.log('Document not found for wubid:', room.id_zak_room_type);
        }
      } catch (error) {
        console.error('Error updating MongoDB:', error.message);
      }
    }
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching prices:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get("/setPrice", async (req, res) => {
  try {
    const apiUrl = 'https://kapi.wubook.net/kp/inventory/fetch_rate_values';
    const apiKey = process.env.WUDOO_API_KEY; 
    let currentDate = new Date();
    let formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
    const response = await axios.post(apiUrl, null, {
      params: {
        from: formattedDate,
        rate: 31732,
        n: 1,
      },
      headers: {
        'x-api-key': apiKey,
      },
    });
    const responseData = response.data.data;
    for (const roomId in responseData) {
      const priceData = responseData[roomId][0];
      const updatedRoom = await Roomsrr.findOneAndUpdate(
        { globalId: parseInt(roomId) },
        { $set: { price: priceData.p } },
        { new: true }
      );
      if (updatedRoom) {
        console.log(`Updated price for room with globalId ${roomId} to ${priceData.p}`);
      } else {
        console.log(`Room with globalId ${roomId} not found in MongoDB`);
      }
    }
    res.json(responseData);
  } catch (error) {
    console.error('Error setting price:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/getPrices', async (req, res) => {
    try {
      const apiUrl = 'https://kapi.wubook.net/kp/inventory/fetch_rate_values';
      const apiKey = process.env.WUDOO_API_KEY; // Replace with your actual API key
  
      // Extract parameters from the request query
      const formattedDate = req.query.formattedDate;
      const n = req.query.n;
  
      // Check if parameters are present, otherwise throw an error
      if (!formattedDate || !n) {
        throw new Error('Missing required parameters: formattedDate and n');
      }
  
      // http://localhost:3000/getprices/getPrices?formattedDate=8/3/2024&n=15
      const response = await axios.post(apiUrl, null, {
        params: {
          from: formattedDate,
          rate: 31732,
          n: n,
        },
        headers: {
          'x-api-key': apiKey,
        },
      });
  
      const responseData = response.data.data;
  
      const pricesMap = {};
      for (const roomId in responseData) {
        const prices = responseData[roomId].map(priceData => priceData.p);
        pricesMap[roomId] = prices;
      }
      res.json(pricesMap);
    } catch (error) {
      console.error('Error fetching prices:', error.message);
      res.status(400).json({ error: error.message });
    }
  });


module.exports = router;
