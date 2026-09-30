const mongoose = require("mongoose");

const beatPlanSchema = new mongoose.Schema({

    // ======================
    // BASIC DETAILS
    // ======================

    beatName: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    // ======================
    // AREA & ROUTE
    // ======================

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

    // ======================
    // ASSIGNED EMPLOYEE
    // ======================

    salesman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },


    // Delivery Boy Beat Plan
    // Used for Order Delivery

    deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // ======================
    // DAY
    // ======================

    day: {
        type: String,
        enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ],
        required: true
    },

    // ======================
    // SHOPS
    // ======================

    shops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party"
    }],
    beatStartTime: Date,

    beatEndTime: Date,

    isStarted: {
        type: Boolean,
        default: false
    },

    isCompleted: {
        type: Boolean,
        default: false
    },

    completedShops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party"
    }],

    pendingShops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party"
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
    "BeatPlan",
    beatPlanSchema
);