const mongoose = require("mongoose");

// =====================================================
// STOCK TRANSFER ITEM
// =====================================================

const stockTransferItemSchema = new mongoose.Schema({

    // Existing Product
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    // Existing Product Variant _id
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    // Existing SKU
    skuCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },

    // Batch from Production
    batchNo: {
        type: String,
        required: true,
        trim: true
    },

    packSize: {
        type: String,
        required: true,
        trim: true
    },

    weightInGrams: {
        type: Number,
        required: true,
        min: 0
    },

    // Quantity being transferred
    quantity: {
        type: Number,
        required: true,
        min: 1
    }

}, { _id: true });


// =====================================================
// STOCK TRANSFER
// =====================================================

const stockTransferSchema = new mongoose.Schema({

    // =================================================
    // TRANSFER DETAILS
    // =================================================

    transferNo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    transferDate: {
        type: Date,
        default: Date.now
    },

    // =================================================
    // SOURCE
    // =================================================

    sourceWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },

    // =================================================
    // DESTINATION
    // =================================================

    destinationType: {
        type: String,
        enum: [
            "Distributor",
            "Retailer",
            "Wholesaler"
        ],
        required: true
    },

    destination: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "destinationModel",
        required: true
    },

    destinationModel: {
        type: String,
        enum: [
            "User",
            "Party"
        ],
        required: true
    },

    // =================================================
    // ITEMS
    // =================================================

    items: {
        type: [stockTransferItemSchema],

        validate: {
            validator: function (value) {
                return value && value.length > 0;
            },
            message: "At least one stock item is required."
        }
    },

    // =================================================
    // STATUS
    // =================================================

    status: {
        type: String,
        enum: [
            "Draft",
            "Pending",
            "Approved",
            "InTransit",
            "Received",
            "Cancelled"
        ],
        default: "Pending"
    },

    // =================================================
    // REMARKS
    // =================================================

    remarks: {
        type: String,
        trim: true,
        default: ""
    },

    // =================================================
    // CREATED BY
    // =================================================

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // =================================================
    // RECEIVED DETAILS
    // =================================================

    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    receivedAt: {
        type: Date,
        default: null
    },

    // =================================================
    // SOFT DELETE
    // =================================================

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


// =====================================================
// INDEXES
// =====================================================

stockTransferSchema.index({
    sourceWarehouse: 1,
    status: 1
});

stockTransferSchema.index({
    destinationType: 1,
    destination: 1
});

stockTransferSchema.index({
    "items.skuCode": 1
});

stockTransferSchema.index({
    transferDate: -1
});


// =====================================================
// MODEL
// =====================================================

module.exports = mongoose.model(
    "StockTransfer",
    stockTransferSchema
);