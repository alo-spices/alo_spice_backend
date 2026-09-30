const mongoose = require("mongoose");
const Warehouse = require("../models/warehouse");
const Product = require("../models/product");
const StockReceive = require("../models/stock-receive");
const Production = require("../models/production");

// ======================================
// CREATE
// ======================================

exports.createWarehouse = async (req, res) => {

    try {

        const {

            warehouseName,

            warehouseType,

            managerName,

            mobileNumber,

            email,

            address,

            city,

            state,

            pincode,

            isActive

        } = req.body;

        // ==========================
        // Validation
        // ==========================

        if (!warehouseName) {

            return res.status(400).json({

                success: false,

                message: "Warehouse Name is required."

            });

        }

        // ==========================
        // Generate Warehouse Code
        // ==========================

        const lastWarehouse = await Warehouse

            .findOne()

            .sort({ createdAt: -1 });

        let warehouseCode = "WH0001";

        if (lastWarehouse && lastWarehouse.warehouseCode) {

            const lastNo = parseInt(

                lastWarehouse.warehouseCode.replace("WH", "")

            );

            warehouseCode =

                "WH" +

                String(lastNo + 1).padStart(4, "0");

        }

        // ==========================
        // Create Warehouse
        // ==========================

        const warehouse = await Warehouse.create({

            warehouseCode,

            warehouseName,

            warehouseType,

            managerName,

            mobileNumber,

            email,

            address,

            city,

            state,

            pincode,

            isActive

        });

        return res.status(201).json({

            success: true,

            message: "Warehouse Created Successfully.",

            data: warehouse

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
// GET ALL
// ======================================

exports.getAllWarehouses = async (req, res) => {

    try {

        const warehouses = await Warehouse.find()

            .sort({ createdAt: -1 });

        res.json({

            success: true,

            data: warehouses

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================
// GET BY ID
// ======================================

// ======================================
// GET WAREHOUSE BY ID
// ======================================

exports.getWarehouseById = async (req, res) => {

    try {

        const { id } = req.params;

        // ==========================
        // FIND WAREHOUSE
        // ==========================

        const warehouse = await Warehouse.findById(id);

        if (!warehouse) {

            return res.status(404).json({

                success: false,

                message: "Warehouse not found."

            });

        }

        // ==========================
        // SUCCESS RESPONSE
        // ==========================

        return res.status(200).json({

            success: true,

            data: warehouse

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
// UPDATE
// ======================================

// ======================================
// UPDATE WAREHOUSE
// ======================================

exports.updateWarehouse = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            warehouseName,

            warehouseType,

            managerName,

            mobileNumber,

            email,

            address,

            city,

            state,

            pincode,

            isActive

        } = req.body;

        // ==========================
        // FIND WAREHOUSE
        // ==========================

        const warehouse = await Warehouse.findById(id);

        if (!warehouse) {

            return res.status(404).json({

                success: false,

                message: "Warehouse not found."

            });

        }

        // ==========================
        // DUPLICATE NAME CHECK
        // ==========================

        const duplicate = await Warehouse.findOne({

            warehouseName,

            _id: { $ne: id }

        });

        if (duplicate) {

            return res.status(400).json({

                success: false,

                message: "Warehouse name already exists."

            });

        }

        // ==========================
        // UPDATE DATA
        // ==========================

        warehouse.warehouseName = warehouseName;

        warehouse.warehouseType = warehouseType;

        warehouse.managerName = managerName;

        warehouse.mobileNumber = mobileNumber;

        warehouse.email = email;

        warehouse.address = address;

        warehouse.city = city;

        warehouse.state = state;

        warehouse.pincode = pincode;

        warehouse.isActive = isActive;

        await warehouse.save();

        return res.status(200).json({

            success: true,

            message: "Warehouse Updated Successfully.",

            data: warehouse

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
// DELETE
// ======================================

exports.deleteWarehouse = async (req, res) => {

    try {

        const warehouse = await Warehouse.findByIdAndDelete(

            req.params.id

        );

        if (!warehouse) {

            return res.status(404).json({

                success: false,

                message: "Warehouse not found."

            });

        }

        res.json({

            success: true,

            message: "Warehouse Deleted Successfully."

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.getRawMaterialsByWarehouse = async (req, res) => {

    try {

        const stockReceives = await StockReceive.find({

            warehouse: req.params.warehouseId,

            status: { $ne: "Completed" }

        }).populate(
            "items.rawMaterial",
            "rawMaterialName rawMaterialCode unit"
        );

        const rawMaterials = [];

        stockReceives.forEach(stock => {

            stock.items.forEach(item => {

                // Skip if populate failed
                if (!item.rawMaterial) return;

                if (item.availableWeightKg <= 0) return;

                const exists = rawMaterials.find(

                    x => x._id.toString() === item.rawMaterial._id.toString()

                );

                if (!exists) {

                    rawMaterials.push({

                        _id: item.rawMaterial._id,

                        rawMaterialName: item.rawMaterial.rawMaterialName,

                        rawMaterialCode: item.rawMaterial.rawMaterialCode,

                        unit: item.rawMaterial.unit

                    });

                }

            });

        });

        return res.json({

            success: true,

            data: rawMaterials

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================
// GET FINISHED GOODS STOCK BY WAREHOUSE
// ======================================
// ======================================
// GET FINISHED GOODS STOCK BY WAREHOUSE
// ADMIN - FULL DETAILS
// ======================================

// exports.getFinishedGoodsStockByWarehouse = async (req, res) => {

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
//         // GET WAREHOUSE
//         // ======================================

//         const warehouse =
//             await Warehouse.findById(warehouseId)
//                 .select(
//                     "warehouseCode warehouseName warehouseType"
//                 );


//         if (!warehouse) {

//             return res.status(404).json({

//                 success: false,

//                 message: "Warehouse not found."

//             });

//         }


//         // ======================================
//         // GET COMPLETED PRODUCTIONS
//         // ======================================

//         const productions =
//             await Production.find({

//                 warehouse: warehouseId,

//                 status: "Completed",

//                 isDeleted: false

//             })
//                 .select(
//                     "productionNo productionDate productionItems remarks createdAt"
//                 )
//                 .sort({
//                     productionDate: -1
//                 });


//         // ======================================
//         // FINISHED GOODS MAP
//         // ======================================

//         const stockMap = new Map();


//         // ======================================
//         // PROCESS PRODUCTIONS
//         // ======================================

//         productions.forEach(production => {

//             production.productionItems.forEach(item => {

//                 const skuCode =
//                     String(item.skuCode || "")
//                         .trim()
//                         .toUpperCase();


//                 if (!skuCode) {

//                     return;

//                 }


//                 // ==================================
//                 // CREATE SKU ENTRY
//                 // ==================================

//                 if (!stockMap.has(skuCode)) {

//                     stockMap.set(

//                         skuCode,

//                         {

//                             skuCode:

//                                 skuCode,

//                             variantName:

//                                 item.variantName,

//                             packSize:

//                                 item.packSize,

//                             weightInGrams:

//                                 Number(
//                                     item.weightInGrams || 0
//                                 ),

//                             packsProduced: 0,

//                             rejectedPacks: 0,

//                             totalWeightKg: 0,

//                             productionCount: 0,

//                             productionHistory: []

//                         }

//                     );

//                 }


//                 const stock =
//                     stockMap.get(skuCode);


//                 // ==================================
//                 // ADD PACKS
//                 // ==================================

//                 stock.packsProduced +=
//                     Number(
//                         item.packsProduced || 0
//                     );


//                 // ==================================
//                 // ADD REJECTED
//                 // ==================================

//                 stock.rejectedPacks +=
//                     Number(
//                         item.rejectedPacks || 0
//                     );


//                 // ==================================
//                 // ADD WEIGHT
//                 // ==================================

//                 stock.totalWeightKg +=
//                     Number(
//                         item.totalWeightUsedKg || 0
//                     );


//                 // ==================================
//                 // PRODUCTION COUNT
//                 // ==================================

//                 stock.productionCount += 1;


//                 // ==================================
//                 // PRODUCTION HISTORY
//                 // ==================================

//                 stock.productionHistory.push({

//                     productionId:

//                         production._id,

//                     productionNo:

//                         production.productionNo,

//                     productionDate:

//                         production.productionDate,

//                     packsProduced:

//                         Number(
//                             item.packsProduced || 0
//                         ),

//                     rejectedPacks:

//                         Number(
//                             item.rejectedPacks || 0
//                         ),

//                     totalWeightKg:

//                         Number(
//                             item.totalWeightUsedKg || 0
//                         ),

//                     remarks:

//                         production.remarks || ""

//                 });

//             });

//         });


//         // ======================================
//         // FORMAT FINISHED GOODS
//         // ======================================

//         const finishedGoods =

//             Array.from(
//                 stockMap.values()
//             ).map(item => ({

//                 skuCode:

//                     item.skuCode,

//                 variantName:

//                     item.variantName,

//                 packSize:

//                     item.packSize,

//                 weightInGrams:

//                     Number(
//                         item.weightInGrams
//                     ),

//                 packsProduced:

//                     Number(
//                         item.packsProduced
//                     ),

//                 rejectedPacks:

//                     Number(
//                         item.rejectedPacks
//                     ),

//                 totalWeightKg:

//                     Number(
//                         item.totalWeightKg
//                             .toFixed(3)
//                     ),

//                 productionCount:

//                     item.productionCount,

//                 productionHistory:

//                     item.productionHistory

//             }));


//         // ======================================
//         // WAREHOUSE TOTALS
//         // ======================================

//         let totalPacks = 0;

//         let totalRejectedPacks = 0;

//         let totalWeightKg = 0;


//         finishedGoods.forEach(item => {

//             totalPacks +=
//                 item.packsProduced;

//             totalRejectedPacks +=
//                 item.rejectedPacks;

//             totalWeightKg +=
//                 item.totalWeightKg;

//         });


//         // ======================================
//         // SUCCESS RESPONSE
//         // ======================================

//         return res.status(200).json({

//             success: true,

//             data: {

//                 warehouse: {

//                     _id:
//                         warehouse._id,

//                     warehouseCode:
//                         warehouse.warehouseCode,

//                     warehouseName:
//                         warehouse.warehouseName,

//                     warehouseType:
//                         warehouse.warehouseType

//                 },

//                 summary: {

//                     totalProducts:
//                         finishedGoods.length,

//                     totalPacks:
//                         totalPacks,

//                     totalRejectedPacks:
//                         totalRejectedPacks,

//                     totalWeightKg:
//                         Number(
//                             totalWeightKg.toFixed(3)
//                         )

//                 },

//                 finishedGoods:
//                     finishedGoods

//             }

//         });

//     }

//     catch (error) {

//         console.log(
//             "Get Finished Goods Stock By Warehouse Error:",
//             error
//         );


//         return res.status(500).json({

//             success: false,

//             message:
//                 error.message

//         });

//     }

// };

// ======================================
// GET ALL FINISHED GOODS STOCK
// ADMIN - ALL WAREHOUSES
// ======================================


exports.getAllFinishedGoodsStock = async (req, res) => {

    try {

        // ======================================
        // GET COMPLETED PRODUCTIONS
        // ======================================

        const productions =
            await Production.find({

                status: "Completed",

                isDeleted: false

            })
                .select(
                    "productionNo productionDate warehouse productionItems remarks"
                )
                .populate(
                    "warehouse",
                    "warehouseCode warehouseName"
                )
                .sort({
                    productionDate: -1
                });


        // ======================================
        // WAREHOUSE MAP
        // ======================================

        const warehouseMap = new Map();


        // ======================================
        // PROCESS PRODUCTIONS
        // ======================================

        productions.forEach(production => {

            if (!production.warehouse) {

                return;

            }


            const warehouseId =
                production.warehouse._id.toString();


            // ==================================
            // CREATE WAREHOUSE
            // ==================================

            if (!warehouseMap.has(warehouseId)) {

                warehouseMap.set(
                    warehouseId,
                    {

                        warehouseId:
                            production.warehouse._id,

                        warehouseCode:
                            production.warehouse.warehouseCode,

                        warehouseName:
                            production.warehouse.warehouseName,

                        totalPacks: 0,

                        totalWeightKg: 0,

                        finishedGoods: []

                    }
                );

            }


            const warehouse =
                warehouseMap.get(warehouseId);


            // ==================================
            // PROCESS PRODUCTION ITEMS
            // ==================================

            production.productionItems.forEach(item => {

                const skuCode =
                    String(item.skuCode || "")
                        .trim()
                        .toUpperCase();


                if (!skuCode) {

                    return;

                }


                // ==================================
                // FIND EXISTING SKU
                // ==================================

                let finishedGood =
                    warehouse.finishedGoods.find(

                        x =>
                            x.skuCode === skuCode

                    );


                // ==================================
                // CREATE SKU
                // ==================================

                if (!finishedGood) {

                    finishedGood = {

                        skuCode:

                            skuCode,

                        variantName:

                            item.variantName,

                        packSize:

                            item.packSize,

                        weightInGrams:

                            Number(
                                item.weightInGrams || 0
                            ),

                        packsProduced: 0,

                        rejectedPacks: 0,

                        totalWeightKg: 0,

                        productionCount: 0

                    };


                    warehouse.finishedGoods.push(
                        finishedGood
                    );

                }


                // ==================================
                // ADD PACKS
                // ==================================

                finishedGood.packsProduced +=
                    Number(
                        item.packsProduced || 0
                    );


                // ==================================
                // ADD REJECTED
                // ==================================

                finishedGood.rejectedPacks +=
                    Number(
                        item.rejectedPacks || 0
                    );


                // ==================================
                // ADD WEIGHT
                // ==================================

                finishedGood.totalWeightKg +=
                    Number(
                        item.totalWeightUsedKg || 0
                    );


                // ==================================
                // PRODUCTION COUNT
                // ==================================

                finishedGood.productionCount += 1;


                // ==================================
                // WAREHOUSE TOTALS
                // ==================================

                warehouse.totalPacks +=
                    Number(
                        item.packsProduced || 0
                    );


                warehouse.totalWeightKg +=
                    Number(
                        item.totalWeightUsedKg || 0
                    );

            });

        });


        // ======================================
        // FORMAT RESPONSE
        // ======================================

        const finishedGoodsStock =

            Array.from(
                warehouseMap.values()
            ).map(warehouse => ({

                warehouseId:
                    warehouse.warehouseId,

                warehouseCode:
                    warehouse.warehouseCode,

                warehouseName:
                    warehouse.warehouseName,

                totalPacks:
                    Number(
                        warehouse.totalPacks.toFixed(0)
                    ),

                totalWeightKg:
                    Number(
                        warehouse.totalWeightKg.toFixed(3)
                    ),

                finishedGoods:

                    warehouse.finishedGoods.map(
                        item => ({

                            skuCode:
                                item.skuCode,

                            variantName:
                                item.variantName,

                            packSize:
                                item.packSize,

                            weightInGrams:
                                Number(
                                    item.weightInGrams
                                ),

                            packsProduced:
                                Number(
                                    item.packsProduced
                                ),

                            rejectedPacks:
                                Number(
                                    item.rejectedPacks
                                ),

                            totalWeightKg:
                                Number(
                                    item.totalWeightKg
                                        .toFixed(3)
                                ),

                            productionCount:
                                item.productionCount

                        })
                    )

            }));


        // ======================================
        // SUCCESS
        // ======================================

        return res.status(200).json({

            success: true,

            data: finishedGoodsStock

        });

    }

    catch (error) {

        console.log(
            "Get All Finished Goods Stock Error:",
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
// GET FINISHED GOODS STOCK BY WAREHOUSE
// ======================================

exports.getFinishedGoodsStockByWarehouse = async (req, res) => {

    try {

        const {
            warehouseId
        } = req.params;


        // ======================================
        // VALIDATE WAREHOUSE ID
        // ======================================

        if (
            !mongoose.Types.ObjectId.isValid(
                warehouseId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Warehouse ID"

            });

        }


        // ======================================
        // CHECK WAREHOUSE
        // ======================================

        const warehouse =
            await Warehouse.findOne({

                _id: warehouseId,

                isActive: true

            }).select(

                "warehouseCode warehouseName warehouseType"

            );


        if (!warehouse) {

            return res.status(404).json({

                success: false,

                message:
                    "Warehouse not found or inactive"

            });

        }


        // ======================================
        // GET COMPLETED PRODUCTIONS
        // ======================================

        const productions =
            await Production.find({

                warehouse: warehouseId,

                status: "Completed",

                isDeleted: false

            })

                .select(
                    "productionNo productionDate productionItems remarks"
                )

                .sort({

                    productionDate: -1

                });


        // ======================================
        // PRODUCT MAP
        // ======================================

        const productMap =
            new Map();


        // ======================================
        // SUMMARY
        // ======================================

        let totalPacks = 0;

        let totalRejectedPacks = 0;

        let totalWeightKg = 0;


        // ======================================
        // PROCESS PRODUCTIONS
        // ======================================

        productions.forEach(

            production => {

                if (
                    !production.productionItems ||
                    production.productionItems.length === 0
                ) {

                    return;

                }


                production.productionItems.forEach(

                    item => {

                        const skuCode =
                            String(
                                item.skuCode || ""
                            )
                                .trim()
                                .toUpperCase();


                        if (!skuCode) {

                            return;

                        }


                        // ==================================
                        // GET / CREATE PRODUCT
                        // ==================================

                        let product =
                            productMap.get(
                                skuCode
                            );


                        if (!product) {

                            product = {

                                skuCode,

                                variantName:
                                    item.variantName || "",

                                packSize:
                                    item.packSize || "",

                                weightInGrams:
                                    Number(
                                        item.weightInGrams || 0
                                    ),

                                packsProduced:
                                    0,

                                rejectedPacks:
                                    0,

                                totalWeightKg:
                                    0,

                                productionCount:
                                    0,

                                productionHistory:
                                    []

                            };


                            productMap.set(
                                skuCode,
                                product
                            );

                        }


                        // ==================================
                        // CURRENT PRODUCTION VALUES
                        // ==================================

                        const packsProduced =
                            Number(
                                item.packsProduced || 0
                            );


                        const rejectedPacks =
                            Number(
                                item.rejectedPacks || 0
                            );


                        const totalWeightUsedKg =
                            Number(
                                item.totalWeightUsedKg || 0
                            );


                        // ==================================
                        // TOTALS
                        // ==================================

                        product.packsProduced +=
                            packsProduced;


                        product.rejectedPacks +=
                            rejectedPacks;


                        product.totalWeightKg +=
                            totalWeightUsedKg;


                        product.productionCount +=
                            1;


                        // ==================================
                        // WAREHOUSE SUMMARY
                        // ==================================

                        totalPacks +=
                            packsProduced;


                        totalRejectedPacks +=
                            rejectedPacks;


                        totalWeightKg +=
                            totalWeightUsedKg;


                        // ==================================
                        // PRODUCTION HISTORY
                        // ==================================

                        product.productionHistory.push({

                            productionId:
                                production._id,

                            productionNo:
                                production.productionNo,

                            productionDate:
                                production.productionDate,

                            batchNo:
                                item.batchNo || "",

                            packsProduced:
                                packsProduced,

                            rejectedPacks:
                                rejectedPacks,

                            totalWeightKg:
                                Number(
                                    totalWeightUsedKg.toFixed(3)
                                ),

                            remarks:
                                production.remarks || ""

                        });

                    }

                );

            }

        );


        // ======================================
        // FORMAT FINISHED GOODS
        // ======================================

        const finishedGoods =
            Array.from(
                productMap.values()
            ).map(

                product => ({

                    skuCode:
                        product.skuCode,

                    variantName:
                        product.variantName,

                    packSize:
                        product.packSize,

                    weightInGrams:
                        Number(
                            product.weightInGrams
                        ),

                    packsProduced:
                        Number(
                            product.packsProduced
                        ),

                    rejectedPacks:
                        Number(
                            product.rejectedPacks
                        ),

                    totalWeightKg:
                        Number(
                            product.totalWeightKg.toFixed(3)
                        ),

                    productionCount:
                        product.productionCount,

                    productionHistory:
                        product.productionHistory

                })

            );


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            data: {

                warehouse: {

                    _id:
                        warehouse._id,

                    warehouseCode:
                        warehouse.warehouseCode,

                    warehouseName:
                        warehouse.warehouseName,

                    warehouseType:
                        warehouse.warehouseType

                },


                summary: {

                    totalProducts:
                        finishedGoods.length,

                    totalPacks:
                        Number(
                            totalPacks.toFixed(0)
                        ),

                    totalRejectedPacks:
                        Number(
                            totalRejectedPacks.toFixed(0)
                        ),

                    totalWeightKg:
                        Number(
                            totalWeightKg.toFixed(3)
                        )

                },


                finishedGoods

            }

        });

    }


    catch (error) {

        console.log(
            "Get Finished Goods Stock By Warehouse Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};