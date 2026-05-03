const express = require("express");
const router = express.Router(); // ✅ ต้องมีบรรทัดนี้

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

// 🔥 ✅ วางฟังก์ชันตรงนี้
async function generateUniqueVaultId() {
  let exists = true;
  let id;

  while (exists) {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    id = `SV-${random}`;

    const user = await User.findOne({ vaultId: id });
    if (!user) exists = false;
  }

  return id;
}

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { email, password, username } = req.body; 

    if (!email || !password) {
  return res.status(400).json({ message: "Missing required fields" });
}

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      username: username || "User", // 👈 กันกรณีไม่มีค่า
      vaultId: await generateUniqueVaultId(),   // 🔥 เพิ่มตรงนี้

      role: "user",
      balance: 0,
      totalDeposit: 0,
      withdrawnToday: 0
    });

    await user.save();

    res.json({ message: "Register success" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
  return res.status(400).json({ message: "Email and password required" });
}

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
  { 
    userId: user._id,
    role: user.role   // 🔥 เพิ่มตรงนี้
  },
  SECRET,
  { expiresIn: "7d" }
);

  res.json({
  token,
  role: user.role,
  user: {
    _id: user._id,      // ✅ เพิ่มบรรทัดนี้
    email: user.email,
    balance: user.balance,
    role: user.role
  }
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ต้อง export ด้วย
module.exports = router;