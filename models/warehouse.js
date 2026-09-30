const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({

    warehouseCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    warehouseName: {
        type: String,
        required: true,
        trim: true
    },

    warehouseType: {
        type: String,
        enum: [
            "RAW_MATERIAL",
            "FINISHED_GOODS",
            "BOTH"
        ],
        default: "BOTH"
    },

    managerName: {
        type: String,
        trim: true
    },

    mobileNumber: String,

    email: String,

    address: String,

    city: String,

    state: String,

    pincode: String,

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// module.exports = mongoose.model("Warehouse", warehouseSchema);
module.exports =
    mongoose.models.Warehouse ||
    mongoose.model("Warehouse", warehouseSchema);