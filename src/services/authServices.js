const bcrypt = require("bcryptjs");
//const User = require("../models/userModel");
const { generateToken } = require("../utils/jwt");

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateToken({ id: user.id, email: user.email });

  return { token };
};

// ADD THIS REGISTER FUNCTION
// exports.register = async (email, username, password, phone) => {
//   try {
//     // Check if user already exists
//     const existingUser = await User.findOne({
//       $or: [
//         { email: email.toLowerCase() },
//         { username: username.toLowerCase() }
//       ]
//     });

//     if (existingUser) {
//       throw new Error("User with this email or username already exists");
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create new user
//     const newUser = new User({
//       email: email.toLowerCase(),
//       username: username.toLowerCase(),
//       password: hashedPassword,
//       phone: phone || "",
//       joinDate: new Date()
//     });

//     // Save user to database
//     await newUser.save();

//     // Generate token
//     const token = generateToken({ 
//       id: newUser._id, 
//       email: newUser.email,
//       username: newUser.username 
//     });

//     // Return user data without password
//     const userResponse = {
//       id: newUser._id,
//       email: newUser.email,
//       username: newUser.username,
//       phone: newUser.phone,
//       joinDate: newUser.joinDate
//     };

//     return { token, user: userResponse };
//   } catch (error) {
//     throw error;
//   }
// };