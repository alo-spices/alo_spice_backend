const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema({

    // ======================
    // BASIC DETAILS
    // ======================

    areaName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    areaCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    description: {
        type: String,
        default: ""
    },

    // ======================
    // LOCATION
    // ======================

    city: {
        type: String,
        required: true
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

    // ======================
    // ASSIGNMENTS
    // ======================

    salesManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    salesmen: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

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

module.exports = mongoose.model(
    "Area",
    areaSchema
);