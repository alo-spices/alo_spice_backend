const mongoose = require("mongoose");

// =====================================================
// PRODUCTION INSTRUCTION ITEM
// =====================================================

const productionInstructionItemSchema = new mongoose.Schema({

    // Raw Material
    rawMaterial: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RawMaterial",
        required: true
    },

    // Stock Receive
    stockReceive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StockReceive",
        required: true
    },

    // Batch selected by Admin
    batchNo: {
        type: String,
        required: true,
        trim: true
    },

    // Production variant / SKU
    variantName: {
        type: String,
        required: true,
        trim: true
    },

    skuCode: {
        type: String,
        required: true,
        trim: true
    },

    // Example: 100g
    packSize: {
        type: String,
        required: true,
        trim: true
    },

    // Example: 100 grams
    weightInGrams: {
        type: Number,
        required: true,
        min: 0.001
    },

    // Quantity Admin wants warehouse to produce
    targetPacks: {
        type: Number,
        required: true,
        min: 1
    },

    // Required raw material quantity
    targetWeightKg: {
        type: Number,
        required: true,
        min: 0.001
    }

}, {
    _id: true
});


// =====================================================
// PRODUCTION INSTRUCTION
// =====================================================

const productionInstructionSchema = new mongoose.Schema({

    // =================================================
    // BASIC DETAILS
    // =================================================

    instructionNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    instructionDate: {
        type: Date,
        default: Date.now
    },


    // =================================================
    // WAREHOUSE
    // =================================================

    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },


    // =================================================
    // PRODUCTION REQUIREMENTS
    // =================================================

    items: {
        type: [productionInstructionItemSchema],

        validate: {
            validator: function (value) {
                return value && value.length > 0;
            },
            message: "At least one production instruction item is required."
        }
    },


    // =================================================
    // TOTAL REQUIRED RAW MATERIAL
    // =================================================

    totalTargetWeightKg: {
        type: Number,
        required: true,
        min: 0.001
    },


    // =================================================
    // REMARKS
    // =================================================

    remarks: {
        type: String,
        trim: true,
        default: ""
    },


    // =================================================
    // STATUS
    // =================================================

    status: {
        type: String,
        enum: [
            "Pending",
            "Accepted",
            "In Progress",
            "Completed",
            "Rejected",
            "Cancelled"
        ],
        default: "Pending"
    },


    // =================================================
    // ACCEPTANCE
    // =================================================

    acceptedAt: {
        type: Date,
        default: null
    },


    // =================================================
    // ACTUAL PRODUCTION REFERENCE
    // =================================================

    production: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Production",
        default: null
    },


    // =================================================
    // SOFT DELETE
    // =================================================

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


module.exports = mongoose.model(
    "ProductionInstruction",
    productionInstructionSchema
);