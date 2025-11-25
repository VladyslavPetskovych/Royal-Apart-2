const express = require("express");
const router = express.Router();
const { PythonShell } = require("python-shell");

router.get("/get", async (req, res) => {
  const room = req.query.room;
  const price = parseFloat(req.query.price);
  const date = req.query.date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (!room || isNaN(price)) {
    return res.status(400).json({ error: "room and price are required" });
  }

  let options = {
    mode: "json",
    pythonOptions: ["-u"],
    scriptPath: "./python", // шлях до твого train_and_features.py
    args: [room, price, date],
  };

  PythonShell.run("predict_price.py", options, function (err, results) {
    if (err) return res.status(500).json({ error: err.message });
    // results повертає масив об'єктів JSON, беремо перший
    res.json(results[0]);
  });
});

module.exports = router;
