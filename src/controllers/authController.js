const authService = require("../services/authServices");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);

    res.json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// REGISTER FUNCTION
exports.register = async (req, res, next) => {  
  try {
    const { email, username, password, phone } = req.body;

    // Validate required fields
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    const data = await authService.register(email, username, password, phone);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    next(error);
  }
};