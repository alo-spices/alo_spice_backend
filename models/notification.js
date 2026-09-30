const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: [
            "Order",
            "Collection",
            "Attendance",
            "Stock",
            "General"
        ],
        default: "General"
    },

    isRead: {
        type: Boolean,
        default: false
    },

    redirectId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    redirectModule: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);