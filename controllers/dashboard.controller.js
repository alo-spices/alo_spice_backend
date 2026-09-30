const mongoose = require("mongoose");
const User = require("../models/user");
const Warehouse = require("../models/warehouse");
const Production = require("../models/production");
const ProductionInstruction = require("../models/production-instruction");
const StockReceive = require("../models/stock-receive");
const StockTransfer = require("../models/stock-transfer");
const Party = require("../models/party");
const Order = require("../models/order");
const OrderItem = require("../models/order-items");
const Delivery = require("../models/delivery");
const Collection = require("../models/collection");


// =====================================================
// GET ROLE BASED DASHBOARD
// =====================================================

// =====================================================
// GET ROLE BASED DASHBOARD
// =====================================================

exports.getDashboard = async (req, res) => {

    try {

        // =================================================
        // LOGIN USER
        // =================================================

        const userId =
            req.user?._id || req.user?.id;

        const role =
            req.user?.role;


        if (!userId || !role) {

            return res.status(401).json({

                success: false,

                message:
                    "User authentication details not found"

            });

        }


        // =================================================
        // OBJECT ID
        // =================================================

        const currentUserId =
            new mongoose.Types.ObjectId(userId);


        // =================================================
        // ROLE FLAGS
        // =================================================

        const isAdmin =
            role === "Admin" ||
            role === "SubAdmin";

        const isDistributor =
            role === "Distributor";

        const isWarehouseManager =
            role === "WarehouseManager";


        // =================================================
        // DASHBOARD EMPLOYEE ROLES
        // =================================================

        const employeeRoles = [

            "SalesManager",
            "Salesman",
            "Accountant",
            "DeliveryBoy"

        ];


        // =================================================
        // VALIDATE DASHBOARD ROLE
        // =================================================

        if (
            !isAdmin &&
            !isDistributor &&
            !isWarehouseManager
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Dashboard access not allowed for this role"

            });

        }


        // =================================================
        // BASE FILTERS
        // =================================================

        let employeeFilter = {

            isDeleted: false,

            role: {
                $in: employeeRoles
            }

        };


        let productionFilter = {

            status: "Completed",

            isDeleted: false

        };


        let instructionFilter = {

            isDeleted: false

        };


        let stockReceiveFilter = {};


        let stockTransferFilter = {

            isDeleted: false

        };


        let partyFilter = {

            isDeleted: false

        };


        let orderFilter = {

            isDeleted: false

        };


        let deliveryFilter = {

            isDeleted: false

        };


        let collectionFilter = {

            isDeleted: false

        };


        // =================================================
        // WAREHOUSE / DISTRIBUTOR SCOPE
        // =================================================

        let warehouseId = null;

        let distributorId = null;


        // =================================================
        // DISTRIBUTOR
        // =================================================

        if (isDistributor) {

            distributorId =
                currentUserId;


            // ---------------------------------------------
            // DISTRIBUTOR EMPLOYEES
            // ---------------------------------------------

            employeeFilter = {

                ...employeeFilter,

                distributor:
                    currentUserId,

                assignmentType:
                    "DISTRIBUTOR",

                role: {
                    $in: employeeRoles
                }

            };


            // ---------------------------------------------
            // DISTRIBUTOR DELIVERIES
            // ---------------------------------------------

            deliveryFilter = {

                ...deliveryFilter,

                sourceType:
                    "DISTRIBUTOR",

                sourceDistributor:
                    currentUserId

            };


            // ---------------------------------------------
            // DISTRIBUTOR STOCK TRANSFERS
            // ---------------------------------------------

            stockTransferFilter = {

                ...stockTransferFilter,

                destinationType:
                    "Distributor",

                destinationModel:
                    "User",

                destination:
                    currentUserId

            };


            // ---------------------------------------------
            // GET DISTRIBUTOR EMPLOYEES
            // ---------------------------------------------

            const distributorEmployees =
                await User.find({

                    distributor:
                        currentUserId,

                    assignmentType:
                        "DISTRIBUTOR",

                    role: {
                        $in: employeeRoles
                    },

                    isDeleted:
                        false

                })
                    .select("_id")
                    .lean();


            const employeeIds =
                distributorEmployees.map(
                    x => x._id
                );


            // ---------------------------------------------
            // DISTRIBUTOR ORDERS
            // ---------------------------------------------

            orderFilter = {

                ...orderFilter,

                employee: {
                    $in: employeeIds
                }

            };


            // ---------------------------------------------
            // DISTRIBUTOR COLLECTIONS
            // ---------------------------------------------

            collectionFilter = {

                ...collectionFilter,

                employee: {
                    $in: employeeIds
                }

            };

        }


        // =================================================
        // WAREHOUSE MANAGER
        // =================================================

        if (isWarehouseManager) {

            warehouseId =
                req.user?.warehouse;


            // ---------------------------------------------
            // VALIDATE WAREHOUSE
            // ---------------------------------------------

            if (!warehouseId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Warehouse is not assigned to this user"

                });

            }


            warehouseId =
                new mongoose.Types.ObjectId(
                    warehouseId
                );


            // ---------------------------------------------
            // WAREHOUSE EMPLOYEES
            // ---------------------------------------------

            employeeFilter = {

                ...employeeFilter,

                warehouse:
                    warehouseId,

                assignmentType:
                    "WAREHOUSE",

                role: {
                    $in: employeeRoles
                }

            };


            // ---------------------------------------------
            // PRODUCTION
            // ---------------------------------------------

            productionFilter = {

                ...productionFilter,

                warehouse:
                    warehouseId

            };


            // ---------------------------------------------
            // PRODUCTION INSTRUCTIONS
            // ---------------------------------------------

            instructionFilter = {

                ...instructionFilter,

                warehouse:
                    warehouseId

            };


            // ---------------------------------------------
            // STOCK RECEIVE
            // ---------------------------------------------

            stockReceiveFilter = {

                warehouse:
                    warehouseId

            };


            // ---------------------------------------------
            // STOCK TRANSFER
            // ---------------------------------------------

            stockTransferFilter = {

                ...stockTransferFilter,

                sourceWarehouse:
                    warehouseId

            };


            // ---------------------------------------------
            // DELIVERIES
            // ---------------------------------------------

            deliveryFilter = {

                ...deliveryFilter,

                sourceType:
                    "WAREHOUSE",

                sourceWarehouse:
                    warehouseId

            };


            // ---------------------------------------------
            // GET WAREHOUSE EMPLOYEES
            // ---------------------------------------------

            const warehouseEmployees =
                await User.find({

                    warehouse:
                        warehouseId,

                    assignmentType:
                        "WAREHOUSE",

                    role: {
                        $in: employeeRoles
                    },

                    isDeleted:
                        false

                })
                    .select("_id")
                    .lean();


            const employeeIds =
                warehouseEmployees.map(
                    x => x._id
                );


            // ---------------------------------------------
            // WAREHOUSE ORDERS
            // ---------------------------------------------

            orderFilter = {

                ...orderFilter,

                employee: {
                    $in: employeeIds
                }

            };


            // ---------------------------------------------
            // WAREHOUSE COLLECTIONS
            // ---------------------------------------------

            collectionFilter = {

                ...collectionFilter,

                employee: {
                    $in: employeeIds
                }

            };

        }


        // =================================================
        // LOAD ALL DASHBOARD DATA
        // =================================================

        const [

            employees,

            warehouseManagerCount,

            distributorCount,

            warehouses,

            productions,

            productionInstructions,

            stockReceives,

            stockTransfers,

            parties,

            orders,

            deliveries,

            collections

        ] = await Promise.all([


            // =================================================
            // EMPLOYEES
            // =================================================

            User.find(
                employeeFilter
            )
                .select(
                    "_id firstName lastName fullName employeeCode role mobile status profileImage distributor warehouse"
                )
                .lean(),


            // =================================================
            // WAREHOUSE MANAGER COUNT
            // =================================================

            User.countDocuments({

                role:
                    "WarehouseManager",

                isDeleted:
                    false

            }),


            // =================================================
            // DISTRIBUTOR COUNT
            // =================================================

            User.countDocuments({

                role:
                    "Distributor",

                isDeleted:
                    false

            }),


            // =================================================
            // WAREHOUSES
            // =================================================

            isAdmin

                ? Warehouse.find({

                    isActive:
                        true

                })
                    .select(
                        "_id warehouseCode warehouseName warehouseType"
                    )
                    .lean()

                : warehouseId

                    ? Warehouse.find({

                        _id:
                            warehouseId,

                        isActive:
                            true

                    })
                        .select(
                            "_id warehouseCode warehouseName warehouseType"
                        )
                        .lean()

                    : Warehouse.find({

                        isActive:
                            true

                    })
                        .select(
                            "_id warehouseCode warehouseName warehouseType"
                        )
                        .lean(),


            // =================================================
            // PRODUCTIONS
            // =================================================

            Production.find(
                productionFilter
            )
                .select(
                    "productionNo productionDate warehouse productionItems totalProducedWeightKg wasteKg status"
                )
                .populate(
                    "warehouse",
                    "warehouseCode warehouseName"
                )
                .sort({

                    productionDate:
                        -1

                })
                .lean(),


            // =================================================
            // PRODUCTION INSTRUCTIONS
            // =================================================

            ProductionInstruction.find(
                instructionFilter
            )
                .select(
                    "instructionNo instructionDate warehouse items totalTargetWeightKg status"
                )
                .populate(
                    "warehouse",
                    "warehouseCode warehouseName"
                )
                .sort({

                    instructionDate:
                        -1

                })
                .lean(),


            // =================================================
            // STOCK RECEIVE
            // =================================================

            StockReceive.find(
                stockReceiveFilter
            )
                .select(
                    "receiveNo supplier warehouse invoiceDate receivedDate items status"
                )
                .populate(
                    "warehouse",
                    "warehouseCode warehouseName"
                )
                .lean(),


            // =================================================
            // STOCK TRANSFER
            // =================================================

            StockTransfer.find(
                stockTransferFilter
            )
                .select(
                    "transferNo transferDate sourceWarehouse destinationType destination destinationModel items status"
                )
                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName"
                )
                .lean(),


            // =================================================
            // PARTIES
            // =================================================

            Party.find(
                partyFilter
            )
                .select(
                    "_id partyType partyCode partyName shopName ownerName mobile area route assignedSalesman status openingBalance creditLimit"
                )
                .populate(
                    "area",
                    "areaName"
                )
                .populate(
                    "route",
                    "routeName"
                )
                .lean(),


            // =================================================
            // ORDERS
            // =================================================

            Order.find(
                orderFilter
            )
                .select(
                    "orderNumber orderDate party partyType employee subTotal discountAmount taxableAmount gstAmount grandTotal orderStatus paymentStatus paidAmount balanceAmount"
                )
                .populate(
                    "party",
                    "partyName shopName ownerName mobile partyType area route"
                )
                .populate(
                    "employee",
                    "fullName firstName lastName role"
                )
                .sort({

                    orderDate:
                        -1

                })
                .lean(),


            // =================================================
            // DELIVERIES
            // =================================================

            Delivery.find(
                deliveryFilter
            )
                .select(
                    "deliveryNumber deliveryDate order party deliveryBoy sourceType sourceWarehouse sourceDistributor dispatchedAt deliveredAt deliveryStatus receiverName"
                )
                .populate(
                    "order",
                    "orderNumber orderDate grandTotal paidAmount balanceAmount orderStatus paymentStatus employee"
                )
                .populate(
                    "party",
                    "partyName shopName ownerName mobile partyType area route"
                )
                .populate(
                    "deliveryBoy",
                    "fullName firstName lastName mobile"
                )
                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName"
                )
                .populate(
                    "sourceDistributor",
                    "fullName mobile"
                )
                .sort({

                    deliveryDate:
                        -1

                })
                .lean(),


            // =================================================
            // COLLECTIONS
            // =================================================

            Collection.find(
                collectionFilter
            )
                .select(
                    "collectionNumber collectionDate party order partyType employee collectedAmount paymentMode remainingOutstanding status"
                )
                .populate(
                    "party",
                    "partyName shopName ownerName mobile"
                )
                .populate(
                    "order",
                    "orderNumber grandTotal paidAmount balanceAmount"
                )
                .populate(
                    "employee",
                    "fullName firstName lastName role"
                )
                .sort({

                    collectionDate:
                        -1

                })
                .lean()

        ]);


        // =================================================
        // FINISHED GOODS STOCK
        // =================================================

        const warehouseMap =
            new Map();


        productions.forEach(
            production => {

                if (!production.warehouse) {

                    return;

                }


                const warehouseId =
                    production.warehouse._id.toString();


                // ---------------------------------------------
                // CREATE WAREHOUSE
                // ---------------------------------------------

                if (
                    !warehouseMap.has(
                        warehouseId
                    )
                ) {

                    warehouseMap.set(

                        warehouseId,

                        {

                            warehouseId:
                                production.warehouse._id,

                            warehouseCode:
                                production.warehouse.warehouseCode,

                            warehouseName:
                                production.warehouse.warehouseName,

                            totalPacks:
                                0,

                            totalWeightKg:
                                0,

                            rejectedPacks:
                                0,

                            skuMap:
                                new Map()

                        }

                    );

                }


                const warehouse =
                    warehouseMap.get(
                        warehouseId
                    );


                // ---------------------------------------------
                // PROCESS PRODUCTION ITEMS
                // ---------------------------------------------

                (
                    production.productionItems ||
                    []
                )
                    .forEach(
                        item => {

                            const skuCode =
                                String(
                                    item.skuCode ||
                                    ""
                                )
                                    .trim()
                                    .toUpperCase();


                            if (!skuCode) {

                                return;

                            }


                            // -----------------------------------------
                            // CREATE SKU
                            // -----------------------------------------

                            if (
                                !warehouse.skuMap.has(
                                    skuCode
                                )
                            ) {

                                warehouse.skuMap.set(

                                    skuCode,

                                    {

                                        skuCode,

                                        variantName:
                                            item.variantName,

                                        packSize:
                                            item.packSize,

                                        weightInGrams:
                                            Number(
                                                item.weightInGrams ||
                                                0
                                            ),

                                        packsProduced:
                                            0,

                                        rejectedPacks:
                                            0,

                                        totalWeightKg:
                                            0,

                                        productionCount:
                                            0

                                    }

                                );

                            }


                            const sku =
                                warehouse.skuMap.get(
                                    skuCode
                                );


                            // -----------------------------------------
                            // PACKS
                            // -----------------------------------------

                            sku.packsProduced +=
                                Number(
                                    item.packsProduced ||
                                    0
                                );


                            // -----------------------------------------
                            // REJECTED
                            // -----------------------------------------

                            sku.rejectedPacks +=
                                Number(
                                    item.rejectedPacks ||
                                    0
                                );


                            // -----------------------------------------
                            // WEIGHT
                            // -----------------------------------------

                            sku.totalWeightKg +=
                                Number(
                                    item.totalWeightUsedKg ||
                                    0
                                );


                            // -----------------------------------------
                            // PRODUCTION COUNT
                            // -----------------------------------------

                            sku.productionCount +=
                                1;


                            // -----------------------------------------
                            // WAREHOUSE TOTAL PACKS
                            // -----------------------------------------

                            warehouse.totalPacks +=
                                Number(
                                    item.packsProduced ||
                                    0
                                );


                            // -----------------------------------------
                            // WAREHOUSE TOTAL WEIGHT
                            // -----------------------------------------

                            warehouse.totalWeightKg +=
                                Number(
                                    item.totalWeightUsedKg ||
                                    0
                                );


                            // -----------------------------------------
                            // WAREHOUSE REJECTED
                            // -----------------------------------------

                            warehouse.rejectedPacks +=
                                Number(
                                    item.rejectedPacks ||
                                    0
                                );

                        }
                    );

            }
        );


        // =================================================
        // FORMAT FINISHED GOODS STOCK
        // =================================================

        const finishedGoodsStock =

            Array.from(
                warehouseMap.values()
            )
                .map(
                    warehouse => ({

                        warehouseId:
                            warehouse.warehouseId,

                        warehouseCode:
                            warehouse.warehouseCode,

                        warehouseName:
                            warehouse.warehouseName,

                        totalPacks:
                            Number(
                                warehouse.totalPacks
                                    .toFixed(0)
                            ),

                        totalWeightKg:
                            Number(
                                warehouse.totalWeightKg
                                    .toFixed(3)
                            ),

                        rejectedPacks:
                            Number(
                                warehouse.rejectedPacks
                                    .toFixed(0)
                            ),

                        skuCount:
                            warehouse.skuMap.size,

                        finishedGoods:

                            Array.from(
                                warehouse.skuMap.values()
                            )
                                .map(
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

                    })
                );


        // =================================================
        // FINISHED GOODS TOTAL
        // =================================================

        const finishedGoodsTotal = {

            totalPacks:

                finishedGoodsStock.reduce(

                    (sum, warehouse) =>

                        sum +
                        warehouse.totalPacks,

                    0

                ),


            totalWeightKg:

                finishedGoodsStock.reduce(

                    (sum, warehouse) =>

                        sum +
                        warehouse.totalWeightKg,

                    0

                ),


            rejectedPacks:

                finishedGoodsStock.reduce(

                    (sum, warehouse) =>

                        sum +
                        warehouse.rejectedPacks,

                    0

                ),


            skuCount:

                new Set(

                    finishedGoodsStock.flatMap(

                        warehouse =>

                            warehouse.finishedGoods
                                .map(
                                    x => x.skuCode
                                )

                    )

                ).size

        };


        // =================================================
        // EMPLOYEE COUNTS
        // =================================================

        const employeeCounts = {

            total:
                employees.length,


            salesManagers:

                employees.filter(
                    x =>
                        x.role ===
                        "SalesManager"
                ).length,


            salesmen:

                employees.filter(
                    x =>
                        x.role ===
                        "Salesman"
                ).length,


            accountants:

                employees.filter(
                    x =>
                        x.role ===
                        "Accountant"
                ).length,


            deliveryBoys:

                employees.filter(
                    x =>
                        x.role ===
                        "DeliveryBoy"
                ).length

        };


        // =================================================
        // PARTY COUNTS
        // =================================================

        const retailerCount =

            parties.filter(
                x =>
                    x.partyType ===
                    "Retailer"
            ).length;


        const wholesalerCount =

            parties.filter(
                x =>
                    x.partyType ===
                    "Wholesaler"
            ).length;


        const activePartyCount =

            parties.filter(
                x =>
                    x.status ===
                    "Active"
            ).length;


        // =================================================
        // ORDER TOTALS
        // =================================================

        const orderTotals = {

            totalOrders:
                orders.length,


            pendingOrders:

                orders.filter(
                    x =>
                        x.orderStatus ===
                        "Pending"
                ).length,


            approvedOrders:

                orders.filter(
                    x =>
                        x.orderStatus ===
                        "Approved"
                ).length,


            processingOrders:

                orders.filter(
                    x =>
                        x.orderStatus ===
                        "Processing"
                ).length,


            deliveredOrders:

                orders.filter(
                    x =>
                        x.orderStatus ===
                        "Delivered"
                ).length,


            cancelledOrders:

                orders.filter(
                    x =>
                        x.orderStatus ===
                        "Cancelled"
                ).length,


            totalSales:

                orders.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.grandTotal ||
                            0
                        ),

                    0

                ),


            totalPaid:

                orders.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.paidAmount ||
                            0
                        ),

                    0

                ),


            totalOutstanding:

                orders.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.balanceAmount ||
                            0
                        ),

                    0

                )

        };


        // =================================================
        // PAYMENT / COLLECTION TOTALS
        // =================================================

        const collectionTotals = {

            totalCollections:
                collections.length,


            totalCollected:

                collections.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.collectedAmount ||
                            0
                        ),

                    0

                ),


            cash:

                collections
                    .filter(
                        x =>
                            x.paymentMode ===
                            "Cash"
                    )
                    .reduce(

                        (sum, x) =>

                            sum +
                            Number(
                                x.collectedAmount ||
                                0
                            ),

                        0

                    ),


            upi:

                collections
                    .filter(
                        x =>
                            x.paymentMode ===
                            "UPI"
                    )
                    .reduce(

                        (sum, x) =>

                            sum +
                            Number(
                                x.collectedAmount ||
                                0
                            ),

                        0

                    ),


            bankTransfer:

                collections
                    .filter(
                        x =>
                            x.paymentMode ===
                            "Bank Transfer"
                    )
                    .reduce(

                        (sum, x) =>

                            sum +
                            Number(
                                x.collectedAmount ||
                                0
                            ),

                        0

                    ),


            cheque:

                collections
                    .filter(
                        x =>
                            x.paymentMode ===
                            "Cheque"
                    )
                    .reduce(

                        (sum, x) =>

                            sum +
                            Number(
                                x.collectedAmount ||
                                0
                            ),

                        0

                    )

        };


        // =================================================
        // DELIVERY TOTALS
        // =================================================

        const deliveryTotals = {

            totalDeliveries:
                deliveries.length,


            pending:

                deliveries.filter(
                    x =>
                        x.deliveryStatus ===
                        "Pending"
                ).length,


            assigned:

                deliveries.filter(
                    x =>
                        x.deliveryStatus ===
                        "Assigned"
                ).length,


            dispatched:

                deliveries.filter(
                    x =>
                        x.deliveryStatus ===
                        "Dispatched"
                ).length,


            delivered:

                deliveries.filter(
                    x =>
                        x.deliveryStatus ===
                        "Delivered"
                ).length,


            failed:

                deliveries.filter(
                    x =>
                        x.deliveryStatus ===
                        "Failed"
                ).length,


            cancelled:

                deliveries.filter(
                    x =>
                        x.deliveryStatus ===
                        "Cancelled"
                ).length

        };


        // =================================================
        // PRODUCTION TOTALS
        // =================================================

        const productionTotals = {

            totalProductions:
                productions.length,


            totalProducedWeightKg:

                productions.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.totalProducedWeightKg ||
                            0
                        ),

                    0

                ),


            totalWasteKg:

                productions.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.wasteKg ||
                            0
                        ),

                    0

                ),


            totalProducedPacks:

                productions.reduce(

                    (sum, production) =>

                        sum +

                        (
                            production.productionItems ||
                            []
                        )
                            .reduce(

                                (itemSum, item) =>

                                    itemSum +
                                    Number(
                                        item.packsProduced ||
                                        0
                                    ),

                                0

                            ),

                    0

                )

        };


        // =================================================
        // RAW MATERIAL STOCK TOTALS
        // =================================================

        let rawMaterialWeightKg = 0;


        stockReceives.forEach(
            receive => {

                (
                    receive.items ||
                    []
                )
                    .forEach(
                        item => {

                            rawMaterialWeightKg +=
                                Number(
                                    item.availableWeightKg ||
                                    0
                                );

                        }
                    );

            }
        );


        const stockReceiveTotals = {

            totalReceives:
                stockReceives.length,


            rawMaterialAvailableWeightKg:

                Number(
                    rawMaterialWeightKg
                        .toFixed(3)
                )

        };


        // =================================================
        // STOCK TRANSFER TOTALS
        // =================================================

        const stockTransferTotals = {

            totalTransfers:
                stockTransfers.length,


            pending:

                stockTransfers.filter(
                    x =>
                        x.status ===
                        "Pending"
                ).length,


            approved:

                stockTransfers.filter(
                    x =>
                        x.status ===
                        "Approved"
                ).length,


            inTransit:

                stockTransfers.filter(
                    x =>
                        x.status ===
                        "InTransit"
                ).length,


            received:

                stockTransfers.filter(
                    x =>
                        x.status ===
                        "Received"
                ).length,


            cancelled:

                stockTransfers.filter(
                    x =>
                        x.status ===
                        "Cancelled"
                ).length

        };


        // =================================================
        // TODAY DATE RANGE
        // =================================================

        const today =
            new Date();


        const startOfDay =
            new Date(today);


        startOfDay.setHours(
            0,
            0,
            0,
            0
        );


        const endOfDay =
            new Date(today);


        endOfDay.setHours(
            23,
            59,
            59,
            999
        );


        // =================================================
        // TODAY ORDERS
        // =================================================

        const todayOrders =

            orders.filter(
                order => {

                    const date =
                        new Date(
                            order.orderDate
                        );


                    return (

                        date >=
                        startOfDay &&

                        date <=
                        endOfDay

                    );

                }
            );


        // =================================================
        // TODAY DELIVERIES
        // =================================================

        const todayDeliveries =

            deliveries.filter(
                delivery => {

                    const date =
                        new Date(
                            delivery.deliveryDate
                        );


                    return (

                        date >=
                        startOfDay &&

                        date <=
                        endOfDay

                    );

                }
            );


        // =================================================
        // TODAY COLLECTIONS
        // =================================================

        const todayCollections =

            collections.filter(
                collection => {

                    const date =
                        new Date(
                            collection.collectionDate
                        );


                    return (

                        date >=
                        startOfDay &&

                        date <=
                        endOfDay

                    );

                }
            );


        // =================================================
        // TODAY SUMMARY
        // =================================================

        const todaySummary = {

            orders:
                todayOrders.length,


            sales:

                todayOrders.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.grandTotal ||
                            0
                        ),

                    0

                ),


            deliveries:
                todayDeliveries.length,


            delivered:

                todayDeliveries.filter(
                    x =>
                        x.deliveryStatus ===
                        "Delivered"
                ).length,


            collections:

                todayCollections.reduce(

                    (sum, x) =>

                        sum +
                        Number(
                            x.collectedAmount ||
                            0
                        ),

                    0

                )

        };


        // =================================================
        // RECENT ORDERS
        // =================================================

        const recentOrders =

            orders
                .slice(
                    0,
                    10
                )
                .map(
                    order => ({

                        orderNumber:
                            order.orderNumber,

                        orderDate:
                            order.orderDate,

                        party:
                            order.party,

                        employee:
                            order.employee,

                        partyType:
                            order.partyType,

                        grandTotal:
                            Number(
                                order.grandTotal ||
                                0
                            ),

                        paymentStatus:
                            order.paymentStatus,

                        orderStatus:
                            order.orderStatus,

                        balanceAmount:
                            Number(
                                order.balanceAmount ||
                                0
                            )

                    })
                );


        // =================================================
        // RECENT DELIVERIES
        // =================================================

        const recentDeliveries =

            deliveries
                .slice(
                    0,
                    10
                )
                .map(
                    delivery => ({

                        deliveryNumber:
                            delivery.deliveryNumber,

                        deliveryDate:
                            delivery.deliveryDate,

                        order:
                            delivery.order,

                        party:
                            delivery.party,

                        deliveryBoy:
                            delivery.deliveryBoy,

                        deliveryStatus:
                            delivery.deliveryStatus,

                        dispatchedAt:
                            delivery.dispatchedAt,

                        deliveredAt:
                            delivery.deliveredAt

                    })
                );


        // =================================================
        // ROLE BASED RESPONSE
        // =================================================

        return res.status(200).json({

            success:
                true,

            role,


            // =================================================
            // DASHBOARD SCOPE
            // =================================================

            scope: {

                type:

                    isAdmin

                        ? "COMPANY"

                        : isDistributor

                            ? "DISTRIBUTOR"

                            : "WAREHOUSE",


                userId:
                    currentUserId,


                warehouseId,


                distributorId

            },


            // =================================================
            // DASHBOARD
            // =================================================

            dashboard: {


                // =============================================
                // TOP SUMMARY
                // =============================================

                summary: {


                    // -----------------------------------------
                    // EMPLOYEES
                    // -----------------------------------------

                    employees:
                        employeeCounts.total,


                    salesManagers:
                        employeeCounts.salesManagers,


                    salesmen:
                        employeeCounts.salesmen,


                    accountants:
                        employeeCounts.accountants,


                    deliveryBoys:
                        employeeCounts.deliveryBoys,


                    // -----------------------------------------
                    // USERS
                    // -----------------------------------------

                    warehouseManagers:
                        warehouseManagerCount,


                    distributors:
                        distributorCount,


                    // -----------------------------------------
                    // WAREHOUSE
                    // -----------------------------------------

                    warehouses:
                        warehouses.length,


                    // -----------------------------------------
                    // PARTIES
                    // -----------------------------------------

                    parties:
                        parties.length,


                    retailers:
                        retailerCount,


                    wholesalers:
                        wholesalerCount,


                    // -----------------------------------------
                    // ORDERS
                    // -----------------------------------------

                    orders:
                        orderTotals.totalOrders,


                    // -----------------------------------------
                    // DELIVERIES
                    // -----------------------------------------

                    deliveries:
                        deliveryTotals.totalDeliveries,


                    // -----------------------------------------
                    // FINISHED GOODS
                    // -----------------------------------------

                    finishedGoodsPacks:
                        finishedGoodsTotal.totalPacks,


                    finishedGoodsWeightKg:

                        Number(
                            finishedGoodsTotal
                                .totalWeightKg
                                .toFixed(3)
                        ),


                    // -----------------------------------------
                    // FINANCIAL
                    // -----------------------------------------

                    outstanding:

                        Number(
                            orderTotals
                                .totalOutstanding
                                .toFixed(2)
                        ),


                    totalSales:

                        Number(
                            orderTotals
                                .totalSales
                                .toFixed(2)
                        ),


                    totalCollected:

                        Number(
                            collectionTotals
                                .totalCollected
                                .toFixed(2)
                        )

                },


                // =============================================
                // TODAY
                // =============================================

                today:
                    todaySummary,


                // =============================================
                // EMPLOYEES
                // =============================================

                employees: {

                    total:
                        employeeCounts.total,


                    salesManagers:
                        employeeCounts.salesManagers,


                    salesmen:
                        employeeCounts.salesmen,


                    accountants:
                        employeeCounts.accountants,


                    deliveryBoys:
                        employeeCounts.deliveryBoys,


                    warehouseManagers:
                        warehouseManagerCount,


                    distributors:
                        distributorCount,


                    list:
                        employees

                },


                // =============================================
                // WAREHOUSES
                // =============================================

                warehouses:
                    warehouses,


                // =============================================
                // FINISHED GOODS
                // =============================================

                finishedGoods: {

                    total:
                        finishedGoodsTotal,

                    warehouses:
                        finishedGoodsStock

                },


                // =============================================
                // PRODUCTION
                // =============================================

                production:
                    productionTotals,


                // =============================================
                // PRODUCTION INSTRUCTIONS
                // =============================================

                productionInstructions: {

                    total:
                        productionInstructions.length,


                    pending:

                        productionInstructions.filter(
                            x =>
                                x.status ===
                                "Pending"
                        ).length,


                    accepted:

                        productionInstructions.filter(
                            x =>
                                x.status ===
                                "Accepted"
                        ).length,


                    inProgress:

                        productionInstructions.filter(
                            x =>
                                x.status ===
                                "In Progress"
                        ).length,


                    completed:

                        productionInstructions.filter(
                            x =>
                                x.status ===
                                "Completed"
                        ).length,


                    rejected:

                        productionInstructions.filter(
                            x =>
                                x.status ===
                                "Rejected"
                        ).length

                },


                // =============================================
                // RAW MATERIAL
                // =============================================

                rawMaterialStock:
                    stockReceiveTotals,


                // =============================================
                // STOCK TRANSFERS
                // =============================================

                stockTransfers:
                    stockTransferTotals,


                // =============================================
                // PARTIES
                // =============================================

                parties: {

                    total:
                        parties.length,


                    active:
                        activePartyCount,


                    inactive:
                        parties.length -
                        activePartyCount,


                    retailers:
                        retailerCount,


                    wholesalers:
                        wholesalerCount

                },


                // =============================================
                // ORDERS
                // =============================================

                orders:
                    orderTotals,


                // =============================================
                // DELIVERIES
                // =============================================

                deliveries:
                    deliveryTotals,


                // =============================================
                // COLLECTIONS
                // =============================================

                collections:
                    collectionTotals,


                // =============================================
                // RECENT DATA
                // =============================================

                recent: {

                    orders:
                        recentOrders,


                    deliveries:
                        recentDeliveries,


                    collections:

                        collections
                            .slice(
                                0,
                                10
                            )

                }

            }

        });

    }


    // =====================================================
    // ERROR
    // =====================================================

    catch (error) {

        console.error(
            "Get Dashboard Error:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Failed to load dashboard",

            error:
                error.message

        });

    }

};