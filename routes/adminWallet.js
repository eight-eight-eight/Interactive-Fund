const express = require("express");
const router = express.Router();
const AdminWallet = require("../models/AdminWallet");
const { auth, adminOnly } = require("../middleware/authMiddleware");
router.use(auth, adminOnly);

// ================= CREATE =================
router.post("/create", async (req, res) => {
  try {
    const wallet = await AdminWallet.create(req.body);
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const data = await AdminWallet.find({ status: "active" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET BY TYPE =================
router.get("/:type", async (req, res) => {
  try {
    const data = await AdminWallet.find({
      type: req.params.type,
      status: "active"
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE wallet
router.delete("/:id", async (req, res) => {
  try {
    await AdminWallet.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;