const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    // ===================================
    // BASIC INFO
    // ===================================

    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        default: "",
        trim: true
    },

    fullName: {
        type: String,
        default: ""
    },

    employeeCode: {
        type: String,
        unique: true,
        sparse: true
    },

    profileImage: {
        type: String,
        default: ""
    },

    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        default: "Male"
    },

    dateOfBirth: {
        type: Date
    },

    // ===================================
    // CONTACT INFO
    // ===================================

    mobile: {
        type: String,
        required: true,
        unique: true
    },

    alternateMobile: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: ""
    },

    // ===================================
    // LOGIN
    // ===================================

    password: {
        type: String,
        required: true
    },

    // ===================================
    // ROLE
    // ===================================

    role: {
        type: String,
        enum: [
            "Admin",
            "SubAdmin",
            "WarehouseManager",
            "SalesManager",
            "Salesman",
            "Accountant",
            "DeliveryBoy",
            "Distributor"
        ],
        required: true
    },
    // ===================================
    // ASSIGNMENT
    // ===================================

    assignmentType: {
        type: String,
        enum: [
            "WAREHOUSE",
            "DISTRIBUTOR"
        ],
        default: "WAREHOUSE"
    },

    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        default: null
    },

    distributor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    // ===================================
    // APPROVAL
    // ===================================

    isApproved: {
        type: Boolean,
        default: false
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    approvedAt: {
        type: Date,
        default: null
    },

    // ===================================
    // ACCOUNT STATUS
    // ===================================

    status: {
        type: String,
        enum: [
            "Pending",
            "Active",
            "Inactive",
            "Blocked"
        ],
        default: "Pending"
    },

    // ===================================
    // AREA ASSIGNMENT
    // ===================================

    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Area",
        default: null
    },

    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Route",
        default: null
    },

    reportingManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // ===================================
    // DISTRIBUTOR DETAILS
    // ===================================

    distributorName: {
        type: String,
        default: ""
    },

    shopName: {
        type: String,
        default: ""
    },

    gstNumber: {
        type: String,
        default: ""
    },

    panNumber: {
        type: String,
        default: ""
    },

    // ===================================
    // ADDRESS
    // ===================================

    addressLine1: {
        type: String,
        default: ""
    },

    addressLine2: {
        type: String,
        default: ""
    },

    city: {
        type: String,
        default: ""
    },

    state: {
        type: String,
        default: ""
    },

    pincode: {
        type: String,
        default: ""
    },

    // ===================================
    // DEVICE
    // ===================================

    lastLoginAt: {
        type: Date,
        default: null
    },

    lastLoginIP: {
        type: String,
        default: ""
    },

    // ===================================
    // SYSTEM
    // ===================================

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);