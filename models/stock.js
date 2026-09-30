const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({

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
    // BATCH
    // =====================================

    batchNo: {
        type: String,
        required: true,
        trim: true
    },


    // =====================================
    // STOCK
    // =====================================

    availableQuantity: {
        type: Number,
        default: 0
    },

    reservedQuantity: {
        type: Number,
        default: 0
    },

    damagedQuantity: {
        type: Number,
        default: 0
    },

    // =====================================
    // ALERTS
    // =====================================

    minimumStockLevel: {
        type: Number,
        default: 10
    },

    // =====================================
    // STATUS
    // =====================================

    status: {
        type: String,
        enum: [
            "Active",
            "Inactive"
        ],
        default: "Active"
    },

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

stockSchema.index({
    party: 1,
    product: 1,
    variantId: 1
});

module.exports = mongoose.model(
    "Stock",
    stockSchema
);  