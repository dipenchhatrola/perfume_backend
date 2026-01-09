// productModel.js - Updated version
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String, // image path or URL
      required: true,
    },
    family: {
      type: String,
      enum: ['Woody', 'Floral', 'Fresh', 'Earthwy', 'Spicy', 'Fruity', 'Citrus'],
      default: 'Woody'
    },
    quantity: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);