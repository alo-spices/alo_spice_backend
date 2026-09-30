
const mongoose = require("mongoose");

const stockReceiveItemSchema = new mongoose.Schema({

    // product: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Product",
    //     required: true
    // },
    rawMaterial: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RawMaterial",
        required: true
    },

    batchNo: {
        type: String,
        required: true,
        trim: true
    },

    noOfBags: {
        type: Number,
        required: true,
        min: 1
    },

    bagWeightKg: {
        type: Number,
        required: true,
        min: 0
    },

    totalWeightKg: {
        type: Number,
        required: true,
        min: 0
    },

    availableWeightKg: {
        type: Number,
        required: true,
        min: 0
    },

    rate: {
        type: Number,
        required: true,
        min: 0
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    }

}, { _id: false });

const stockReceiveSchema = new mongoose.Schema({

    receiveNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true
    },

    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },

    invoiceNo: {
        type: String,
        required: true,
        trim: true
    },

    invoiceDate: {
        type: Date,
        required: true
    },

    receivedDate: {
        type: Date,
        default: Date.now
    },

    items: {
        type: [stockReceiveItemSchema],
        validate: {
            validator: function (value) {
                return value.length > 0;
            },
            message: "At least one product is required."
        }
    },

    remarks: {
        type: String,
        trim: true
    },

    status: {
        type: String,
        enum: ["Received", "Partially Used", "Completed"],
        default: "Received"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("StockReceive", stockReceiveSchema);