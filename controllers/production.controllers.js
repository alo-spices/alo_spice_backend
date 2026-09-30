const mongoose = require("mongoose");

const Production = require("../models/production");
const StockReceive = require("../models/stock-receive");
const Product = require("../models/product");
const Warehouse = require("../models/warehouse");
const RawMaterial = require("../models/raw-material");



// ======================================
// CREATE PRODUCTION
// ======================================

exports.createProduction = async (req, res) => {

    try {

        const {

            productionNo,
            productionDate,
            warehouse,
            rawMaterials,
            productionItems,
            remarks

        } = req.body;


        // ======================================
        // BASIC VALIDATION
        // ======================================

        if (!productionNo) {

            return res.status(400).json({

                success: false,

                message: "Production Number is required."

            });

        }


        if (!warehouse) {

            return res.status(400).json({

                success: false,

                message: "Warehouse is required."

            });

        }


        if (
            !rawMaterials ||
            !Array.isArray(rawMaterials) ||
            rawMaterials.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message: "At least one raw material is required."

            });

        }


        if (
            !productionItems ||
            !Array.isArray(productionItems) ||
            productionItems.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message: "At least one production variant is required."

            });

        }


        // ======================================
        // VALIDATE WAREHOUSE
        // ======================================

        const warehouseExists =
            await Warehouse.findById(warehouse);

        if (!warehouseExists) {

            return res.status(404).json({

                success: false,

                message: "Warehouse not found."

            });

        }


        // ======================================
        // CHECK DUPLICATE PRODUCTION NO
        // ======================================

        const alreadyExists =
            await Production.findOne({

                productionNo,

                isDeleted: false

            });

        if (alreadyExists) {

            return res.status(400).json({

                success: false,

                message:
                    "Production Number already exists."

            });

        }


        // ======================================
        // VALIDATE RAW MATERIAL STOCK
        // ======================================

        let totalRawWeight = 0;


        for (const item of rawMaterials) {


            // ==================================
            // VALIDATE INPUT
            // ==================================

            if (!item.stockReceive) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Stock Receive is required."

                });

            }


            if (!item.rawMaterial) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Raw Material is required."

                });

            }


            if (!item.batchNo) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Batch Number is required."

                });

            }


            if (
                item.weightUsedKg === undefined ||
                item.weightUsedKg <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Invalid weight for batch ${item.batchNo}.`

                });

            }


            // ==================================
            // VALIDATE RAW MATERIAL
            // ==================================

            const rawMaterialDoc =
                await RawMaterial.findById(
                    item.rawMaterial
                );

            if (!rawMaterialDoc) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Raw Material not found."

                });

            }


            // ==================================
            // GET STOCK RECEIVE
            // ==================================

            const stock =
                await StockReceive.findById(
                    item.stockReceive
                );

            if (!stock) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Stock Receive not found."

                });

            }


            // ==================================
            // CHECK WAREHOUSE
            // ==================================

            if (
                stock.warehouse.toString() !==
                warehouse.toString()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Stock Receive ${stock.receiveNo} ` +
                        `does not belong to selected warehouse.`

                });

            }


            // ==================================
            // FIND SELECTED BATCH
            // ==================================

            const stockItem =
                stock.items.find(

                    x =>

                        x.rawMaterial.toString() ===
                        item.rawMaterial.toString()

                        &&

                        x.batchNo ===
                        item.batchNo

                );


            if (!stockItem) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Batch ${item.batchNo} not found ` +
                        `in selected Stock Receive.`

                });

            }


            // ==================================
            // CHECK AVAILABLE STOCK
            // ==================================

            if (
                stockItem.availableWeightKg <
                item.weightUsedKg
            ) {

                return res.status(400).json({

                    success: false,

                    message:

                        `${rawMaterialDoc.rawMaterialName} ` +

                        `Batch ${item.batchNo} has only ` +

                        `${stockItem.availableWeightKg} KG available.`

                });

            }


            // ==================================
            // ADD TOTAL RAW WEIGHT
            // ==================================

            totalRawWeight +=
                Number(item.weightUsedKg);

        }


        // ======================================
        // ROUND TOTAL RAW WEIGHT
        // ======================================

        totalRawWeight =
            Number(
                totalRawWeight.toFixed(3)
            );


        // ======================================
        // VALIDATE PRODUCTION VARIANTS
        // ======================================

        let totalProducedWeight = 0;

        let totalRejectedWeight = 0;


        for (const item of productionItems) {


            // ==================================
            // VARIANT NAME
            // ==================================

            if (!item.variantName) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Variant Name is required."

                });

            }


            // ==================================
            // SKU
            // ==================================

            if (!item.skuCode) {

                return res.status(400).json({

                    success: false,

                    message:

                        `SKU Code is required for ` +
                        `${item.variantName}.`

                });

            }

            if (!item.batchNo) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Batch Number is required for ${item.variantName}.`

                });

            }
            // ==================================
            // PACK SIZE
            // ==================================

            if (!item.packSize) {

                return res.status(400).json({

                    success: false,

                    message:

                        `Pack Size is required for ` +
                        `${item.variantName}.`

                });

            }


            // ==================================
            // WEIGHT
            // ==================================

            if (
                item.weightInGrams === undefined ||
                item.weightInGrams <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:

                        `Weight is required for ` +
                        `${item.variantName}.`

                });

            }


            // ==================================
            // PACKS
            // ==================================

            if (
                item.packsProduced === undefined ||
                item.packsProduced <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:

                        `Packs Produced is required for ` +
                        `${item.variantName}.`

                });

            }


            // ==================================
            // REJECTED PACKS
            // ==================================

            const rejectedPacks =
                Number(item.rejectedPacks || 0);


            if (rejectedPacks < 0) {

                return res.status(400).json({

                    success: false,

                    message:

                        `Invalid rejected packs for ` +
                        `${item.variantName}.`

                });

            }


            // ==================================
            // CALCULATE GOOD WEIGHT
            // ==================================

            const goodWeightKg =

                (
                    Number(item.weightInGrams) *
                    Number(item.packsProduced)
                ) / 1000;


            // ==================================
            // CALCULATE REJECTED WEIGHT
            // ==================================

            const rejectedWeightKg =

                (
                    Number(item.weightInGrams) *
                    rejectedPacks
                ) / 1000;


            // ==================================
            // TOTALS
            // ==================================

            totalProducedWeight +=
                goodWeightKg;


            totalRejectedWeight +=
                rejectedWeightKg;

        }


        // ======================================
        // ROUND TOTALS
        // ======================================

        totalProducedWeight =
            Number(
                totalProducedWeight.toFixed(3)
            );


        totalRejectedWeight =
            Number(
                totalRejectedWeight.toFixed(3)
            );


        // ======================================
        // VALIDATE TOTAL WEIGHT
        // ======================================

        const totalConsumedWeight =

            Number(
                (
                    totalProducedWeight +
                    totalRejectedWeight
                ).toFixed(3)
            );


        if (
            totalConsumedWeight >
            totalRawWeight
        ) {

            return res.status(400).json({

                success: false,

                message:

                    `Production weight mismatch. ` +

                    `Raw Material Used: ${totalRawWeight} KG, ` +

                    `Production + Rejected: ` +
                    `${totalConsumedWeight} KG.`

            });

        }


        // ======================================
        // CALCULATE WASTE
        // ======================================

        const wasteKg =

            Number(
                (
                    totalRawWeight -
                    totalProducedWeight -
                    totalRejectedWeight
                ).toFixed(3)
            );


        // ======================================
        // DEDUCT RAW MATERIAL STOCK
        // ======================================

        for (const item of rawMaterials) {


            const stock =
                await StockReceive.findById(
                    item.stockReceive
                );


            const stockItem =
                stock.items.find(

                    x =>

                        x.rawMaterial.toString() ===
                        item.rawMaterial.toString()

                        &&

                        x.batchNo ===
                        item.batchNo

                );


            // ==================================
            // REDUCE AVAILABLE STOCK
            // ==================================

            stockItem.availableWeightKg =

                Number(
                    (
                        stockItem.availableWeightKg -
                        Number(item.weightUsedKg)
                    ).toFixed(3)
                );


            // ==================================
            // PREVENT NEGATIVE STOCK
            // ==================================

            if (
                stockItem.availableWeightKg < 0
            ) {

                stockItem.availableWeightKg = 0;

            }


            // ==================================
            // UPDATE STOCK STATUS
            // ==================================

            const totalAvailableWeight =

                stock.items.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.availableWeightKg || 0
                        ),

                    0

                );


            const totalOriginalWeight =

                stock.items.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.totalWeightKg || 0
                        ),

                    0

                );


            if (
                totalAvailableWeight === 0
            ) {

                stock.status =
                    "Completed";

            }

            else if (
                totalAvailableWeight <
                totalOriginalWeight
            ) {

                stock.status =
                    "Partially Used";

            }

            else {

                stock.status =
                    "Received";

            }


            // ==================================
            // SAVE STOCK
            // ==================================

            await stock.save();

        }


        // ======================================
        // PREPARE PRODUCTION ITEMS
        // ======================================

        const finalProductionItems =

            productionItems.map(item => {


                const goodWeightKg =

                    (
                        Number(item.weightInGrams) *
                        Number(item.packsProduced)
                    ) / 1000;


                return {

                    variantName:
                        item.variantName.trim(),

                    skuCode:
                        item.skuCode
                            .trim()
                            .toUpperCase(),
                    batchNo:
                        item.batchNo.trim(),

                    packSize:
                        item.packSize.trim(),

                    weightInGrams:
                        Number(item.weightInGrams),

                    packsProduced:
                        Number(item.packsProduced),

                    rejectedPacks:
                        Number(item.rejectedPacks || 0),

                    totalWeightUsedKg:
                        Number(
                            goodWeightKg.toFixed(3)
                        )

                };

            });


        // ======================================
        // PREPARE RAW MATERIAL DATA
        // ======================================

        const finalRawMaterials =

            rawMaterials.map(item => {

                return {

                    stockReceive:
                        item.stockReceive,

                    rawMaterial:
                        item.rawMaterial,

                    batchNo:
                        item.batchNo,

                    availableWeightKg:
                        Number(
                            item.availableWeightKg || 0
                        ),

                    weightUsedKg:
                        Number(item.weightUsedKg)

                };

            });


        // ======================================
        // CREATE PRODUCTION
        // ======================================

        const production =

            await Production.create({

                productionNo,

                productionDate:
                    productionDate || new Date(),

                warehouse,

                rawMaterials:
                    finalRawMaterials,

                rawWeightUsedKg:
                    totalRawWeight,

                productionItems:
                    finalProductionItems,

                totalProducedWeightKg:
                    totalProducedWeight,

                wasteKg:
                    wasteKg,

                remarks:
                    remarks || "",

                status:
                    "Completed"

            });


        // ======================================
        // POPULATE RESPONSE
        // ======================================

        const response =

            await Production.findById(
                production._id
            )

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )

                .populate(
                    "rawMaterials.stockReceive",
                    "receiveNo supplier warehouse"
                )

                .populate(
                    "rawMaterials.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                );


        // ======================================
        // SUCCESS RESPONSE
        // ======================================

        return res.status(201).json({

            success: true,

            message:
                "Production Created Successfully.",

            data: response

        });

    }

    catch (error) {

        console.log(
            "Create Production Error:",
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
// GET ALL PRODUCTIONS
// ======================================

exports.getAllProductions = async (req, res) => {

    try {

        const productions = await Production.find({
            isDeleted: false
        })



            // ==========================================
            // POPULATE WAREHOUSE
            // ==========================================

            .populate(
                "warehouse",
                "warehouseName warehouseCode warehouseType"
            )

            // ==========================================
            // POPULATE RAW MATERIAL
            // ==========================================

            .populate(
                "rawMaterials.rawMaterial",
                "rawMaterialName rawMaterialCode unit"
            )

            // ==========================================
            // POPULATE STOCK RECEIVE
            // ==========================================

            .populate(
                "rawMaterials.stockReceive",
                "receiveNo invoiceNo invoiceDate"
            )

            // Latest first
            .sort({
                createdAt: -1
            });


        // ==========================================
        // SUCCESS
        // ==========================================

        return res.status(200).json({

            success: true,

            count: productions.length,

            data: productions

        });

    }

    catch (error) {

        console.log(
            "Get All Productions Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};




// ==========================================
// GET PRODUCTION BY ID
// ==========================================

exports.getProductionById = async (req, res) => {

    try {

        const { id } = req.params;

        // =====================================================
        // FIND PRODUCTION
        // =====================================================

        const production = await Production.findOne({

            _id: id,

            isDeleted: false

        })

            // =====================================================
            // WAREHOUSE
            // =====================================================

            .populate(
                "warehouse",
                "warehouseName warehouseCode"
            )

            // =====================================================
            // RAW MATERIAL STOCK RECEIVE
            // =====================================================

            .populate(
                "rawMaterials.stockReceive",
                "receiveNo supplier invoiceNo invoiceDate receivedDate"
            )

            // =====================================================
            // RAW MATERIAL
            // =====================================================

            .populate(
                "rawMaterials.rawMaterial",
                "rawMaterialName rawMaterialCode unit"
            );


        // =====================================================
        // NOT FOUND
        // =====================================================

        if (!production) {

            return res.status(404).json({

                success: false,

                message: "Production not found."

            });

        }


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message: "Production fetched successfully.",

            data: production

        });

    }

    catch (error) {

        console.log(
            "GET PRODUCTION BY ID ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// UPDATE PRODUCTION
// ======================================

exports.updateProduction = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            productionDate,
            warehouse,
            rawMaterials,
            rawWeightUsedKg,
            totalProducedWeightKg,
            wasteKg,
            productionItems,
            remarks,
            status
        } = req.body;


        // =====================================================
        // BASIC VALIDATION
        // =====================================================

        if (!warehouse) {

            return res.status(400).json({
                success: false,
                message: "Warehouse is required."
            });

        }


        if (
            !rawMaterials ||
            !Array.isArray(rawMaterials) ||
            rawMaterials.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "At least one raw material stock is required."
            });

        }


        if (
            !productionItems ||
            !Array.isArray(productionItems) ||
            productionItems.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "At least one production item is required."
            });

        }


        // =====================================================
        // FIND OLD PRODUCTION
        // =====================================================

        const production = await Production.findOne({

            _id: id,

            isDeleted: false

        });


        if (!production) {

            return res.status(404).json({
                success: false,
                message: "Production not found."
            });

        }


        // =====================================================
        // VALIDATE WAREHOUSE
        // =====================================================

        const warehouseDoc =
            await Warehouse.findById(warehouse);


        if (!warehouseDoc) {

            return res.status(404).json({
                success: false,
                message: "Warehouse not found."
            });

        }


        // =====================================================
        // 1. RESTORE OLD RAW MATERIAL STOCK
        // =====================================================

        for (
            const oldItem of production.rawMaterials || []
        ) {

            const stock =
                await StockReceive.findById(
                    oldItem.stockReceive
                );


            if (!stock) continue;


            const stockItem =
                stock.items.find(

                    item =>

                        item.rawMaterial.toString() ===
                        oldItem.rawMaterial.toString()

                );


            if (!stockItem) continue;


            // Restore old used quantity

            stockItem.availableWeightKg +=
                Number(
                    oldItem.weightUsedKg || 0
                );


            // =================================================
            // RECALCULATE STOCK STATUS
            // =================================================

            const totalWeight =
                stock.items.reduce(

                    (sum, item) =>

                        sum +
                        Number(
                            item.totalWeightKg || 0
                        ),

                    0

                );


            const availableWeight =
                stock.items.reduce(

                    (sum, item) =>

                        sum +
                        Number(
                            item.availableWeightKg || 0
                        ),

                    0

                );


            if (availableWeight <= 0) {

                stock.status = "Completed";

            }
            else if (
                availableWeight < totalWeight
            ) {

                stock.status = "Partially Used";

            }
            else {

                stock.status = "Received";

            }


            await stock.save();

        }


        // =====================================================
        // 2. VALIDATE NEW RAW MATERIAL STOCK
        // =====================================================

        let calculatedRawWeight = 0;


        for (
            const item of rawMaterials
        ) {


            if (!item.stockReceive) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Stock Receive is required."

                });

            }


            if (!item.rawMaterial) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Raw Material is required in rawMaterials."

                });

            }


            const stock =
                await StockReceive.findById(
                    item.stockReceive
                );


            if (!stock) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Stock Receive not found."

                });

            }


            const stockItem =
                stock.items.find(

                    stockItem =>

                        stockItem.rawMaterial.toString() ===
                        item.rawMaterial.toString()

                );


            if (!stockItem) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected Raw Material not found in Stock Receive."

                });

            }


            const weightUsed =
                Number(
                    item.weightUsedKg || 0
                );


            if (weightUsed <= 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Weight used must be greater than 0."

                });

            }


            if (
                Number(
                    stockItem.availableWeightKg || 0
                ) < weightUsed
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Available stock is only ${stockItem.availableWeightKg} KG.`

                });

            }


            calculatedRawWeight +=
                weightUsed;

        }


        // =====================================================
        // 3. RAW WEIGHT VALIDATION
        // =====================================================

        const requestRawWeight =
            Number(
                rawWeightUsedKg || 0
            );


        if (
            Math.abs(
                calculatedRawWeight -
                requestRawWeight
            ) > 0.0001
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Raw Material weight mismatch. Selected: ${calculatedRawWeight} KG, Given: ${requestRawWeight} KG.`

            });

        }


        // =====================================================
        // 4. DEDUCT NEW RAW MATERIAL STOCK
        // =====================================================

        for (
            const item of rawMaterials
        ) {

            const stock =
                await StockReceive.findById(
                    item.stockReceive
                );


            if (!stock) continue;


            const stockItem =
                stock.items.find(

                    stockItem =>

                        stockItem.rawMaterial.toString() ===
                        item.rawMaterial.toString()

                );


            if (!stockItem) continue;


            stockItem.availableWeightKg -=
                Number(
                    item.weightUsedKg || 0
                );


            if (
                stockItem.availableWeightKg < 0
            ) {

                stockItem.availableWeightKg = 0;

            }


            // =================================================
            // UPDATE STOCK STATUS
            // =================================================

            const totalWeight =
                stock.items.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.totalWeightKg || 0
                        ),

                    0

                );


            const availableWeight =
                stock.items.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.availableWeightKg || 0
                        ),

                    0

                );


            if (availableWeight <= 0) {

                stock.status = "Completed";

            }
            else if (
                availableWeight < totalWeight
            ) {

                stock.status = "Partially Used";

            }
            else {

                stock.status = "Received";

            }


            await stock.save();

        }


        // =====================================================
        // 5. VALIDATE PRODUCTION ITEMS
        // =====================================================

        for (
            const item of productionItems
        ) {

            if (
                !item.variantName
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Variant Name is required."

                });

            }


            if (
                !item.skuCode
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "SKU Code is required."

                });

            }


            if (
                Number(
                    item.weightInGrams || 0
                ) <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Weight must be greater than 0 for ${item.skuCode}.`

                });

            }


            if (
                Number(
                    item.packsProduced || 0
                ) <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Packs produced must be greater than 0 for ${item.skuCode}.`

                });

            }


            // =================================================
            // CALCULATE TOTAL WEIGHT
            // =================================================

            const calculatedWeight =

                Number(
                    item.weightInGrams
                ) *

                Number(
                    item.packsProduced
                ) /

                1000;


            item.totalWeightUsedKg =
                Number(
                    calculatedWeight.toFixed(3)
                );

        }


        // =====================================================
        // 6. VALIDATE TOTAL PRODUCTION WEIGHT
        // =====================================================

        const calculatedProducedWeight =

            productionItems.reduce(

                (sum, item) =>

                    sum +
                    Number(
                        item.totalWeightUsedKg || 0
                    ),

                0

            );


        if (
            calculatedProducedWeight >
            requestRawWeight
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Produced Weight cannot exceed Raw Material Used."

            });

        }


        // =====================================================
        // 7. CALCULATE WASTE
        // =====================================================

        const calculatedWaste =

            Math.max(

                0,

                requestRawWeight -
                calculatedProducedWeight

            );


        // =====================================================
        // 8. UPDATE PRODUCTION DOCUMENT
        // =====================================================

        production.productionDate =
            productionDate;

        production.warehouse =
            warehouse;

        production.rawMaterials =
            rawMaterials;

        production.rawWeightUsedKg =
            requestRawWeight;

        production.totalProducedWeightKg =
            Number(
                calculatedProducedWeight.toFixed(3)
            );

        production.wasteKg =
            Number(
                calculatedWaste.toFixed(3)
            );

        production.productionItems =
            productionItems;

        production.remarks =
            remarks || "";

        production.status =
            status || "Completed";


        await production.save();


        // =====================================================
        // 9. GET UPDATED PRODUCTION
        // =====================================================

        const response =
            await Production.findById(
                production._id
            )

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )

                .populate(
                    "rawMaterials.stockReceive",
                    "receiveNo invoiceNo invoiceDate receivedDate supplier"
                )

                .populate(
                    "rawMaterials.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                );


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "Production Updated Successfully.",

            data:
                response

        });

    }


    catch (error) {

        console.log(
            "UPDATE PRODUCTION ERROR:",
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
// GET NEXT PRODUCTION NUMBER
// ======================================

exports.getNextProductionNo = async (req, res) => {

    try {

        const lastProduction = await Production
            .findOne({
                isDeleted: false
            })
            .sort({
                createdAt: -1
            });

        let nextNumber = 1;

        if (lastProduction && lastProduction.productionNo) {

            const match =
                lastProduction.productionNo.match(/\d+$/);

            if (match) {

                nextNumber =
                    parseInt(match[0], 10) + 1;

            }

        }

        const productionNo =
            `PROD-${String(nextNumber).padStart(4, "0")}`;

        return res.status(200).json({

            success: true,

            message:
                "Next Production Number generated successfully.",

            data: {
                productionNo
            }

        });

    }
    catch (error) {

        console.log(
            "Next Production Number Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// =====================================================
// DELETE PRODUCTION - SOFT DELETE
// =====================================================

exports.deleteProduction = async (req, res) => {

    try {

        const { id } = req.params;

        const production = await Production.findOne({
            _id: id,
            isDeleted: false
        });

        if (!production) {

            return res.status(404).json({
                success: false,
                message: "Production not found."
            });

        }

        production.isDeleted = true;

        await production.save();

        return res.status(200).json({

            success: true,

            message: "Production deleted successfully.",

            data: production

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};




// warehouse lo yanni productionItems unnai


exports.getProductionsByWarehouse = async (req, res) => {

    try {

        const { warehouseId } = req.params;

        const productions = await Production.find({
            warehouse: warehouseId,
            isDeleted: false
        })

            // =========================================
            // WAREHOUSE
            // =========================================

            .populate(
                "warehouse",
                "warehouseName warehouseCode"
            )

            // =========================================
            // RAW MATERIAL INSIDE rawMaterials[]
            // =========================================

            .populate(
                "rawMaterials.rawMaterial",
                "rawMaterialName rawMaterialCode unit"
            )

            // =========================================
            // STOCK RECEIVE INSIDE rawMaterials[]
            // =========================================

            .populate(
                "rawMaterials.stockReceive",
                "receiveNo invoiceNo invoiceDate receivedDate supplier"
            )

            // =========================================
            // SORT
            // =========================================

            .sort({
                productionDate: -1
            });


        // =========================================
        // RESPONSE
        // =========================================

        return res.status(200).json({

            success: true,

            message:
                "Warehouse productions fetched successfully.",

            warehouseId,

            totalProductions:
                productions.length,

            data: productions

        });

    }
    catch (error) {

        console.log(
            "GET WAREHOUSE PRODUCTIONS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
