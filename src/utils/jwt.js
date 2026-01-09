const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {

  return jwt.sign(

    { id: user._id, role: user.role },

    process.env.JWT_SECRET,

    { expiresIn: process.env.JWT_EXPIRES_IN }

  );
};

// const generateToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
//     expiresIn: "7d",
//   });
// };

// const verifyToken = (token) => {
//   return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
// };

//module.exports = { generateToken, verifyToken };