const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "SECRET";

// 🔐 middleware ตรวจ token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = {
  id: decoded.userId,
  role: decoded.role
};
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// 👤 API PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      _id: user._id,
      username: user.username,
      vaultId: user.vaultId,
      balance: user.balance,
      createdAt: user.createdAt,
      kyc: user.kyc,
      role: user.role 
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);

  } catch (err) {

    res.status(500).json({
      message: "Server error"
    });

  }
});
module.exports = router;