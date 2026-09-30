const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({

    // =====================================
    // BASIC DETAILS
    // =====================================

    partyType: {
        type: String,
        enum: [
            "Distributor",
            "Wholesaler",
            "Retailer"
        ],
        required: true
    },

    partyCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    partyName: {
        type: String,
        required: true,
        trim: true
    },

    shopName: {
        type: String,
        required: true,
        trim: true
    },

    ownerName: {
        type: String,
        default: ""
    },

    // =====================================
    // CONTACT
    // =====================================

    mobile: {
        type: String,
        required: true
    },

    alternateMobile: {
        type: String,
        default: ""
    },

    whatsappNumber: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        default: ""
    },
    shopImage: {
        type: String,
    },
    // =====================================
    // BUSINESS DETAILS
    // =====================================

    gstNumber: {
        type: String,
        default: ""
    },

    panNumber: {
        type: String,
        default: ""
    },

    licenseNumber: {
        type: String,
        default: ""
    },

    // =====================================
    // AREA & ROUTE
    // =====================================

    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Area",
        required: true
    },

    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Route",
        required: true
    },

    assignedSalesman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // =====================================
    // ADDRESS
    // =====================================

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
        default: "Andhra Pradesh"
    },

    pincode: {
        type: String,
        default: ""
    },

    // =====================================
    // LOCATION
    // =====================================

    latitude: {
        type: Number,
        default: null
    },

    longitude: {
        type: Number,
        default: null
    },

    // =====================================
    // CREDIT SETTINGS
    // =====================================

    creditLimit: {
        type: Number,
        default: 0
    },

    creditDays: {
        type: Number,
        default: 0
    },

    openingBalance: {
        type: Number,
        default: 0
    },

    // =====================================
    // DISTRIBUTOR LOGIN
    // =====================================

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
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

partySchema.index({
    partyName: 1
});

partySchema.index({
    partyCode: 1
});

partySchema.index({
    mobile: 1
});

module.exports = mongoose.model(
    "Party",
    partySchema
);