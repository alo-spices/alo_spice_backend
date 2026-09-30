const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({

    // =====================================
    // COLLECTION NUMBER
    // =====================================

    collectionNumber: {
        type: String,
        required: true,
        unique: true
    },

    collectionDate: {
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
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    paidAgainst: {
        type: String,
        default: "Invoice"
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
    // PAYMENT DETAILS
    // =====================================

    collectedAmount: {
        type: Number,
        required: true
    },

    paymentMode: {
        type: String,
        enum: [
            "Cash",
            "UPI",
            "Bank Transfer",
            "Cheque"
        ],
        required: true
    },

    transactionNumber: {
        type: String,
        default: ""
    },

    // =====================================
    // OUTSTANDING
    // =====================================

    previousOutstanding: {
        type: Number,
        default: 0
    },

    remainingOutstanding: {
        type: Number,
        default: 0
    },

    // =====================================
    // PROOF
    // =====================================

    paymentProof: {
        type: String,
        default: ""
    },

    // =====================================
    // NOTES
    // =====================================

    remarks: {
        type: String,
        default: ""
    },

    // =====================================
    // STATUS
    // =====================================

    status: {
        type: String,
        enum: [
            "Pending",
            "Verified",
            "Rejected"
        ],
        default: "Pending"
    },

    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    verifiedAt: {
        type: Date,
        default: null
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

collectionSchema.index({
    collectionNumber: 1
});

collectionSchema.index({
    party: 1
});

collectionSchema.index({
    employee: 1
});

module.exports = mongoose.model(
    "Collection",
    collectionSchema
);