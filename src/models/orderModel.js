const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // ✅ Admin ke liye extra fields
    image: {
      type: String,
      default: ""
    },
    productCode: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // ✅ Unique Order ID for admin tracking
    orderId: {
      type: String,
      unique: true,
      required: true,
      default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Admin ke liye customer details direct store
    customerDetails: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        trim: true
      }
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    // ✅ Detailed breakdown for admin
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    
    tax: {
      type: Number,
      default: 0,
    },
    
    shipping: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // ✅ Admin ke liye detailed status
    status: {
      type: String,
      enum: [
        "Order Placed",       // Order placed, payment pending
        "confirmed",     // Payment confirmed
        "processing",    // Preparing for shipment
        "shipped",       // Dispatched
        "out_for_delivery", // Out for delivery
        "delivered",     // Successfully delivered
        "cancelled",     // Cancelled by admin/user
        "refunded",      // Refund processed
        "failed"         // Payment failed
      ],
      default: "Order Placed",
    },

    // ✅ Detailed payment info for admin
    paymentMethod: {
      type: String,
      enum: ["cod", "credit_card", "debit_card", "upi", "netbanking", "paypal", "wallet"],
      default: "cod",
    },

    paymentStatus: {
      type: String,
      enum: ["Order Placed", "completed", "failed", "refunded"],
      default: "Order Placed",
    },

    paymentId: {
      type: String,
      default: ""
    },

    // ✅ Shipping info for admin
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "India"
      },
      landmark: String
    },

    // ✅ Tracking info
    trackingNumber: {
      type: String,
      default: ""
    },
    
    courierName: {
      type: String,
      default: ""
    },

    // ✅ Admin notes
    adminNotes: {
      type: String,
      default: ""
    },

    // ✅ Dates for admin tracking
    confirmedAt: Date,
    processingAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    refundedAt: Date,

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
    },

    // ✅ Soft delete for admin
    isActive: {
      type: Boolean,
      default: true
    },

    // ✅ For analytics
    source: {
      type: String,
      enum: ["website", "mobile_app", "whatsapp", "phone"],
      default: "website"
    }
  },
  {
    timestamps: true,
  }
);

// ✅ Indexes for faster admin queries
orderSchema.index({ orderId: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "customerDetails.email": 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customerDetails.name": "text", orderId: "text" });

// ✅ Virtual for formatted date (admin UI ke liye)
orderSchema.virtual("formattedDate").get(function() {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

// ✅ Virtual for customer full address (admin UI ke liye)
orderSchema.virtual("fullAddress").get(function() {
  if (!this.shippingAddress) return "";
  const addr = this.shippingAddress;
  return `${addr.street || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.zipCode || ""}`.trim();
});

// ✅ Static method for admin statistics
orderSchema.statics.getAdminStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
        placedOrders: {
          $sum: {
            $cond: [{ $in: ["$status", ["Order Placed", "confirmed", "processing"]] }, 1, 0]
          }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
        },
        avgOrderValue: { $avg: "$total" }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    placedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    avgOrderValue: 0
  };
};

// ✅ Static method for monthly sales (admin dashboard)
orderSchema.statics.getMonthlySales = async function(year) {
  const currentYear = year || new Date().getFullYear();
  
  return await this.aggregate([
    {
      $match: {
        isActive: true,
        status: "delivered",
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: "$total" }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);
};

// ✅ Instance method for invoice data (admin PDF generation)
orderSchema.methods.getInvoiceData = function() {
  return {
    invoiceNumber: this.orderId,
    date: this.formattedDate,
    customer: {
      name: this.customerDetails.name,
      email: this.customerDetails.email,
      phone: this.customerDetails.phone,
      address: this.fullAddress
    },
    items: this.items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    })),
    summary: {
      subtotal: this.subtotal,
      tax: this.tax,
      shipping: this.shipping,
      total: this.total
    },
    payment: {
      method: this.paymentMethod,
      status: this.paymentStatus,
      paid: this.isPaid,
      paidAt: this.paidAt
    },
    shipping: {
      tracking: this.trackingNumber,
      courier: this.courierName,
      status: this.status
    }
  };
};

// ✅ Pre-save middleware to update timestamps based on status
orderSchema.pre("save", function(next) {
  const now = new Date();
  
  if (this.isModified("status")) {
    switch (this.status) {
      case "confirmed":
        this.confirmedAt = this.confirmedAt || now;
        break;
      case "processing":
        this.processingAt = this.processingAt || now;
        break;
      case "shipped":
        this.shippedAt = this.shippedAt || now;
        break;
      case "delivered":
        this.deliveredAt = this.deliveredAt || now;
        break;
      case "cancelled":
        this.cancelledAt = this.cancelledAt || now;
        break;
      case "refunded":
        this.refundedAt = this.refundedAt || now;
        break;
    }
  }
  
  if (this.isModified("isPaid") && this.isPaid) {
    this.paidAt = this.paidAt || now;
  }
  
  next();
});

// ✅ Ensure virtuals are included in JSON
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);