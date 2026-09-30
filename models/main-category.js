const mongoose = require("mongoose");

const mainCategorySchema = new mongoose.Schema({

    // ======================
    // BASIC DETAILS
    // ======================



    mainCategoryName: {
        type: String,
        required: true,
        trim: true
    },



    description: {
        type: String,
        default: ""
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

    // ======================
    // SOFT DELETE
    // ======================

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "MainCategory",
    mainCategorySchema
);