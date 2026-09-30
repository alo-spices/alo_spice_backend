const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({

    // ======================
    // BASIC DETAILS
    // ======================
    routeName: {
        type: String,
        required: true,
        trim: true
    },

    routeCode: {
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
    // AREA
    // ======================

    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Area",
        required: true
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
    // DISTRIBUTOR
    // ======================

    distributor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // ======================
    // TARGETS
    // ======================

    monthlySalesTarget: {
        type: Number,
        default: 0
    },

    monthlyCollectionTarget: {
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
    "Route",
    routeSchema
);
