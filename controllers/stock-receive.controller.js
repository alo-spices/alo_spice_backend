const StockReceive = require("../models/stock-receive");
const Supplier = require("../models/supplier");
const Warehouse = require("../models/warehouse");
const Product = require("../models/product");
const RawMaterial = require("../models/raw-material");


exports.createStockReceive = async (req, res) => {

    try {

        const {

            receiveNo,
            supplier,
            warehouse,
            invoiceNo,
            invoiceDate,
            remarks,
            items

        } = req.body;

        // ======================================
        // BASIC VALIDATION
        // ======================================

        if (!receiveNo) {

            return res.status(400).json({

                success: false,

                message: "Receive Number is required."

            });

        }

        if (!supplier) {

            return res.status(400).json({

                success: false,

                message: "Supplier is required."

            });

        }

        if (!warehouse) {

            return res.status(400).json({

                success: false,

                message: "Warehouse is required."

            });

        }

        if (!invoiceNo) {

            return res.status(400).json({

                success: false,

                message: "Invoice Number is required."

            });

        }

        if (!invoiceDate) {

            return res.status(400).json({

                success: false,

                message: "Invoice Date is required."

            });

        }

        if (!items || items.length === 0) {

            return res.status(400).json({

                success: false,

                message: "Please add at least one Raw Material."

            });

        }

        // ======================================
        // DUPLICATE RECEIVE NO
        // ======================================

        const receiveExists = await StockReceive.findOne({

            receiveNo

        });

        if (receiveExists) {

            return res.status(400).json({

                success: false,

                message: "Receive Number already exists."

            });

        }

        // ======================================
        // CHECK SUPPLIER
        // ======================================

        const supplierExists = await Supplier.findById(

            supplier

        );

        if (!supplierExists) {

            return res.status(404).json({

                success: false,

                message: "Supplier not found."

            });

        }

        // ======================================
        // CHECK WAREHOUSE
        // ======================================

        const warehouseExists = await Warehouse.findById(

            warehouse

        );

        if (!warehouseExists) {

            return res.status(404).json({

                success: false,

                message: "Warehouse not found."

            });

        }

        // ======================================
        // PROCESS ITEMS
        // ======================================

        const stockItems = [];

        for (const item of items) {

            const rawMaterial = await RawMaterial.findById(

                item.rawMaterial

            );

            if (!rawMaterial) {

                return res.status(404).json({

                    success: false,

                    message: "Raw Material not found."

                });

            }

            const totalWeightKg =

                Number(item.noOfBags) *

                Number(item.bagWeightKg);

            const availableWeightKg =

                totalWeightKg;

            const amount =

                totalWeightKg *

                Number(item.rate);

            stockItems.push({

                rawMaterial: item.rawMaterial,

                batchNo: item.batchNo,

                noOfBags: item.noOfBags,

                bagWeightKg: item.bagWeightKg,

                totalWeightKg,

                availableWeightKg,

                rate: item.rate,

                amount

            });

        }
        // ======================================
        // CREATE STOCK RECEIVE
        // ======================================

        const stockReceive = await StockReceive.create({

            receiveNo,

            supplier,

            warehouse,

            invoiceNo,

            invoiceDate,

            remarks,

            items: stockItems

        });

        // ======================================
        // POPULATE RESPONSE
        // ======================================

        const response = await StockReceive.findById(

            stockReceive._id

        )

            .populate(

                "supplier",

                "supplierName supplierCode"

            )

            .populate(

                "warehouse",

                "warehouseName warehouseCode"

            )

            .populate(

                "items.rawMaterial",

                "rawMaterialName rawMaterialCode unit"

            );

        // ======================================
        // SUCCESS RESPONSE
        // ======================================

        return res.status(201).json({

            success: true,

            message: "Stock Receive Created Successfully.",

            data: response

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// ======================================
// GET ALL STOCK RECEIVES
// ======================================

// ======================================
// GET ALL STOCK RECEIVES
// ======================================

exports.getAllStockReceives = async (req, res) => {

    try {

        const stockReceives = await StockReceive.find()

            .populate(
                "supplier",
                "supplierName supplierCode"
            )

            .populate(
                "warehouse",
                "warehouseName warehouseCode warehouseType"
            )

            .populate(
                "items.rawMaterial",
                "rawMaterialName rawMaterialCode unit"
            )

            .sort({

                createdAt: -1

            });

        return res.status(200).json({

            success: true,

            count: stockReceives.length,

            data: stockReceives

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================
// GET STOCK RECEIVE BY ID
// ======================================

// ======================================
// GET STOCK RECEIVE BY ID
// ======================================

exports.getStockReceiveById = async (req, res) => {

    try {

        const { id } = req.params;

        const stockReceive = await StockReceive.findById(id)

            .populate(

                "supplier",

                "supplierName supplierCode mobileNumber"

            )

            .populate(

                "warehouse",

                "warehouseName warehouseCode warehouseType"

            )

            .populate(

                "items.rawMaterial",

                "rawMaterialName rawMaterialCode unit gstPercentage"

            );

        if (!stockReceive) {

            return res.status(404).json({

                success: false,

                message: "Stock Receive not found."

            });

        }

        return res.status(200).json({

            success: true,

            data: stockReceive

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================
// GET TOTAL AVAILABLE STOCK BY PRODUCT
// ======================================
exports.getAvailableStockByProduct = async (req, res) => {

    try {

        const { productId } = req.params;

        const stocks = await StockReceive.find({

            "items.product": productId,

            status: { $ne: "Completed" }

        });

        let totalAvailableKg = 0;

        stocks.forEach(stock => {

            stock.items.forEach(item => {

                if (

                    item.product.toString() === productId &&

                    item.availableWeightKg > 0

                ) {

                    totalAvailableKg += item.availableWeightKg;

                }

            });

        });

        return res.json({

            success: true,

            availableWeightKg: totalAvailableKg

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// GET AVAILABLE STOCK RECEIVES
// ======================================

exports.getAvailableStockReceives = async (req, res) => {



};
// ======================================
// GET AVAILABLE STOCK
// ======================================

// ======================================
// GET AVAILABLE STOCK
// ======================================

exports.getAvailableStock = async (req, res) => {

    try {

        const {
            warehouseId,
            rawMaterialId
        } = req.query;


        if (!warehouseId || !rawMaterialId) {

            return res.status(400).json({

                success: false,

                message:
                    "warehouseId and rawMaterialId are required."

            });

        }


        const stockReceives = await StockReceive.find({

            warehouse: warehouseId,

            status: {
                $ne: "Completed"
            },

            "items.rawMaterial": rawMaterialId,

            "items.availableWeightKg": {
                $gt: 0
            }

        })
            .populate(
                "supplier",
                "supplierName supplierCode"
            )
            .populate(
                "warehouse",
                "warehouseName warehouseCode"
            );


        const availableStock = [];


        stockReceives.forEach(stock => {

            stock.items.forEach(item => {

                if (

                    item.rawMaterial.toString() ===
                    rawMaterialId

                    &&

                    item.availableWeightKg > 0

                ) {

                    availableStock.push({

                        _id: stock._id,

                        receiveNo:
                            stock.receiveNo,

                        supplier:
                            stock.supplier,

                        warehouse:
                            stock.warehouse,

                        invoiceNo:
                            stock.invoiceNo,

                        invoiceDate:
                            stock.invoiceDate,

                        batchNo:
                            item.batchNo,

                        rawMaterial:
                            item.rawMaterial,

                        totalWeightKg:
                            item.totalWeightKg,

                        availableWeightKg:
                            item.availableWeightKg,

                        rate:
                            item.rate,

                        amount:
                            item.amount

                    });

                }

            });

        });


        return res.status(200).json({

            success: true,

            message:
                "Available Stock fetched successfully.",

            data:
                availableStock

        });

    }

    catch (error) {

        console.log(
            "Available Stock Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
// ======================================
// UPDATE STOCK RECEIVE
// ======================================

exports.updateStockReceive = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            supplier,

            warehouse,

            invoiceNo,

            invoiceDate,

            remarks,

            items

        } = req.body;

        // ======================================
        // CHECK STOCK RECEIVE
        // ======================================

        const stockReceive = await StockReceive.findById(id);

        if (!stockReceive) {

            return res.status(404).json({

                success: false,

                message: "Stock Receive not found."

            });

        }

        // ======================================
        // DO NOT ALLOW UPDATE
        // ======================================

        if (

            stockReceive.status === "Partially Used" ||

            stockReceive.status === "Completed"

        ) {

            return res.status(400).json({

                success: false,

                message: "Stock already used in Production. Update not allowed."

            });

        }

        // ======================================
        // VALIDATE SUPPLIER
        // ======================================

        const supplierExists = await Supplier.findById(supplier);

        if (!supplierExists) {

            return res.status(404).json({

                success: false,

                message: "Supplier not found."

            });

        }

        // ======================================
        // VALIDATE WAREHOUSE
        // ======================================

        const warehouseExists = await Warehouse.findById(warehouse);

        if (!warehouseExists) {

            return res.status(404).json({

                success: false,

                message: "Warehouse not found."

            });

        }

        // ======================================
        // VALIDATE ITEMS
        // ======================================

        const stockItems = [];

        for (const item of items) {

            const rawMaterial = await RawMaterial.findById(

                item.rawMaterial

            );

            if (!rawMaterial) {

                return res.status(404).json({

                    success: false,

                    message: "Raw Material not found."

                });

            }

            const totalWeightKg =

                Number(item.noOfBags) *

                Number(item.bagWeightKg);

            const availableWeightKg =

                totalWeightKg;

            const amount =

                totalWeightKg *

                Number(item.rate);

            stockItems.push({

                rawMaterial: item.rawMaterial,

                batchNo: item.batchNo,

                noOfBags: item.noOfBags,

                bagWeightKg: item.bagWeightKg,

                totalWeightKg,

                availableWeightKg,

                rate: item.rate,

                amount

            });

        }
        // ======================================
        // UPDATE STOCK RECEIVE
        // ======================================

        stockReceive.supplier = supplier;

        stockReceive.warehouse = warehouse;

        stockReceive.invoiceNo = invoiceNo;

        stockReceive.invoiceDate = invoiceDate;

        stockReceive.remarks = remarks;

        stockReceive.items = stockItems;

        await stockReceive.save();

        // ======================================
        // POPULATE RESPONSE
        // ======================================

        const response = await StockReceive.findById(

            stockReceive._id

        )

            .populate(

                "supplier",

                "supplierName supplierCode"

            )

            .populate(

                "warehouse",

                "warehouseName warehouseCode"

            )

            .populate(

                "items.rawMaterial",

                "rawMaterialName rawMaterialCode unit"

            );

        // ======================================
        // SUCCESS RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            message: "Stock Receive Updated Successfully.",

            data: response

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================
// DELETE STOCK RECEIVE
// ======================================

exports.deleteStockReceive = async (req, res) => {

    try {

        const { id } = req.params;

        const stockReceive = await StockReceive.findById(id);

        if (!stockReceive) {

            return res.status(404).json({

                success: false,

                message: "Stock Receive not found."

            });

        }

        // ======================================
        // DO NOT ALLOW DELETE
        // ======================================

        if (

            stockReceive.status === "Partially Used" ||

            stockReceive.status === "Completed"

        ) {

            return res.status(400).json({

                success: false,

                message: "Stock already used in Production. Delete not allowed."

            });

        }

        // ======================================
        // SOFT DELETE
        // ======================================

        stockReceive.isDeleted = true;

        await stockReceive.save();

        return res.status(200).json({

            success: true,

            message: "Stock Receive Deleted Successfully."

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// edhi each ware house lo yanta stock undho

exports.getWarehouseStock = async (req, res) => {

    try {

        const { warehouseId } = req.params;

        // ======================================
        // GET ALL STOCK RECEIVES FOR WAREHOUSE
        // ======================================

        const stockReceives = await StockReceive.find({

            warehouse: warehouseId

        })
            .populate(
                "warehouse",
                "warehouseName warehouseCode warehouseType location"
            )
            .populate(
                "items.rawMaterial",
                "rawMaterialName rawMaterialCode unit"
            );


        // ======================================
        // EMPTY RESULT
        // ======================================

        if (!stockReceives.length) {

            return res.status(200).json({

                success: true,

                summary: {

                    totalBatches: 0,

                    totalWeightKg: 0,

                    usedWeightKg: 0,

                    availableWeightKg: 0

                },

                data: []

            });

        }


        // ======================================
        // BATCH-WISE STOCK
        // ======================================

        const stockData = [];


        for (const receive of stockReceives) {

            for (const item of receive.items) {

                const totalWeight =
                    Number(item.totalWeightKg || 0);

                const availableWeight =
                    Number(item.availableWeightKg || 0);

                const usedWeight =
                    Math.max(
                        0,
                        totalWeight - availableWeight
                    );


                stockData.push({

                    stockReceiveId: receive._id,

                    receiveNo:
                        receive.receiveNo,

                    invoiceNo:
                        receive.invoiceNo,

                    invoiceDate:
                        receive.invoiceDate,

                    warehouse:
                        receive.warehouse,

                    rawMaterial:
                        item.rawMaterial,

                    batchNo:
                        item.batchNo,

                    totalWeightKg:
                        totalWeight,

                    usedWeightKg:
                        usedWeight,

                    availableWeightKg:
                        availableWeight,

                    status:
                        availableWeight === 0
                            ? "Completed"
                            : usedWeight > 0
                                ? "Partially Used"
                                : "Received"

                });

            }

        }


        // ======================================
        // SUMMARY
        // ======================================

        const totalBatches =
            stockData.length;


        const totalWeightKg =
            stockData.reduce(

                (sum, item) =>
                    sum +
                    Number(item.totalWeightKg || 0),

                0

            );


        const usedWeightKg =
            stockData.reduce(

                (sum, item) =>
                    sum +
                    Number(item.usedWeightKg || 0),

                0

            );


        const availableWeightKg =
            stockData.reduce(

                (sum, item) =>
                    sum +
                    Number(item.availableWeightKg || 0),

                0

            );


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            summary: {

                totalBatches,

                totalWeightKg,

                usedWeightKg,

                availableWeightKg

            },

            data: stockData

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};