// adminRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
// const User = require("../models/userModel");
// const auth = require("../middlewares/authMiddleware");

// Get all products for admin
router.get("/admin/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new product
router.post("/admin/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// // ==================== USERS ROUTES ====================
// // Get all users (Admin only)
// router.get("/admin/users", async (req, res) => {
//   try {
//     console.log("📡 Admin/users route hit");
    
//     // Agar authentication chahiye to
//     // const token = req.header('Authorization')?.replace('Bearer ', '');
//     // if (!token) {
//     //   return res.status(401).json({ success: false, message: 'No token provided' });
//     // }
    
//     const users = await User.find().select("+password").sort({ createdAt: -1 });
    
//     console.log(`✅ Found ${users.length} users`);
    
//     res.json({
//       success: true,
//       count: users.length,
//       data: users
//     });
//   } catch (error) {
//     console.error("❌ Error in /admin/users:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Get single user by ID
// router.get("/admin/users/:id", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }
    
//     res.json({
//       success: true,
//       data: user
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Add new user
// router.post("/admin/users", async (req, res) => {
//   try {
//     console.log("➕ Creating new user:", req.body);
    
//     const userData = {
//       ...req.body,
//       role: req.body.role || 'user',
//       status: req.body.status || 'active',
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };
    
//     const user = new User(userData);
//     await user.save();
    
//     console.log("✅ User created:", user._id);
    
//     res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       data: user
//     });
//   } catch (error) {
//     console.error("❌ Error creating user:", error);
//     res.status(400).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Update user
// router.put("/admin/users/:id", async (req, res) => {
//   try {
//     const updates = req.body;
//     updates.updatedAt = new Date();
    
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       updates,
//       { new: true, runValidators: true }
//     );
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }
    
//     res.json({
//       success: true,
//       message: "User updated successfully",
//       data: user
//     });
//   } catch (error) {
//     res.status(400).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Delete user
// router.delete("/admin/users/:id", async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }
    
//     res.json({
//       success: true,
//       message: "User deleted successfully"
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Update user status
// router.patch("/admin/users/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;
    
//     if (!['active', 'inactive', 'suspended'].includes(status)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid status value' 
//       });
//     }
    
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { 
//         status,
//         updatedAt: new Date()
//       },
//       { new: true }
//     );
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }
    
//     res.json({
//       success: true,
//       message: `User status updated to ${status}`,
//       data: user
//     });
//   } catch (error) {
//     res.status(400).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

module.exports = router;