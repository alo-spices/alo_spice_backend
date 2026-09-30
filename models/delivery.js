const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({

    // =====================================
    // DELIVERY DETAILS
    // =====================================

    deliveryNumber: {
        type: String,
        required: true,
        unique: true
    },

    deliveryDate: {
        type: Date,
        default: Date.now
    },

    // =====================================
    // ORDER
    // =====================================

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    // =====================================
    // PARTY
    // =====================================

    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party",
        required: true
    },

    // =====================================
    // DELIVERY BOY
    // =====================================

    deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // =====================================
    // DISPATCH
    // =====================================

    dispatchedAt: {
        type: Date,
        default: null
    },

    dispatchedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // =====================================
    // DELIVERY
    // =====================================

    deliveredAt: {
        type: Date,
        default: null
    },

    receiverName: {
        type: String,
        default: ""
    },

    receiverMobile: {
        type: String,
        default: ""
    },

    // =====================================
    // DELIVERY PROOF
    // =====================================

    deliveryPhoto: {
        type: String,
        default: ""
    },

    deliverySignature: {
        type: String,
        default: ""
    },

    // =====================================
    // GPS
    // =====================================

    latitude: {
        type: Number,
        default: null
    },

    longitude: {
        type: Number,
        default: null
    },

    deliveryAddress: {
        type: String,
        default: ""
    },
    // =====================================
    // STOCK SOURCE
    // =====================================

    sourceType: {
        type: String,
        enum: [
            "WAREHOUSE",
            "DISTRIBUTOR"
        ],
        required: true
    },

    sourceWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        default: null
    },

    sourceDistributor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    // =====================================
    // STATUS
    // =====================================

    deliveryStatus: {
        type: String,
        enum: [
            "Pending",
            "Assigned",
            "Dispatched",
            "Delivered",
            "Failed",
            "Cancelled"
        ],
        default: "Pending"
    },

    // =====================================
    // REMARKS
    // =====================================

    remarks: {
        type: String,
        default: ""
    },

    // =====================================
    // SYSTEM
    // =====================================

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

deliverySchema.index({
    deliveryNumber: 1
});

deliverySchema.index({
    order: 1
});

deliverySchema.index({
    deliveryBoy: 1
});

module.exports = mongoose.model(
    "Delivery",
    deliverySchema
);