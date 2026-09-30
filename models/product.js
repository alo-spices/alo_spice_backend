const mongoose = require("mongoose");

// ======================================
// VARIANT SCHEMA
// ======================================

const variantSchema = new mongoose.Schema({

    packSize: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    image: {
        type: String,
        default: ""
    },

    gallery: [String],
    skuCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },

    mrp: {
        type: Number,
        required: true,
        min: 0
    },

    gstPercentage: {
        type: Number,
        default: 5,
        min: 0
    },

    weightInGrams: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: [
            "Active",
            "Inactive"
        ],
        default: "Active"
    }

}, { _id: true });


// ======================================
// PRODUCT SCHEMA
// ======================================

const productSchema = new mongoose.Schema({

    // ======================================
    // BASIC DETAILS
    // ======================================

    productName: {
        type: String,
        required: true,
        trim: true
    },

    productCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    shortDescription: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        default: ""
    },

    // ======================================
    // BRAND & CATEGORY
    // ======================================

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

    // ======================================
    // BUSINESS DETAILS
    // ======================================

    hsnCode: {
        type: String,
        default: ""
    },

    gstPercentage: {
        type: Number,
        default: 5
    },

    productType: {
        type: String,
        enum: [
            "Regular",
            "NewLaunch"
        ],
        default: "Regular"
    },

    // ======================================
    // VARIANTS
    // ======================================

    variants: [variantSchema],

    // ======================================
    // DISPLAY SETTINGS
    // ======================================

    displayOrder: {
        type: Number,
        default: 0
    },

    featuredProduct: {
        type: Boolean,
        default: false
    },

    // ======================================
    // STATUS
    // ======================================

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


// ======================================
// INDEXES
// ======================================

productSchema.index({
    productName: 1
});

productSchema.index({
    productCode: 1
});

productSchema.index({
    brand: 1
});

productSchema.index({
    category: 1
});


// ======================================
// MODEL
// ======================================

module.exports = mongoose.model(
    "Product",
    productSchema
);