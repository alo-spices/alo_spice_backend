const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({

    // =====================================
    // EMPLOYEE
    // =====================================

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // =====================================
    // PARTY
    // =====================================

    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party",
        required: true
    },
    beat: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "BeatPlan"

    },
    // =====================================
    // AREA & ROUTE
    // =====================================

    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Area"
    },

    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Route"
    },

    // =====================================
    // VISIT START
    // =====================================

    visitStartTime: {
        type: Date,
        default: Date.now
    },

    startLatitude: {
        type: Number,
        default: null
    },

    startLongitude: {
        type: Number,
        default: null
    },

    startAddress: {
        type: String,
        default: ""
    },

    // =====================================
    // VISIT END
    // =====================================

    visitEndTime: {
        type: Date,
        default: null
    },

    endLatitude: {
        type: Number,
        default: null
    },

    endLongitude: {
        type: Number,
        default: null
    },

    endAddress: {
        type: String,
        default: ""
    },

    // =====================================
    // VISIT SUMMARY
    // =====================================

    visitDurationMinutes: {
        type: Number,
        default: 0
    },

    // =====================================
    // ORDER INFO
    // =====================================

    orderCreated: {
        type: Boolean,
        default: false
    },

    orderCount: {
        type: Number,
        default: 0
    },

    orderAmount: {
        type: Number,
        default: 0
    },

    // =====================================
    // COLLECTION INFO
    // =====================================

    collectionDone: {
        type: Boolean,
        default: false
    },

    collectionAmount: {
        type: Number,
        default: 0
    },

    // =====================================
    // VISIT NOTES
    // =====================================

    notes: {
        type: String,
        default: ""
    },

    nextFollowUpDate: {
        type: Date,
        default: null
    },

    // =====================================
    // PHOTOS
    // =====================================

    photos: [{
        type: String
    }],

    // =====================================
    // VISIT RESULT
    // =====================================

    visitStatus: {
        type: String,
        enum: [
            "Started",
            "Pending",
            "Completed",
            "Cancelled"
        ],
        default: "Started"
    },

    visitOutcome: {
        type: String,
        enum: [
            "Order Taken",
            "Payment Collected",
            "Order & Payment",
            "Follow Up Required",
            "No Order",
            "Shop Closed"
        ],
        default: "No Order"
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

visitSchema.index({
    employee: 1,
    party: 1
});

visitSchema.index({
    employee: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Visit",
    visitSchema
);