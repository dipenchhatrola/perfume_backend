const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoute");
const otpRoutes = require("./routes/otpRoutes");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ✅ ROUTES
app.use("/api/users", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/otp', otpRoutes);

// ✅ DEBUG ROUTE LIST
console.log("✅ OTP Routes Active: POST /api/otp/send , POST /api/otp/verify");

app.get("/api/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

module.exports = app;