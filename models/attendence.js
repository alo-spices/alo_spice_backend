const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({

    // =====================================
    // EMPLOYEE
    // =====================================

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // =====================================
    // DATE
    // =====================================

    attendanceDate: {
        type: Date,
        required: true
    },

    // =====================================
    // CHECK IN
    // =====================================

    checkInTime: {
        type: Date,
        default: null
    },

    checkInLatitude: {
        type: Number,
        default: null
    },

    checkInLongitude: {
        type: Number,
        default: null
    },

    checkInAddress: {
        type: String,
        default: ""
    },

    checkInSelfie: {
        type: String,
        default: ""
    },

    // =====================================
    // CHECK OUT
    // =====================================

    checkOutTime: {
        type: Date,
        default: null
    },

    checkOutLatitude: {
        type: Number,
        default: null
    },

    checkOutLongitude: {
        type: Number,
        default: null
    },

    checkOutAddress: {
        type: String,
        default: ""
    },

    checkOutSelfie: {
        type: String,
        default: ""
    },

    // =====================================
    // WORK SUMMARY
    // =====================================

    totalWorkingMinutes: {
        type: Number,
        default: 0
    },

    totalVisits: {
        type: Number,
        default: 0
    },

    totalOrders: {
        type: Number,
        default: 0
    },

    totalCollections: {
        type: Number,
        default: 0
    },

    // =====================================
    // STATUS
    // =====================================

    attendanceStatus: {
        type: String,
        enum: [
            "Present",
            "Absent",
            "Half Day"
        ],
        default: "Present"
    },

    status: {
        type: String,
        enum: [
            "CheckedIn",
            "CheckedOut"
        ],
        default: "CheckedIn"
    },

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

attendanceSchema.index({
    employee: 1,
    attendanceDate: 1
});

module.exports = mongoose.model(
    "Attendance",
    attendanceSchema
);