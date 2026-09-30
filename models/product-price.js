const mongoose = require("mongoose");

const productPriceSchema = new mongoose.Schema({

    // ======================
    // PRODUCT
    // ======================

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

    // ======================
    // CUSTOMER TYPE
    // ======================

    partyType: {
        type: String,
        enum: [
            "Distributor",
            "Wholesaler",
            "Retailer"
        ],
        required: true
    },

    // ======================
    // PRICING
    // ======================

    price: {
        type: Number,
        required: true,
        min: 0
    },

    discountType: {
        type: String,
        enum: [
            "Percentage",
            "Amount",
            "None"
        ],
        default: "None"
    },

    discountValue: {
        type: Number,
        default: 0
    },

    // ======================
    // VALIDITY
    // ======================

    effectiveFrom: {
        type: Date,
        default: Date.now
    },

    effectiveTo: {
        type: Date,
        default: null
    },

    // ======================
    // STATUS
    // ======================

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

// Fast lookup indexes
productPriceSchema.index({
    product: 1,
    variantId: 1,
    partyType: 1
});

module.exports = mongoose.model(
    "ProductPrice",
    productPriceSchema
);