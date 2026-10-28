const mongoose = require("mongoose");

const Production = require("../models/production");
const StockReceive = require("../models/stock-receive");
const ProductionInstruction = require("../models/production-instruction");
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
            remarks,
            productionInstructionId,
            instructionId,
            productionInstruction
        } = req.body;

        const linkedInstructionId =
            productionInstructionId ||
            instructionId ||
            productionInstruction;

        // BASIC VALIDATION
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

        if (!linkedInstructionId) {
            return res.status(400).json({
                success: false,
                message: "Production Instruction ID is required."
            });
        }

        if (
            !Array.isArray(rawMaterials) ||
            rawMaterials.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one raw material is required."
            });
        }

        if (
            !Array.isArray(productionItems) ||
            productionItems.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one production variant is required."
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(linkedInstructionId) ||
            !mongoose.Types.ObjectId.isValid(warehouse)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid instruction or warehouse ID."
            });
        }

        // VALIDATE WAREHOUSE
        const warehouseExists = await Warehouse.findById(warehouse);

        if (!warehouseExists) {
            return res.status(404).json({
                success: false,
                message: "Warehouse not found."
            });
        }

        // VALIDATE PRODUCTION INSTRUCTION
        const instruction = await ProductionInstruction.findOne({
            _id: linkedInstructionId,
            isDeleted: false
        });

        if (!instruction) {
            return res.status(404).json({
                success: false,
                message: "Production Instruction not found."
            });
        }

        if (instruction.warehouse.toString() !== warehouse.toString()) {
            return res.status(400).json({
                success: false,
                message:
                    "Production Instruction does not belong to the selected warehouse."
            });
        }

        if (instruction.production) {
            return res.status(400).json({
                success: false,
                message:
                    "Production entry already exists for this instruction."
            });
        }

        if (!["Accepted", "In Progress"].includes(instruction.status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Only Accepted or In Progress instructions can have production entries."
            });
        }

        // CHECK DUPLICATE PRODUCTION NUMBER
        const alreadyExists = await Production.findOne({
            productionNo,
            isDeleted: false
        });

        if (alreadyExists) {
            return res.status(400).json({
                success: false,
                message: "Production Number already exists."
            });
        }

        // VALIDATE RAW MATERIALS AND CALCULATE RAW WEIGHT
        let totalRawWeight = 0;

        const stockItemsToUpdate = [];

        for (const item of rawMaterials) {
            if (
                !item.stockReceive ||
                !item.rawMaterial ||
                !item.batchNo ||
                item.weightUsedKg === undefined ||
                !Number.isFinite(Number(item.weightUsedKg)) ||
                Number(item.weightUsedKg) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid raw material or weight for batch ${item.batchNo || ""}.`
                });
            }

            const rawMaterialDoc = await RawMaterial.findById(
                item.rawMaterial
            );

            if (!rawMaterialDoc) {
                return res.status(404).json({
                    success: false,
                    message: "Raw Material not found."
                });
            }

            const stock = await StockReceive.findById(item.stockReceive);

            if (!stock) {
                return res.status(404).json({
                    success: false,
                    message: "Stock Receive not found."
                });
            }

            if (
                !stock.warehouse ||
                stock.warehouse.toString() !== warehouse.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Stock Receive ${stock.receiveNo} does not belong to selected warehouse.`
                });
            }

            const stockItem = stock.items.find(
                x =>
                    x.rawMaterial.toString() === item.rawMaterial.toString() &&
                    x.batchNo === item.batchNo
            );

            if (!stockItem) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Batch ${item.batchNo} not found in selected Stock Receive.`
                });
            }

            if (
                Number(stockItem.availableWeightKg) <
                Number(item.weightUsedKg)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${rawMaterialDoc.rawMaterialName} Batch ${item.batchNo} has only ${stockItem.availableWeightKg} KG available.`
                });
            }

            totalRawWeight += Number(item.weightUsedKg);

            stockItemsToUpdate.push({
                stockReceiveId: item.stockReceive,
                rawMaterialId: item.rawMaterial,
                batchNo: item.batchNo,
                weightUsedKg: Number(item.weightUsedKg)
            });
        }

        totalRawWeight = Number(totalRawWeight.toFixed(3));

        // VALIDATE PRODUCTION ITEMS
        let totalProducedWeight = 0;
        let totalRejectedWeight = 0;

        for (const item of productionItems) {
            const weight = Number(item.weightInGrams);
            const packs = Number(item.packsProduced);
            const rejectedPacks = Number(item.rejectedPacks || 0);

            if (
                !item.variantName ||
                !item.skuCode ||
                !item.batchNo ||
                !item.packSize
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Variant, SKU, batch and pack size are required."
                });
            }

            if (!Number.isFinite(weight) || weight <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid weight for ${item.variantName}.`
                });
            }

            if (!Number.isFinite(packs) || packs <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid packs produced for ${item.variantName}.`
                });
            }

            if (
                !Number.isInteger(rejectedPacks) ||
                rejectedPacks < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid rejected packs for ${item.variantName}.`
                });
            }

            const goodWeightKg = (weight * packs) / 1000;
            const rejectedWeightKg = (weight * rejectedPacks) / 1000;

            totalProducedWeight += goodWeightKg;
            totalRejectedWeight += rejectedWeightKg;
        }

        totalProducedWeight = Number(totalProducedWeight.toFixed(3));
        totalRejectedWeight = Number(totalRejectedWeight.toFixed(3));

        const totalConsumedWeight = Number(
            (totalProducedWeight + totalRejectedWeight).toFixed(3)
        );

        if (totalConsumedWeight > totalRawWeight) {
            return res.status(400).json({
                success: false,
                message:
                    `Production weight mismatch. Raw Material Used: ${totalRawWeight} KG, Production + Rejected: ${totalConsumedWeight} KG.`
            });
        }

        const wasteKg = Number(
            (
                totalRawWeight -
                totalProducedWeight -
                totalRejectedWeight
            ).toFixed(3)
        );

        // PREPARE PRODUCTION ITEMS
        const finalProductionItems = productionItems.map(item => {
            const goodWeightKg =
                (Number(item.weightInGrams) *
                    Number(item.packsProduced)) /
                1000;

            return {
                variantName: item.variantName.trim(),
                skuCode: item.skuCode.trim().toUpperCase(),
                batchNo: item.batchNo.trim(),
                packSize: item.packSize.trim(),
                weightInGrams: Number(item.weightInGrams),
                packsProduced: Number(item.packsProduced),
                rejectedPacks: Number(item.rejectedPacks || 0),
                totalWeightUsedKg: Number(goodWeightKg.toFixed(3))
            };
        });

        const finalRawMaterials = rawMaterials.map(item => ({
            stockReceive: item.stockReceive,
            rawMaterial: item.rawMaterial,
            batchNo: item.batchNo,
            availableWeightKg: Number(item.availableWeightKg || 0),
            weightUsedKg: Number(item.weightUsedKg)
        }));

        // CREATE PRODUCTION
        const production = await Production.create({
            productionNo,
            productionDate: productionDate || new Date(),
            warehouse,
            rawMaterials: finalRawMaterials,
            rawWeightUsedKg: totalRawWeight,
            productionItems: finalProductionItems,
            totalProducedWeightKg: totalProducedWeight,
            wasteKg,
            remarks: remarks || "",
            status: "Completed"
        });

        // DEDUCT RAW MATERIAL STOCK
        for (const usedItem of stockItemsToUpdate) {
            const stock = await StockReceive.findById(
                usedItem.stockReceiveId
            );

            if (!stock) {
                throw new Error(
                    `Stock Receive ${usedItem.stockReceiveId} was not found while updating stock.`
                );
            }

            const stockItem = stock.items.find(
                x =>
                    x.rawMaterial.toString() ===
                    usedItem.rawMaterialId.toString() &&
                    x.batchNo === usedItem.batchNo
            );

            if (!stockItem) {
                throw new Error(
                    `Batch ${usedItem.batchNo} was not found while updating stock.`
                );
            }

            if (
                Number(stockItem.availableWeightKg) <
                usedItem.weightUsedKg
            ) {
                throw new Error(
                    `Insufficient stock for batch ${usedItem.batchNo}.`
                );
            }

            stockItem.availableWeightKg = Number(
                (
                    Number(stockItem.availableWeightKg) -
                    usedItem.weightUsedKg
                ).toFixed(3)
            );

            const totalAvailableWeight = stock.items.reduce(
                (sum, x) => sum + Number(x.availableWeightKg || 0),
                0
            );

            const totalOriginalWeight = stock.items.reduce(
                (sum, x) => sum + Number(x.totalWeightKg || 0),
                0
            );

            if (totalAvailableWeight <= 0) {
                stock.status = "Completed";
            } else if (totalAvailableWeight < totalOriginalWeight) {
                stock.status = "Partially Used";
            } else {
                stock.status = "Received";
            }

            await stock.save();
        }

        // LINK PRODUCTION TO INSTRUCTION
        instruction.production = production._id;
        instruction.status = "Completed";

        await instruction.save();

        // POPULATE RESPONSE
        const response = await Production.findById(production._id)
            .populate("warehouse", "warehouseName warehouseCode")
            .populate(
                "rawMaterials.stockReceive",
                "receiveNo supplier warehouse"
            )
            .populate(
                "rawMaterials.rawMaterial",
                "rawMaterialName rawMaterialCode unit"
            );

        return res.status(201).json({
            success: true,
            message:
                "Production created successfully and instruction marked Completed.",
            data: response,
            instruction: {
                _id: instruction._id,
                status: instruction.status,
                production: instruction.production
            }
        });
    } catch (error) {
        console.error("Create Production Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create production."
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



// =====================================================
// GET COMPLETED PRODUCTIONS FOR LOGGED-IN WAREHOUSE
// =====================================================

exports.getWarehouseCompletedProductions = async (req, res) => {
    try {
        // Role validation
        if (req.user?.role !== "WarehouseManager") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Warehouse Manager only."
            });
        }

        // Get warehouse ID from authenticated JWT
        const warehouseId = req.user?.warehouseId;

        if (!warehouseId) {
            return res.status(400).json({
                success: false,
                message: "Warehouse is not assigned to this user."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid warehouse ID."
            });
        }

        const warehouseObjectId =
            new mongoose.Types.ObjectId(warehouseId);

        // Fetch completed productions for this warehouse
        const productions = await Production.find({
            warehouse: warehouseObjectId,
            status: "Completed",
            isDeleted: false
        })
            .populate("warehouse", "warehouseCode warehouseName warehouseType")
            .populate("rawMaterials.stockReceive")
            .populate("rawMaterials.rawMaterial")
            .sort({ productionDate: -1, createdAt: -1 })
            .lean();

        // Calculate summary
        const summary = productions.reduce(
            (acc, production) => {
                acc.totalProductions += 1;

                acc.totalRawWeightUsedKg +=
                    Number(production.rawWeightUsedKg || 0);

                acc.totalProducedWeightKg +=
                    Number(production.totalProducedWeightKg || 0);

                acc.totalWasteKg +=
                    Number(production.wasteKg || 0);

                for (const item of production.productionItems || []) {
                    acc.totalPacksProduced +=
                        Number(item.packsProduced || 0);

                    acc.totalRejectedPacks +=
                        Number(item.rejectedPacks || 0);
                }

                return acc;
            },
            {
                totalProductions: 0,
                totalRawWeightUsedKg: 0,
                totalProducedWeightKg: 0,
                totalWasteKg: 0,
                totalPacksProduced: 0,
                totalRejectedPacks: 0
            }
        );

        return res.status(200).json({
            success: true,
            message: "Warehouse completed productions fetched successfully.",

            warehouse: productions.length
                ? productions[0].warehouse
                : {
                    _id: warehouseObjectId
                },

            summary,

            total: productions.length,

            productions
        });

    } catch (error) {
        console.error(
            "Get warehouse completed productions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch warehouse completed productions.",
            error: error.message
        });
    }
};
