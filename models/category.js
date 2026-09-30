const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

    // ======================
    // BASIC DETAILS
    // ======================

    categoryName: {
        type: String,
        required: true,
        trim: true
    },

    categoryCode: {
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
    // BRAND
    // ======================

    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true
    },

    // ======================
    // IMAGE
    // ======================

    image: {
        type: String,
        default: ""
    },

    // ======================
    // DISPLAY
    // ======================

    displayOrder: {
        type: Number,
        default: 0
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
    "Category",
    categorySchema
);