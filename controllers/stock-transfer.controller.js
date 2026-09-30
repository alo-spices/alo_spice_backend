const mongoose = require("mongoose");

const StockTransfer = require("../models/stock-transfer");
const Warehouse = require("../models/warehouse");
const Product = require("../models/product");
const User = require("../models/user");
const Party = require("../models/party");
const Production = require("../models/production");


// =====================================================
// GET NEXT TRANSFER NUMBER
// =====================================================

exports.getNextStockTransferNo = async (req, res) => {

    try {

        const lastTransfer = await StockTransfer
            .findOne({
                isDeleted: false
            })
            .sort({
                createdAt: -1
            });

        let nextNumber = 1;

        if (
            lastTransfer &&
            lastTransfer.transferNo
        ) {

            const match =
                lastTransfer.transferNo.match(/\d+$/);

            if (match) {

                nextNumber =
                    parseInt(match[0], 10) + 1;

            }

        }

        const transferNo =
            `ST-${String(nextNumber).padStart(4, "0")}`;

        return res.status(200).json({

            success: true,

            message:
                "Next Stock Transfer Number generated successfully.",

            data: {
                transferNo
            }

        });

    }
    catch (error) {

        console.log(
            "Get Next Stock Transfer Number Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// CREATE STOCK TRANSFER
// =====================================================

exports.createStockTransfer = async (req, res) => {

    try {

        const {
            transferNo,
            transferDate,
            sourceWarehouse,
            destinationType,
            destination,
            items,
            remarks
        } = req.body;


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (!transferNo) {

            return res.status(400).json({

                success: false,

                message:
                    "Transfer Number is required."

            });

        }


        if (!sourceWarehouse) {

            return res.status(400).json({

                success: false,

                message:
                    "Source Warehouse is required."

            });

        }


        if (!destinationType) {

            return res.status(400).json({

                success: false,

                message:
                    "Destination Type is required."

            });

        }


        if (!destination) {

            return res.status(400).json({

                success: false,

                message:
                    "Destination is required."

            });

        }


        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one stock item is required."

            });

        }


        // =================================================
        // VALIDATE SOURCE WAREHOUSE ID
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(
                sourceWarehouse
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Source Warehouse ID."

            });

        }


        // =================================================
        // VALIDATE DESTINATION ID
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(
                destination
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Destination ID."

            });

        }


        // =================================================
        // CHECK WAREHOUSE
        // =================================================

        const warehouse =
            await Warehouse.findOne({

                _id: sourceWarehouse,

                isActive: true

            });

        if (!warehouse) {

            return res.status(404).json({

                success: false,

                message:
                    "Source Warehouse not found or inactive."

            });

        }


        // =================================================
        // CHECK DUPLICATE TRANSFER NUMBER
        // =================================================

        const existingTransfer =
            await StockTransfer.findOne({

                transferNo:
                    transferNo.trim().toUpperCase(),

                isDeleted: false

            });

        if (existingTransfer) {

            return res.status(400).json({

                success: false,

                message:
                    "Stock Transfer Number already exists."

            });

        }


        // =================================================
        // VALIDATE DESTINATION
        // =================================================

        let destinationModel;

        let destinationExists;


        if (
            destinationType === "Distributor"
        ) {

            destinationModel = "User";

            destinationExists =
                await User.findOne({

                    _id: destination,

                    role: "Distributor",

                    isDeleted: false,

                    status: "Active"

                });

        }

        else if (
            destinationType === "Retailer" ||
            destinationType === "Wholesaler"
        ) {

            destinationModel = "Party";

            destinationExists =
                await Party.findOne({

                    _id: destination,

                    partyType:
                        destinationType,

                    isDeleted: false,

                    status: "Active"

                });

        }

        else {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Destination Type."

            });

        }


        if (!destinationExists) {

            return res.status(404).json({

                success: false,

                message:
                    `${destinationType} destination not found or inactive.`

            });

        }


        // =================================================
        // VALIDATE ITEMS
        // =================================================

        const finalItems = [];


        for (const item of items) {

            if (!item.product) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Product is required."

                });

            }


            if (
                !mongoose.Types.ObjectId.isValid(
                    item.product
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid Product ID."

                });

            }


            if (!item.variantId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Variant ID is required."

                });

            }


            if (
                !mongoose.Types.ObjectId.isValid(
                    item.variantId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid Variant ID."

                });

            }


            if (!item.skuCode) {

                return res.status(400).json({

                    success: false,

                    message:
                        "SKU Code is required."

                });

            }


            if (!item.batchNo) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Batch Number is required."

                });

            }


            const quantity =
                Number(item.quantity);


            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Invalid quantity for SKU ${item.skuCode}.`

                });

            }


            // =================================================
            // GET PRODUCT
            // =================================================

            const product =
                await Product.findOne({

                    _id: item.product,

                    isDeleted: false

                });

            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found."

                });

            }


            // =================================================
            // FIND EXISTING VARIANT
            // =================================================

            const variant =
                product.variants.id(
                    item.variantId
                );

            if (!variant) {

                return res.status(404).json({

                    success: false,

                    message:
                        `Variant not found for product ${product.productName}.`

                });

            }


            // =================================================
            // SKU VALIDATION
            // =================================================

            if (
                variant.skuCode.toUpperCase() !==
                item.skuCode.trim().toUpperCase()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `SKU mismatch for product ${product.productName}.`

                });

            }


            finalItems.push({

                product:
                    product._id,

                variantId:
                    variant._id,

                skuCode:
                    variant.skuCode
                        .trim()
                        .toUpperCase(),

                batchNo:
                    item.batchNo
                        .trim(),

                packSize:
                    variant.packSize,

                weightInGrams:
                    Number(
                        variant.weightInGrams || 0
                    ),

                quantity

            });

        }


        // =================================================
        // CREATE TRANSFER
        // =================================================

        const transfer =
            await StockTransfer.create({

                transferNo:
                    transferNo
                        .trim()
                        .toUpperCase(),

                transferDate:
                    transferDate || new Date(),

                sourceWarehouse,

                destinationType,

                destination,

                destinationModel,

                items:
                    finalItems,

                status:
                    "Pending",

                remarks:
                    remarks || "",

                createdBy:
                    req.user?._id || null

            });


        // =================================================
        // POPULATE RESPONSE
        // =================================================

        const response =
            await StockTransfer.findById(
                transfer._id
            )

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType"
                )

                .populate(
                    "items.product",
                    "productName productCode"
                )

                .populate(
                    "destination",
                    "firstName lastName fullName mobile partyCode partyName shopName partyType"
                );


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                "Stock Transfer created successfully.",

            data:
                response

        });

    }
    catch (error) {

        console.log(
            "Create Stock Transfer Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
// =====================================================
// GET ALL STOCK TRANSFERS
// =====================================================

exports.getAllStockTransfers = async (req, res) => {

    try {

        const transfers =
            await StockTransfer.find({

                isDeleted: false

            })

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType"
                )

                .populate(
                    "items.product",
                    "productName productCode"
                )

                .populate(
                    "destination",
                    "firstName lastName fullName mobile partyCode partyName shopName partyType"
                )

                .populate(
                    "createdBy",
                    "firstName lastName fullName employeeCode"
                )

                .populate(
                    "receivedBy",
                    "firstName lastName fullName employeeCode"
                )

                .sort({

                    createdAt: -1

                });


        return res.status(200).json({

            success: true,

            count:
                transfers.length,

            data:
                transfers

        });

    }
    catch (error) {

        console.log(
            "Get All Stock Transfers Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
// =====================================================
// GET STOCK TRANSFER BY ID
// =====================================================

exports.getStockTransferById = async (req, res) => {

    try {

        const { id } = req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Stock Transfer ID."

            });

        }


        const transfer =
            await StockTransfer.findOne({

                _id: id,

                isDeleted: false

            })

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType"
                )

                .populate(
                    "items.product",
                    "productName productCode"
                )

                .populate(
                    "destination",
                    "firstName lastName fullName mobile partyCode partyName shopName partyType"
                )

                .populate(
                    "createdBy",
                    "firstName lastName fullName employeeCode"
                )

                .populate(
                    "receivedBy",
                    "firstName lastName fullName employeeCode"
                );


        if (!transfer) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Transfer not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                transfer

        });

    }
    catch (error) {

        console.log(
            "Get Stock Transfer By ID Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

// =====================================================
// GET STOCK TRANSFERS BY WAREHOUSE
// =====================================================

exports.getStockTransfersByWarehouse = async (req, res) => {

    try {

        const { warehouseId } = req.params;


        if (
            !mongoose.Types.ObjectId.isValid(
                warehouseId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Warehouse ID."

            });

        }


        const transfers =
            await StockTransfer.find({

                sourceWarehouse:
                    warehouseId,

                isDeleted: false

            })

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName"
                )

                .populate(
                    "items.product",
                    "productName productCode"
                )

                .populate(
                    "destination",
                    "firstName lastName fullName mobile partyCode partyName shopName partyType"
                )

                .sort({

                    createdAt: -1

                });


        return res.status(200).json({

            success: true,

            warehouseId,

            count:
                transfers.length,

            data:
                transfers

        });

    }
    catch (error) {

        console.log(
            "Get Stock Transfers By Warehouse Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

// =====================================================
// UPDATE STOCK TRANSFER STATUS
// =====================================================

exports.updateStockTransferStatus = async (req, res) => {

    try {

        const { id } = req.params;

        const { status } = req.body;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Stock Transfer ID."

            });

        }


        const allowedStatuses = [

            "Draft",
            "Pending",
            "Approved",
            "InTransit",
            "Received",
            "Cancelled"

        ];


        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Stock Transfer status."

            });

        }


        const transfer =
            await StockTransfer.findOne({

                _id: id,

                isDeleted: false

            });


        if (!transfer) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Transfer not found."

            });

        }


        // =============================================
        // PREVENT INVALID STATUS CHANGES
        // =============================================

        if (
            transfer.status === "Received"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Received transfer cannot be modified."

            });

        }


        if (
            transfer.status === "Cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Cancelled transfer cannot be modified."

            });

        }


        transfer.status = status;


        // =============================================
        // RECEIVED DETAILS
        // =============================================

        if (
            status === "Received"
        ) {

            transfer.receivedBy =
                req.user?._id || null;

            transfer.receivedAt =
                new Date();

        }


        await transfer.save();


        return res.status(200).json({

            success: true,

            message:
                "Stock Transfer status updated successfully.",

            data:
                transfer

        });

    }
    catch (error) {

        console.log(
            "Update Stock Transfer Status Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

// =====================================================
// DELETE STOCK TRANSFER
// =====================================================

exports.deleteStockTransfer = async (req, res) => {

    try {

        const { id } = req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Stock Transfer ID."

            });

        }


        const transfer =
            await StockTransfer.findOne({

                _id: id,

                isDeleted: false

            });


        if (!transfer) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Transfer not found."

            });

        }


        if (
            [
                "InTransit",
                "Received"
            ].includes(transfer.status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "In-transit or received transfer cannot be deleted."

            });

        }


        transfer.isDeleted = true;

        await transfer.save();


        return res.status(200).json({

            success: true,

            message:
                "Stock Transfer deleted successfully.",

            data:
                transfer

        });

    }
    catch (error) {

        console.log(
            "Delete Stock Transfer Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.getDistributorIncomingTransfers = async (req, res) => {

    try {

        // ==========================================
        // GET LOGGED-IN DISTRIBUTOR
        // ==========================================

        const distributorId = req.user?.id;


        if (!distributorId) {

            return res.status(401).json({

                success: false,

                message:
                    "Distributor authentication required."

            });

        }


        // ==========================================
        // VERIFY ROLE
        // ==========================================

        if (req.user.role !== "Distributor") {

            return res.status(403).json({

                success: false,

                message:
                    "Only distributors can access incoming stock transfers."

            });

        }


        // ==========================================
        // GET INCOMING TRANSFERS
        // ==========================================

        const transfers =
            await StockTransfer.find({

                destinationType: "Distributor",

                destination: distributorId,

                status: {
                    $in: [
                        "Pending",
                        "Approved",
                        "InTransit",
                        "Received"
                    ]
                },

                isDeleted: false

            })
                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType"
                )
                .populate(
                    "items.product",
                    "productName productCode"
                )
                .sort({
                    createdAt: -1
                });

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Distributor incoming stock transfers fetched successfully.",

            data:
                transfers

        });

    }

    catch (error) {

        console.error(
            "Get Distributor Incoming Transfers Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.getDistributorTransferById = async (req, res) => {

    try {

        const { id } = req.params;

        const distributorId = req.user?.id;


        // ==========================================
        // VALIDATE DISTRIBUTOR
        // ==========================================

        if (!distributorId) {

            return res.status(401).json({

                success: false,

                message:
                    "Distributor authentication required."

            });

        }


        // ==========================================
        // VALIDATE ROLE
        // ==========================================

        if (req.user?.role !== "Distributor") {

            return res.status(403).json({

                success: false,

                message:
                    "Only distributors can access this transfer."

            });

        }


        // ==========================================
        // VALIDATE TRANSFER ID
        // ==========================================

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Stock Transfer ID."

            });

        }


        // ==========================================
        // GET TRANSFER
        // ==========================================

        const transfer =
            await StockTransfer.findOne({

                _id: id,

                destinationType:
                    "Distributor",

                destination:
                    distributorId,

                isDeleted:
                    false

            })

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType"
                )

                .populate(
                    "items.product",
                    "productName productCode brand category"
                );


        // ==========================================
        // NOT FOUND
        // ==========================================

        if (!transfer) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Transfer not found."

            });

        }


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Stock Transfer fetched successfully.",

            data:
                transfer

        });

    }

    catch (error) {

        console.log(
            "Get Distributor Transfer By ID Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.receiveStockTransfer = async (req, res) => {

    try {

        const { id } = req.params;

        const distributorId = req.user?.id;


        // ==========================================
        // AUTHENTICATION
        // ==========================================

        if (!distributorId) {

            return res.status(401).json({

                success: false,

                message:
                    "Distributor authentication required."

            });

        }


        // ==========================================
        // ROLE VALIDATION
        // ==========================================

        if (req.user?.role !== "Distributor") {

            return res.status(403).json({

                success: false,

                message:
                    "Only distributors can receive stock transfers."

            });

        }


        // ==========================================
        // VALIDATE ID
        // ==========================================

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Stock Transfer ID."

            });

        }


        // ==========================================
        // FIND TRANSFER
        // ==========================================

        const transfer =
            await StockTransfer.findOne({

                _id: id,

                destinationType:
                    "Distributor",

                destination:
                    distributorId,

                isDeleted:
                    false

            });


        if (!transfer) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Transfer not found."

            });

        }


        // ==========================================
        // ALREADY RECEIVED
        // ==========================================

        if (
            transfer.status ===
            "Received"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Stock Transfer already received."

            });

        }


        // ==========================================
        // CANCELLED
        // ==========================================

        if (
            transfer.status ===
            "Cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Cancelled transfer cannot be received."

            });

        }


        // ==========================================
        // ONLY INTRANSIT CAN BE RECEIVED
        // ==========================================

        if (
            transfer.status !==
            "InTransit"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Only InTransit stock transfers can be received."

            });

        }


        // ==========================================
        // DISTRIBUTOR STOCK UPDATE
        // ==========================================

        // Distributor stock logic ikkada add cheyyali


        // ==========================================
        // UPDATE TRANSFER
        // ==========================================

        transfer.status =
            "Received";

        transfer.receivedBy =
            distributorId;

        transfer.receivedAt =
            new Date();


        await transfer.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Stock Transfer received successfully.",

            data:
                transfer

        });

    }

    catch (error) {

        console.log(
            "Receive Stock Transfer Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.getMyDistributorStock = async (req, res) => {

    try {

        const { distributorId } = req.params;

        if (!distributorId) {

            return res.status(400).json({
                success: false,
                message: "Distributor ID is required."
            });

        }

        const transfers = await StockTransfer.find({
            destinationType: "Distributor",
            destination: distributorId,
            destinationModel: "User",
            status: "Received",
            isDeleted: false
        })
            .populate(
                "items.product",
                "productName productCode"
            )
            .sort({
                receivedAt: -1
            });

        const stock = [];

        transfers.forEach(transfer => {

            transfer.items.forEach(item => {

                stock.push({

                    product: item.product,

                    variantId: item.variantId,

                    skuCode: item.skuCode,

                    batchNo: item.batchNo,

                    packSize: item.packSize,

                    weightInGrams: item.weightInGrams,

                    quantity: item.quantity

                });

            });

        });

        return res.status(200).json({

            success: true,

            message: "Distributor stock fetched successfully.",

            data: stock

        });

    } catch (error) {

        console.log(
            "Get Distributor Stock Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getDistributorStockHistory = async (req, res) => {

    try {

        const distributorId = req.user?.id;

        if (!distributorId) {
            return res.status(401).json({
                success: false,
                message: "Distributor authentication required."
            });
        }

        const transfers = await StockTransfer.find({
            destination: distributorId,
            destinationType: "Distributor",
            status: "Received",
            isDeleted: false
        })
            .populate(
                "items.product",
                "productName productCode"
            )
            .sort({
                receivedAt: -1
            });

        const history = [];

        for (const transfer of transfers) {

            for (const item of transfer.items) {

                history.push({

                    transferNo: transfer.transferNo,

                    transferDate: transfer.transferDate,

                    receivedAt: transfer.receivedAt,

                    product: item.product,

                    variantId: item.variantId,

                    skuCode: item.skuCode,

                    batchNo: item.batchNo,

                    packSize: item.packSize,

                    weightInGrams: item.weightInGrams,

                    quantity: item.quantity

                });

            }

        }

        return res.status(200).json({

            success: true,

            message: "Distributor stock history fetched successfully.",

            data: history

        });

    } catch (error) {

        console.log(
            "Get Distributor Stock History Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ==========================================
// GET MY EMPLOYEES
// ==========================================

// ==========================================
// GET MY EMPLOYEES
// ==========================================

exports.getMyEmployees = async (req, res) => {

    try {

        console.log(
            "🔥🔥 GET MY EMPLOYEES CONTROLLER HIT 🔥🔥"
        );

        console.log(
            "PARAM DISTRIBUTOR ID:",
            req.params.distributorId
        );


        // ==========================================
        // GET DISTRIBUTOR ID FROM URL
        // ==========================================

        const distributorId =
            req.params.distributorId;


        // ==========================================
        // VALIDATE DISTRIBUTOR ID
        // ==========================================

        if (!distributorId) {

            return res.status(400).json({

                success: false,

                message: "Distributor ID is required."

            });

        }


        // ==========================================
        // VALIDATE MONGODB OBJECT ID
        // ==========================================

        if (
            !mongoose.Types.ObjectId.isValid(
                distributorId
            )
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid Distributor ID."

            });

        }


        // ==========================================
        // GET ASSIGNED EMPLOYEES
        // SALESMAN + DELIVERY BOY
        // ==========================================

        const employees = await User.find({

            distributor: distributorId,

            role: {
                $in: [
                    "Salesman",
                    "DeliveryBoy"
                ]
            },

            isDeleted: false

        })

            // ==========================================
            // SELECT EMPLOYEE DETAILS
            // ==========================================

            .select(
                "firstName lastName fullName employeeCode profileImage mobile email role area route status assignmentType distributor"
            )

            // ==========================================
            // AREA
            // ==========================================

            .populate(
                "area",
                "areaName"
            )

            // ==========================================
            // ROUTE
            // ==========================================

            .populate(
                "route",
                "routeName"
            )

            // ==========================================
            // SORT
            // ==========================================

            .sort({

                fullName: 1

            });


        console.log(
            "🔥 EMPLOYEES FOUND:",
            employees.length
        );


        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Employees fetched successfully.",

            count:
                employees.length,

            data:
                employees

        });

    }

    catch (error) {

        console.log(
            "❌ Get My Employees Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ==========================================
// GET MY EMPLOYEE BY ID
// ==========================================

exports.getMyEmployeeById = async (req, res) => {

    try {

        const distributorId = req.user?.id;
        const { employeeId } = req.params;

        console.log("=================================");
        console.log("GET EMPLOYEE BY ID");
        console.log("Employee ID:", employeeId);
        console.log("Distributor ID:", distributorId);
        console.log("=================================");

        if (!distributorId) {

            return res.status(401).json({
                success: false,
                message: "Distributor authentication required."
            });

        }

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid Employee ID."
            });

        }

        // ==========================================
        // TEST: FIND ONLY BY EMPLOYEE ID
        // ==========================================

        const employee = await User.findOne({
            _id: employeeId
        })
            .select(
                "firstName lastName fullName employeeCode profileImage mobile email role area route status distributor"
            )
            .populate("area", "areaName")
            .populate("route", "routeName");

        console.log("EMPLOYEE FOUND:", employee);

        if (!employee) {

            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });

        }

        return res.status(200).json({

            success: true,

            message: "Employee details fetched successfully.",

            data: employee

        });

    }
    catch (error) {

        console.log(
            "Get My Employee By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};