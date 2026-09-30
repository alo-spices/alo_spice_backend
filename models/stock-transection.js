const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema({

    // =====================================
    // STOCK
    // =====================================

    stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stock",
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party",
        required: true
    },

    // =====================================
    // TRANSACTION
    // =====================================

    transactionType: {
        type: String,
        enum: [
            "Opening",
            "StockIn",
            "StockOut",
            "Order",
            "Return",
            "Damage",
            "Adjustment"
        ],
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    previousStock: {
        type: Number,
        required: true
    },

    currentStock: {
        type: Number,
        required: true
    },

    // =====================================
    // REFERENCE
    // =====================================

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    },

    remarks: {
        type: String,
        default: ""
    },

    // =====================================
    // USER
    // =====================================

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "StockTransaction",
    stockTransactionSchema
);