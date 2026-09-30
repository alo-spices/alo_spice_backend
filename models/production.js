
const mongoose = require("mongoose");

// =====================================================
// RAW MATERIAL USED FROM STOCK RECEIVE
// =====================================================

const rawMaterialSchema = new mongoose.Schema({

    // Selected StockReceive
    stockReceive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StockReceive",
        required: true
    },

    // Selected Raw Material
    rawMaterial: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RawMaterial",
        required: true
    },

    // Selected batch
    batchNo: {
        type: String,
        required: true,
        trim: true
    },

    // Available stock when production was created
    availableWeightKg: {
        type: Number,
        required: true,
        min: 0
    },

    // Quantity used for this production
    weightUsedKg: {
        type: Number,
        required: true,
        min: 0.001
    }

}, { _id: false });


// =====================================================
// PRODUCTION VARIANT
// =====================================================

const productionItemSchema = new mongoose.Schema({

    // Raw material based variant name
    // Example: Pepper 10g
    variantName: {
        type: String,
        required: true,
        trim: true
    },

    // Unique SKU created during production
    // Example: PEP-10G
    skuCode: {
        type: String,
        required: true,
        trim: true
    },
    batchNo: {
        type: String,
        required: true,
        trim: true
    },
    // Example: 10g / 100g / 200g
    packSize: {
        type: String,
        required: true,
        trim: true
    },

    // Example: 10 / 100 / 200
    weightInGrams: {
        type: Number,
        required: true,
        min: 0.001
    },

    // Good packs produced
    packsProduced: {
        type: Number,
        required: true,
        min: 1
    },

    // Rejected / damaged packs
    rejectedPacks: {
        type: Number,
        default: 0,
        min: 0
    },

    // Automatically calculated
    // weightInGrams × packsProduced / 1000
    totalWeightUsedKg: {
        type: Number,
        required: true,
        min: 0
    }

}, { _id: true });


// =====================================================
// PRODUCTION
// =====================================================

const productionSchema = new mongoose.Schema({

    // =================================================
    // BASIC DETAILS
    // =================================================

    productionNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    productionDate: {
        type: Date,
        default: Date.now
    },

    // Production warehouse
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },


    // =================================================
    // RAW MATERIAL INPUT
    // =================================================

    /*
        Example:

        Raw Material:
        Pepper

        Stock:
        PEP001

        Available:
        350 KG

        Used:
        100 KG
    */

    rawMaterials: {
        type: [rawMaterialSchema],

        validate: {
            validator: function (value) {
                return value && value.length > 0;
            },
            message: "At least one raw material stock is required."
        }
    },


    // Total raw material consumed
    rawWeightUsedKg: {
        type: Number,
        required: true,
        min: 0.001
    },


    // =================================================
    // NEW VARIANTS CREATED IN PRODUCTION
    // =================================================

    /*
        Example:

        Pepper 10g
            2000 Packs
            20 KG

        Pepper 100g
            400 Packs
            40 KG

        Pepper 200g
            200 Packs
            40 KG
    */

    productionItems: {
        type: [productionItemSchema],

        validate: {
            validator: function (value) {
                return value && value.length > 0;
            },
            message: "At least one production variant is required."
        }
    },


    // =================================================
    // TOTAL FINISHED PRODUCTION
    // =================================================

    // Total good finished-product weight
    totalProducedWeightKg: {
        type: Number,
        required: true,
        min: 0
    },


    // =================================================
    // WASTE
    // =================================================

    /*
        Raw Material Used = 100 KG
        Good Production  = 98 KG
        Waste             = 2 KG
    */

    wasteKg: {
        type: Number,
        default: 0,
        min: 0
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
            "Completed",
            "Cancelled"
        ],
        default: "Pending"
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
    "Production",
    productionSchema
);