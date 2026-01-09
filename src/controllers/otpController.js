const axios = require("axios");
const { sendOTP } = require("../services/smsService");
const User = require("../models/userModel"); // ADD THIS

exports.sendOtpController = async (req, res) => {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
        return res.status(400).json({
            success: false,
            message: "Invalid phone number",
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
        // Find or create user with phone
        let user = await User.findOne({ phone });
        
        if (!user) {
            // Create new user with phone only
            user = new User({
                phone,
                otp,
                otpExpiry,
                isPhoneVerified: false
            });
        } else {
            // Update existing user
            user.otp = otp;
            user.otpExpiry = otpExpiry;
        }
        
        await user.save();

        const sent = await sendOTP(phone, otp);

        if (!sent) {
            return res.status(500).json({
                success: false,
                message: "OTP not sent",
            });
        }

        res.json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.verifyOtpController = async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            message: "Phone and OTP required",
        });
    }

    try {
        // First check OTP in our database
        const user = await User.findOne({ phone });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if OTP matches and not expired
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        // Also verify with MSG91 (optional - remove if not needed)
        const response = await axios.post(
            "https://api.msg91.com/api/v5/otp/verify",
            {
                mobile: `91${phone}`,
                otp: otp,
                authkey: process.env.MSG91_AUTH_KEY,
            }
        );

        if (response.data?.type === "success") {
            // Update user
            user.otp = undefined;
            user.otpExpiry = undefined;
            user.isPhoneVerified = true;
            await user.save();

            // Generate JWT token (you need to implement this)
            // const token = generateToken(user._id);

            return res.json({ 
                success: true,
                message: "OTP verified successfully",
                // token: token, // Add token if you have JWT setup
                user: {
                    id: user._id,
                    phone: user.phone,
                    name: user.name,
                    email: user.email
                }
            });
        }

        res.status(400).json({
            success: false,
            message: "Invalid OTP",
        });
    } catch (error) {
        console.error("Verify OTP Error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "OTP verification failed",
        });
    }
};

// Add resend OTP function
exports.resendOtpController = async (req, res) => {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
        return res.status(400).json({
            success: false,
            message: "Invalid phone number",
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    try {
        const user = await User.findOne({ phone });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const sent = await sendOTP(phone, otp);

        if (!sent) {
            return res.status(500).json({
                success: false,
                message: "OTP not sent",
            });
        }

        res.json({
            success: true,
            message: "OTP resent successfully",
        });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};