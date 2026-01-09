const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Make absolutely sure your schema is exactly as shown
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,  // This creates email_1 index, not username_1
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phone: {  // ADD THIS FIELD
      type: String,
      unique: true,
      sparse: true,
    },
    otp: {  // ADD THIS FIELD
      type: String,
    },
    otpExpiry: {  // ADD THIS FIELD
      type: Date,
    },
    isPhoneVerified: {  // ADD THIS FIELD
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// No username field here!

module.exports = mongoose.model("User", userSchema);
