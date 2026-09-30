const mongoose = require("mongoose");

const employeeTargetSchema = new mongoose.Schema({

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    month: {
        type: Number,
        required: true
    },

    year: {
        type: Number,
        required: true
    },

    salesTarget: {
        type: Number,
        default: 0
    },

    collectionTarget: {
        type: Number,
        default: 0
    },

    visitTarget: {
        type: Number,
        default: 0
    },

    achievedSales: {
        type: Number,
        default: 0
    },

    achievedCollection: {
        type: Number,
        default: 0
    },

    achievedVisits: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "EmployeeTarget",
    employeeTargetSchema
);