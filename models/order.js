const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    // =====================================
    // ORDER DETAILS
    // =====================================

    orderNumber: {
        type: String,
        required: true,
        unique: true
    },

    orderDate: {
        type: Date,
        default: Date.now
    },

    // =====================================
    // PARTY
    // =====================================

    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party",
        required: true
    },

    partyType: {
        type: String,
        enum: [
            "Distributor",
            "Wholesaler",
            "Retailer"
        ],
        required: true
    },

    // =====================================
    // EMPLOYEE
    // =====================================

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    visit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Visit",
        default: null
    },

    // =====================================
    // AMOUNTS
    // =====================================

    subTotal: {
        type: Number,
        default: 0
    },

    discountAmount: {
        type: Number,
        default: 0
    },

    taxableAmount: {
        type: Number,
        default: 0
    },

    gstAmount: {
        type: Number,
        default: 0
    },

    grandTotal: {
        type: Number,
        default: 0
    },

    // =====================================
    // ORDER STATUS
    // =====================================

    orderStatus: {
        type: String,
        enum: [
            "Pending",
            "Approved",
            "Processing",
            "Delivered",
            "Cancelled"
        ],
        default: "Approved"
    },

    // =====================================
    // PAYMENT
    // =====================================

    paymentStatus: {
        type: String,
        enum: [
            "Pending",
            "Partial",
            "Paid"
        ],
        default: "Pending"
    },
    paidAmount: {
        type: Number,
        default: 0
    },

    balanceAmount: {
        type: Number,
        default: 0
    },

    // =====================================
    // NOTES
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

orderSchema.index({
    orderNumber: 1
});

orderSchema.index({
    party: 1
});

orderSchema.index({
    employee: 1
});

module.exports = mongoose.model(
    "Order",
    orderSchema
);