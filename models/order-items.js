const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({

    // =====================================
    // ORDER
    // =====================================

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    // =====================================
    // PRODUCT
    // =====================================

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    packSize: {
        type: String,
        required: true
    },

    // =====================================
    // PRICING
    // =====================================

    price: {
        type: Number,
        required: true
    },

    discountAmount: {
        type: Number,
        default: 0
    },

    gstPercentage: {
        type: Number,
        default: 5
    },

    // =====================================
    // QUANTITY
    // =====================================

    quantity: {
        type: Number,
        required: true
    },

    lineTotal: {
        type: Number,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "OrderItem",
    orderItemSchema
);