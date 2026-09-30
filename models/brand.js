const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({

    // ======================
    // BASIC DETAILS
    // ======================

    brandName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    brandCode: {
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
    // BRAND IMAGE
    // ======================

    logo: {
        type: String,
        default: ""
    },

    bannerImage: {
        type: String,
        default: ""
    },

    // ======================
    // BUSINESS INFO
    // ======================

    website: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        default: ""
    },

    phone: {
        type: String,
        default: ""
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

module.exports = mongoose.model(
    "Brand",
    brandSchema
);