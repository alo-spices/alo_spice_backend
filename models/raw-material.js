const mongoose = require("mongoose");

const rawMaterialSchema = new mongoose.Schema({

    rawMaterialName: {
        type: String,
        required: true,
        trim: true
    },

    rawMaterialCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    hsnCode: {
        type: String,
        default: ""
    },

    // gstPercentage: {
    //     type: Number,
    //     default: 5
    // },

    unit: {
        type: String,
        enum: [
            "KG",
            "GRAM",
            "BAG"
        ],
        default: "KG"
    },

    description: {
        type: String,
        default: ""
    },

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
    "RawMaterial",
    rawMaterialSchema
);