const express = require("express");
const router = express.Router();

const TradeSetting = require("../models/TradeSetting");

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "SECRET";
const { auth, adminOnly } = require("../middleware/authMiddleware");

router.use(auth, adminOnly);

// 🔐 AUTH
function auth(req,res,next){
  const token = req.headers.authorization?.split(" ")[1];

  if(!token) return res.status(401).json({message:"No token"});

  try{
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    next();
  }catch{
    return res.status(401).json({message:"Invalid token"});
  }
}


router.post("/trade-setting", auth, async (req,res)=>{
  try{

    const { userId, symbol, forceResult } = req.body;

    if(!userId || !symbol){
      return res.status(400).json({ message:"ข้อมูลไม่ครบ" });
    }

    // ✅ ใช้อันเดียวพอ
    const setting = await TradeSetting.findOneAndUpdate(
      { userId, symbol },
      { forceResult: forceResult || "win" },
      { upsert: true, new: true }
    );

    res.json({
      success:true,
      data: setting
    });

  }catch(err){
    console.log("ADMIN ERROR:", err);
    res.status(500).json({ message:"Server error" });
  }
});


// ================= GET SETTING =================
router.get("/get-trade-setting", auth, async (req,res)=>{

  try{

    const { userId, symbol } = req.query;

    const setting = await TradeSetting.findOne({ userId, symbol });

    res.json({
  forceResult: setting ? setting.forceResult : "lose"
});

  }catch(err){
    res.status(500).json({ message:"Server error" });
  }

});


module.exports = router;