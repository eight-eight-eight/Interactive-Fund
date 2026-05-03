const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// ตั้งค่าเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 🔥 API upload
router.post("/", upload.single("image"), (req, res) => {
  try {
    const imageUrl = "/uploads/" + req.file.filename;

    res.json({
      success: true,
      imageUrl
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;