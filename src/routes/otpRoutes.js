const express = require("express");
const {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
} = require("../controllers/otpController");

const router = express.Router();

router.post("/send", sendOtpController);
router.post("/verify", verifyOtpController);
router.post("/resend", resendOtpController);

module.exports = router;