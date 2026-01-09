const Order = require("../models/orderModel");
const Notification = require("../models/Notification");
const User = require("../models/userModel"); // Import user model

/* =========================
   Create Order (EXISTING - UNCHANGED)
========================= */
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, total, subtotal, tax, shipping, paymentMethod, shippingAddress } = req.body;

    if (!userId || !items || !total) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // ✅ Get user details for admin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* 1️⃣ Save Order with customer details */
    const order = await Order.create({
      userId,
      customerDetails: {
        name: user.name || "Customer",
        email: user.email || "",
        phone: user.phone || ""
      },
      items,
      subtotal: subtotal || total,
      tax: tax || 0,
      shipping: shipping || 0,
      total,
      paymentMethod: paymentMethod || "cod",
      shippingAddress: shippingAddress || {},
      status: "Order Placed"
    });

    /* 2️⃣ Create Notification */
    await Notification.create({
      userId,
      type: "order",
      title: "Order Placed",
      message: `Your order #${order.orderId} has been placed successfully`,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Order failed",
    });
  }
};

/* =========================
   Get User Orders (EXISTING - UNCHANGED)
========================= */
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   NEW: Get All Orders for Admin
========================= */
exports.getAllOrders = async (req, res) => {
  try {
    // Get query parameters
    const { 
      status, 
      page = 1, 
      limit = 10,
      search = "",
      startDate,
      endDate,
      sortBy = "-createdAt"
    } = req.query;

    // Build filter
    const filter = {};

    // Status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customerDetails.name": { $regex: search, $options: "i" } }, // ✅ Change here
        { "customerDetails.email": { $regex: search, $options: "i" } }  // ✅ Change here
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with user details
    const orders = await Order.find(filter)
      .populate("userId", "name email phone") // Populate user details
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Order.countDocuments(filter);

    // Calculate revenue
    const revenueResult = await Order.aggregate([
      { $match: filter },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      stats: {
        totalOrders: total,
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
        avgOrderValue: total > 0 ? (revenueResult[0]?.totalRevenue || 0) / total : 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

/* =========================
   NEW: Get Order Statistics for Admin Dashboard
========================= */
exports.getOrderStats = async (req, res) => {
  try {
    // Status-wise counts
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      }
    ]);

    // Total stats
    const totalStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          avgOrderValue: { $avg: "$total" }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name")
      .select("orderId total status createdAt");

    // Format stats
    const stats = {
      orderConfirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      totalOrders: totalStats[0]?.totalOrders || 0,
      totalRevenue: totalStats[0]?.totalRevenue || 0,
      avgOrderValue: totalStats[0]?.avgOrderValue || 0
    };

    // Fill status counts
    statusStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats,
      recentOrders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stats",
    });
  }
};

/* =========================
   NEW: Update Order Status (Admin)
========================= */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [      
      "Order Confirmed",
      "Shipped",
      "Out_for_delivery",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    // Find and update order
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update status
    order.status = status;
    
    // Update paidAt if status is paid
    if (status === "paid" && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
    }

    await order.save();

    // Create notification for user
    await Notification.create({
      userId: order.userId,
      type: "order_update",
      title: "Order Status Updated",
      message: `Your order #${order._id} status changed to ${status}`,
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

/* =========================
   NEW: Delete Order (Admin)
========================= */
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Also delete related notifications
    await Notification.deleteMany({ 
      userId: order.userId,
      "message": { $regex: order._id, $options: "i" }
    });

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete order",
    });
  }
};

/* =========================
   NEW: Get Single Order Details (Admin)
========================= */
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("userId", "name email phone address")
      .populate("items.productId", "name price images");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order details",
    });
  }
};

/* =========================
   NEW: Bulk Update Orders (Admin)
========================= */
exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!orderIds || !orderIds.length || !status) {
      return res.status(400).json({
        success: false,
        message: "Order IDs and status are required"
      });
    }

    // Update multiple orders
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status } }
    );

    // Create notifications for each order
    const orders = await Order.find({ _id: { $in: orderIds } });
    for (const order of orders) {
      await Notification.create({
        userId: order.userId,
        type: "order_update",
        title: "Order Status Updated",
        message: `Your order #${order._id} status changed to ${status}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} orders updated successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update orders",
    });
  }
};