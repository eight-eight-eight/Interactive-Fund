const express = require("express");
const router = express.Router();
const TradeSetting = require("../models/TradeSetting");
const { auth, adminOnly } = require("../middleware/authMiddleware");
router.use(auth, adminOnly);
// ================= GET =================
router.get("/get-trade-setting", async (req, res) => {
  try {
    const { userId, symbol } = req.query;

    const data = await TradeSetting.findOne({ userId, symbol });

    if (!data) {
      return res.json({ forceResult: "lose" }); // default
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

// ================= POST =================
router.post("/trade-setting", async (req, res) => {
  try {
    const { userId, symbol, forceResult } = req.body;

    await TradeSetting.findOneAndUpdate(
      { userId, symbol },
      { forceResult },
      { upsert: true, new: true }
    );

    res.json({ message: "saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});

module.exports = router;