const mongoose = require("mongoose");

const ProductionInstruction = require("../models/production-instruction");
const StockReceive = require("../models/stock-receive");
const Warehouse = require("../models/warehouse");
const RawMaterial = require("../models/raw-material");


// =====================================================
// CREATE PRODUCTION INSTRUCTION
// ADMIN
// =====================================================

exports.createProductionInstruction = async (req, res) => {

    try {

        const {
            instructionNo,
            instructionDate,
            warehouse,
            items,
            remarks
        } = req.body;


        // =====================================================
        // BASIC VALIDATION
        // =====================================================

        if (!instructionNo) {

            return res.status(400).json({

                success: false,
                message: "Instruction Number is required."

            });

        }


        if (!warehouse) {

            return res.status(400).json({

                success: false,
                message: "Warehouse is required."

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
                    "At least one production instruction item is required."

            });

        }


        // =====================================================
        // VALIDATE WAREHOUSE
        // =====================================================

        const warehouseExists =
            await Warehouse.findById(warehouse);

        if (!warehouseExists) {

            return res.status(404).json({

                success: false,
                message: "Warehouse not found."

            });

        }


        // =====================================================
        // CHECK DUPLICATE INSTRUCTION NO
        // =====================================================

        const alreadyExists =
            await ProductionInstruction.findOne({

                instructionNo,
                isDeleted: false

            });

        if (alreadyExists) {

            return res.status(400).json({

                success: false,
                message:
                    "Production Instruction Number already exists."

            });

        }


        // =====================================================
        // VALIDATE ITEMS
        // =====================================================

        let totalTargetWeightKg = 0;

        const finalItems = [];


        for (const item of items) {


            // =================================================
            // RAW MATERIAL
            // =================================================

            if (!item.rawMaterial) {

                return res.status(400).json({

                    success: false,
                    message: "Raw Material is required."

                });

            }


            const rawMaterialDoc =
                await RawMaterial.findById(
                    item.rawMaterial
                );

            if (!rawMaterialDoc) {

                return res.status(404).json({

                    success: false,
                    message: "Raw Material not found."

                });

            }


            // =================================================
            // STOCK RECEIVE
            // =================================================

            if (!item.stockReceive) {

                return res.status(400).json({

                    success: false,
                    message: "Stock Receive is required."

                });

            }


            const stock =
                await StockReceive.findById(
                    item.stockReceive
                );

            if (!stock) {

                return res.status(404).json({

                    success: false,
                    message: "Stock Receive not found."

                });

            }


            // =================================================
            // CHECK STOCK WAREHOUSE
            // =================================================

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


            // =================================================
            // BATCH
            // =================================================

            if (!item.batchNo) {

                return res.status(400).json({

                    success: false,
                    message: "Batch Number is required."

                });

            }


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


            // =================================================
            // PACK DETAILS
            // =================================================

            if (!item.variantName) {

                return res.status(400).json({

                    success: false,
                    message: "Variant Name is required."

                });

            }


            if (!item.skuCode) {

                return res.status(400).json({

                    success: false,
                    message:
                        `SKU Code is required for ${item.variantName}.`

                });

            }


            if (!item.packSize) {

                return res.status(400).json({

                    success: false,
                    message:
                        `Pack Size is required for ${item.variantName}.`

                });

            }


            const weightInGrams =
                Number(item.weightInGrams);


            if (
                !Number.isFinite(weightInGrams) ||
                weightInGrams <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Weight is required for ${item.variantName}.`

                });

            }


            const targetPacks =
                Number(item.targetPacks);


            if (
                !Number.isInteger(targetPacks) ||
                targetPacks <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Target Packs is required for ${item.variantName}.`

                });

            }


            // =================================================
            // CALCULATE TARGET WEIGHT
            // =================================================

            const targetWeightKg =

                Number(

                    (
                        weightInGrams *
                        targetPacks /
                        1000

                    ).toFixed(3)

                );


            // =================================================
            // CHECK AVAILABLE STOCK
            // =================================================

            if (
                Number(stockItem.availableWeightKg) <
                targetWeightKg
            ) {

                return res.status(400).json({

                    success: false,

                    message:

                        `${rawMaterialDoc.rawMaterialName} ` +

                        `Batch ${item.batchNo} has only ` +

                        `${stockItem.availableWeightKg} KG available. ` +

                        `Required: ${targetWeightKg} KG.`

                });

            }


            // =================================================
            // TOTAL
            // =================================================

            totalTargetWeightKg +=
                targetWeightKg;


            // =================================================
            // FINAL ITEM
            // =================================================

            finalItems.push({

                rawMaterial:
                    item.rawMaterial,

                stockReceive:
                    item.stockReceive,

                batchNo:
                    String(item.batchNo).trim(),

                variantName:
                    String(item.variantName).trim(),

                skuCode:
                    String(item.skuCode)
                        .trim()
                        .toUpperCase(),

                packSize:
                    String(item.packSize).trim(),

                weightInGrams:
                    weightInGrams,

                targetPacks:
                    targetPacks,

                targetWeightKg:
                    targetWeightKg

            });

        }


        // =====================================================
        // ROUND TOTAL
        // =====================================================

        totalTargetWeightKg =
            Number(
                totalTargetWeightKg.toFixed(3)
            );


        // =====================================================
        // CREATE INSTRUCTION
        // =====================================================

        const instruction =

            await ProductionInstruction.create({

                instructionNo,

                instructionDate:
                    instructionDate || new Date(),

                warehouse,

                items:
                    finalItems,

                totalTargetWeightKg,

                remarks:
                    remarks || "",

                status:
                    "Pending"

            });


        // =====================================================
        // POPULATE RESPONSE
        // =====================================================

        const response =

            await ProductionInstruction.findById(
                instruction._id
            )

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )

                .populate(
                    "items.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                )

                .populate(
                    "items.stockReceive",
                    "receiveNo supplier warehouse"
                );


        // =====================================================
        // SUCCESS
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Production Instruction Created Successfully.",

            data:
                response

        });

    }

    catch (error) {

        console.log(
            "Create Production Instruction Error:",
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
// GET ALL PRODUCTION INSTRUCTIONS
// ADMIN
// =====================================================

exports.getAllProductionInstructions = async (req, res) => {

    try {

        const instructions =

            await ProductionInstruction.find({

                isDeleted: false

            })

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )

                .populate(
                    "items.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                )

                .populate(
                    "items.stockReceive",
                    "receiveNo supplier warehouse"
                )

                .populate(
                    "production",
                    "productionNo productionDate status"
                )

                .sort({

                    createdAt: -1

                });


        return res.status(200).json({

            success: true,

            count:
                instructions.length,

            data:
                instructions

        });

    }

    catch (error) {

        console.log(
            "Get All Production Instructions Error:",
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
// GET PRODUCTION INSTRUCTION BY ID
// ======================================

exports.getProductionInstructionById = async (req, res) => {

    try {

        const { id } = req.params;


        // ======================================
        // VALIDATE ID
        // ======================================

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message: "Invalid Production Instruction ID."

            });

        }


        // ======================================
        // GET INSTRUCTION
        // ======================================
        const instruction =
            await ProductionInstruction.findOne({

                _id: id,

                isDeleted: false

            })

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )

                .populate(
                    "items.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                )

                .populate(
                    "items.stockReceive",
                    "receiveNo supplier warehouse invoiceNo invoiceDate receivedDate"
                )

                .populate(
                    "production",
                    "productionNo productionDate status"
                );
        // ======================================
        // NOT FOUND
        // ======================================

        if (!instruction) {

            return res.status(404).json({

                success: false,

                message:
                    "Production Instruction not found."

            });

        }


        // ======================================
        // SUCCESS
        // ======================================

        return res.status(200).json({

            success: true,

            data: instruction

        });

    }

    catch (error) {

        console.log(
            "Get Production Instruction By ID Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// ======================================
// UPDATE PRODUCTION INSTRUCTION
// ADMIN - ONLY PENDING
// ======================================

// ======================================
// UPDATE PRODUCTION INSTRUCTION
// ADMIN - ONLY PENDING
// ======================================

exports.updateProductionInstruction = async (req, res) => {

    try {

        const { id } = req.params;

        // ======================================
        // VALIDATE ID
        // ======================================

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message: "Invalid Production Instruction ID."

            });

        }


        // ======================================
        // FIND INSTRUCTION
        // ======================================

        const instruction =
            await ProductionInstruction.findOne({

                _id: id,

                isDeleted: false

            });


        if (!instruction) {

            return res.status(404).json({

                success: false,

                message: "Production Instruction not found."

            });

        }


        // ======================================
        // ONLY PENDING CAN BE UPDATED
        // ======================================

        if (instruction.status !== "Pending") {

            return res.status(400).json({

                success: false,

                message:
                    `Production Instruction cannot be updated because its status is ${instruction.status}.`

            });

        }


        // ======================================
        // REQUEST DATA
        // ======================================

        const {

            instructionDate,

            warehouse,

            items,

            totalTargetWeightKg,

            remarks

        } = req.body;


        // ======================================
        // BASIC VALIDATION
        // ======================================

        if (!warehouse) {

            return res.status(400).json({

                success: false,

                message: "Warehouse is required."

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
                    "At least one production item is required."

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
        // PROCESS ITEMS
        // ======================================

        const finalItems = [];


        for (const item of items) {

            // ==================================
            // BASIC ITEM VALIDATION
            // ==================================

            if (!item.rawMaterial) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Raw Material is required."

                });

            }


            if (!item.stockReceive) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Stock Receive is required."

                });

            }


            if (!item.batchNo) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Batch Number is required."

                });

            }


            if (!item.variantName) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Variant Name is required."

                });

            }


            if (!item.skuCode) {

                return res.status(400).json({

                    success: false,

                    message:
                        "SKU Code is required."

                });

            }


            if (!item.packSize) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Pack Size is required."

                });

            }


            const weightInGrams =
                Number(item.weightInGrams || 0);


            const targetPacks =
                Number(item.targetPacks || 0);


            if (weightInGrams <= 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Weight is required for ${item.variantName}.`

                });

            }


            if (targetPacks <= 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Target Packs is required for ${item.variantName}.`

                });

            }


            // ==================================
            // VALIDATE RAW MATERIAL
            // ==================================

            const rawMaterialExists =
                await RawMaterial.findById(
                    item.rawMaterial
                );


            if (!rawMaterialExists) {

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
                        "Selected Stock Receive does not belong to selected warehouse."

                });

            }


            // ==================================
            // FIND BATCH
            // ==================================

            const stockItem =
                stock.items.find(

                    stockItem =>

                        stockItem.rawMaterial.toString() ===
                        item.rawMaterial.toString()

                        &&

                        stockItem.batchNo ===
                        item.batchNo

                );


            if (!stockItem) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Batch ${item.batchNo} not found in selected Stock Receive.`

                });

            }


            // ==================================
            // CALCULATE TARGET WEIGHT
            // ==================================

            const targetWeightKg =
                Number(

                    (
                        weightInGrams *
                        targetPacks /
                        1000

                    ).toFixed(3)

                );


            // ==================================
            // CHECK AVAILABLE STOCK
            // ==================================

            if (
                Number(stockItem.availableWeightKg) <
                targetWeightKg
            ) {

                return res.status(400).json({

                    success: false,

                    message:

                        `${rawMaterialExists.rawMaterialName} ` +

                        `Batch ${item.batchNo} has only ` +

                        `${stockItem.availableWeightKg} KG available. ` +

                        `Required ${targetWeightKg} KG.`

                });

            }


            // ==================================
            // PREPARE ITEM
            // ==================================

            finalItems.push({

                rawMaterial:
                    item.rawMaterial,

                stockReceive:
                    item.stockReceive,

                batchNo:
                    String(
                        item.batchNo
                    ).trim(),

                variantName:
                    String(
                        item.variantName
                    ).trim(),

                skuCode:
                    String(
                        item.skuCode
                    )
                        .trim()
                        .toUpperCase(),

                packSize:
                    String(
                        item.packSize
                    ).trim(),

                weightInGrams:
                    weightInGrams,

                targetPacks:
                    targetPacks,

                targetWeightKg:
                    targetWeightKg

            });

        }


        // ======================================
        // CALCULATE TOTAL TARGET WEIGHT
        // ======================================

        const calculatedTotalTargetWeightKg =
            Number(

                finalItems
                    .reduce(

                        (total, item) =>

                            total +
                            Number(
                                item.targetWeightKg || 0
                            ),

                        0

                    )
                    .toFixed(3)

            );


        // ======================================
        // UPDATE INSTRUCTION
        // ======================================

        instruction.instructionDate =
            instructionDate ||
            instruction.instructionDate;


        instruction.warehouse =
            warehouse;


        instruction.items =
            finalItems;


        instruction.totalTargetWeightKg =
            calculatedTotalTargetWeightKg;


        instruction.remarks =
            remarks || "";


        // ======================================
        // SAVE
        // ======================================

        await instruction.save();


        // ======================================
        // POPULATE RESPONSE
        // ======================================

        const response =
            await ProductionInstruction.findById(
                instruction._id
            )

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )

                .populate(
                    "items.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                )

                .populate(
                    "items.stockReceive",
                    "receiveNo supplier warehouse invoiceNo invoiceDate receivedDate"
                );


        // ======================================
        // SUCCESS
        // ======================================

        return res.status(200).json({

            success: true,

            message:
                "Production Instruction Updated Successfully.",

            data: response

        });

    }

    catch (error) {

        console.log(
            "Update Production Instruction Error:",
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
// ACCEPT PRODUCTION INSTRUCTION
// ======================================
// ======================================
// ACCEPT PRODUCTION INSTRUCTION
// ======================================

exports.acceptProductionInstruction = async (req, res) => {

    try {

        const { id } = req.params;


        // ======================================
        // VALIDATE ID
        // ======================================

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Production Instruction ID."

            });

        }


        // ======================================
        // FIND INSTRUCTION
        // ======================================

        const instruction =
            await ProductionInstruction.findOne({

                _id: id,

                isDeleted: false

            });


        if (!instruction) {

            return res.status(404).json({

                success: false,

                message:
                    "Production Instruction not found."

            });

        }


        // ======================================
        // ONLY PENDING CAN ACCEPT
        // ======================================

        if (
            instruction.status !== "Pending"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Production Instruction cannot be accepted because its current status is ${instruction.status}.`

            });

        }


        // ======================================
        // UPDATE STATUS
        // ======================================

        instruction.status = "Accepted";

        instruction.acceptedAt = new Date();

        await instruction.save();


        // ======================================
        // GET UPDATED RESPONSE
        // ======================================

        const response =
            await ProductionInstruction.findById(
                instruction._id
            )

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )

                .populate(
                    "items.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                )

                .populate(
                    "items.stockReceive",
                    "receiveNo supplier warehouse"
                );


        // ======================================
        // SUCCESS
        // ======================================

        return res.status(200).json({

            success: true,

            message:
                "Production Instruction accepted successfully.",

            data:
                response

        });

    }


    catch (error) {

        console.log(
            "Accept Production Instruction Error:",
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
// CANCEL PRODUCTION INSTRUCTION
// ======================================

exports.cancelProductionInstruction = async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid Production Instruction ID."
            });

        }

        const instruction =
            await ProductionInstruction.findOne({
                _id: id,
                isDeleted: false
            });

        if (!instruction) {

            return res.status(404).json({
                success: false,
                message: "Production Instruction not found."
            });

        }

        // Only Pending instruction can be cancelled
        if (instruction.status !== "Pending") {

            return res.status(400).json({
                success: false,
                message:
                    `Production Instruction cannot be cancelled because its current status is ${instruction.status}.`
            });

        }

        instruction.status = "Cancelled";

        await instruction.save();

        const response =
            await ProductionInstruction.findById(
                instruction._id
            )
                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )
                .populate(
                    "rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                )
                .populate(
                    "stockReceive",
                    "receiveNo supplier warehouse"
                );

        return res.status(200).json({

            success: true,

            message:
                "Production Instruction cancelled successfully.",

            data: response

        });

    }
    catch (error) {

        console.log(
            "Cancel Production Instruction Error:",
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
// DELETE PRODUCTION INSTRUCTION
// ======================================

exports.deleteProductionInstruction = async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid Production Instruction ID."
            });

        }

        const instruction =
            await ProductionInstruction.findOne({
                _id: id,
                isDeleted: false
            });

        if (!instruction) {

            return res.status(404).json({
                success: false,
                message: "Production Instruction not found."
            });

        }

        // Only Pending instruction can be deleted
        if (instruction.status !== "Pending") {

            return res.status(400).json({
                success: false,
                message:
                    `Production Instruction cannot be deleted because its current status is ${instruction.status}.`
            });

        }

        // Soft delete
        instruction.isDeleted = true;

        await instruction.save();

        return res.status(200).json({

            success: true,

            message:
                "Production Instruction deleted successfully."

        });

    }
    catch (error) {

        console.log(
            "Delete Production Instruction Error:",
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
// GET NEXT PRODUCTION INSTRUCTION NUMBER
// ======================================

exports.getNextInstructionNo = async (req, res) => {

    try {

        const lastInstruction =
            await ProductionInstruction
                .findOne({
                    isDeleted: false
                })
                .sort({
                    createdAt: -1
                })
                .select("instructionNo");

        let nextNumber = 1;

        if (
            lastInstruction &&
            lastInstruction.instructionNo
        ) {

            const match =
                lastInstruction.instructionNo.match(
                    /(\d+)$/
                );

            if (match) {

                nextNumber =
                    Number(match[1]) + 1;

            }

        }

        const instructionNo =
            `PI-${String(nextNumber).padStart(6, "0")}`;

        return res.status(200).json({

            success: true,

            data: {
                instructionNo
            }

        });

    }
    catch (error) {

        console.log(
            "Get Next Production Instruction Number Error:",
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
// GET PRODUCTION INSTRUCTIONS BY WAREHOUSE
// ======================================

// exports.getProductionInstructionsByWarehouse = async (req, res) => {

//     try {

//         const { warehouseId } = req.params;

//         // ======================================
//         // VALIDATE WAREHOUSE ID
//         // ======================================

//         if (!mongoose.Types.ObjectId.isValid(warehouseId)) {

//             return res.status(400).json({

//                 success: false,

//                 message: "Invalid Warehouse ID."

//             });

//         }


//         // ======================================
//         // CHECK WAREHOUSE
//         // ======================================

//         const warehouse =
//             await Warehouse.findById(warehouseId);

//         if (!warehouse) {

//             return res.status(404).json({

//                 success: false,

//                 message: "Warehouse not found."

//             });

//         }


//         // ======================================
//         // GET INSTRUCTIONS
//         // ======================================

//         const instructions =
//             await ProductionInstruction.find({

//                 warehouse: warehouseId,

//                 isDeleted: false

//             })
//                 .populate(
//                     "warehouse",
//                     "warehouseName warehouseCode"
//                 )
//                 .populate(
//                     "rawMaterial",
//                     "rawMaterialName rawMaterialCode unit"
//                 )
//                 .populate(
//                     "stockReceive",
//                     "receiveNo supplier warehouse"
//                 )
//                 .sort({
//                     createdAt: -1
//                 });


//         // ======================================
//         // RESPONSE
//         // ======================================

//         return res.status(200).json({

//             success: true,

//             count:
//                 instructions.length,

//             data:
//                 instructions

//         });

//     }
//     catch (error) {

//         console.log(
//             "Get Production Instructions By Warehouse Error:",
//             error
//         );

//         return res.status(500).json({

//             success: false,

//             message:
//                 error.message

//         });

//     }

// };

exports.getProductionInstructionsByWarehouse = async (req, res) => {

    try {

        const { warehouseId } = req.params;


        // ======================================
        // VALIDATE WAREHOUSE ID
        // ======================================

        if (!mongoose.Types.ObjectId.isValid(warehouseId)) {

            return res.status(400).json({

                success: false,

                message: "Invalid Warehouse ID."

            });

        }


        // ======================================
        // CHECK WAREHOUSE
        // ======================================

        const warehouse =
            await Warehouse.findById(warehouseId);

        if (!warehouse) {

            return res.status(404).json({

                success: false,

                message: "Warehouse not found."

            });

        }


        // ======================================
        // GET INSTRUCTIONS
        // ======================================

        const instructions =
            await ProductionInstruction.find({

                warehouse: warehouseId,

                isDeleted: false

            })

                // ======================================
                // Warehouse
                // ======================================

                .populate(
                    "warehouse",
                    "warehouseName warehouseCode"
                )


                // ======================================
                // Raw Material
                // items.rawMaterial
                // ======================================

                .populate(
                    "items.rawMaterial",
                    "rawMaterialName rawMaterialCode unit"
                )


                // ======================================
                // Stock Receive
                // items.stockReceive
                // ======================================

                .populate(
                    "items.stockReceive",
                    "receiveNo supplier warehouse"
                )


                // ======================================
                // Sort
                // ======================================

                .sort({

                    createdAt: -1

                });


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            count:
                instructions.length,

            data:
                instructions

        });

    }


    catch (error) {

        console.log(
            "Get Production Instructions By Warehouse Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};