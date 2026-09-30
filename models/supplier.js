const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({

    // ======================
    // BASIC DETAILS
    // ======================   

    supplierName: {
        type: String,
        required: true,
        trim: true
    },

    supplierCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    contactPerson: {
        type: String,
        default: ""
    },

    mobileNumber: {
        type: String,
        required: true
    },

    alternateMobileNumber: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        default: ""
    },

    // ======================
    // ADDRESS
    // ======================   

    address: {
        type: String,
        default: ""
    },

    city: {
        type: String,
        default: ""
    },

    district: {
        type: String,
        default: ""
    },

    state: {
        type: String,
        default: ""
    },

    country: {
        type: String,
        default: "India"
    },

    pincode: {
        type: String,
        default: ""
    },

    // ======================
    // TAX DETAILS
    // ======================   

    gstNumber: {
        type: String,
        default: ""
    },

    panNumber: {
        type: String,
        default: ""
    },

    // ======================
    // PAYMENT DETAILS
    // ======================   

    paymentTerms: {
        type: String,
        default: ""
    },

    openingBalance: {
        type: Number,
        default: 0
    },

    // ======================
    // BANK DETAILS
    // ======================   

    accountHolderName: {
        type: String,
        default: ""
    },

    bankName: {
        type: String,
        default: ""
    },

    accountNumber: {
        type: String,
        default: ""
    },

    ifscCode: {
        type: String,
        default: ""
    },

    // ======================
    // STATUS
    // ======================   

    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Supplier", supplierSchema);