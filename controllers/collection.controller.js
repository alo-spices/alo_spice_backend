const mongoose = require("mongoose");
const Collection = require("../models/collection");
const Party = require("../models/party");
const Order = require("../models/order");
const OrderItem = require("../models/order-items");
const Visit = require("../models/visit");
const User = require("../models/user");
const Attendance = require("../models/attendence");
const generateCollectionNumber = async () => {
    const count = await Collection.countDocuments();

    return `COL-${String(count + 1).padStart(5, "0")}`;
};
exports.createCollection = async (req, res) => {

    try {

        const {

            order,
            party,
            partyType,
            employee,
            visit,

            collectedAmount,

            paymentMode,

            transactionNumber,

            remarks

        } = req.body;

        // ==========================
        // ORDER VALIDATION
        // ==========================

        const orderData =
            await Order.findById(order);

        if (!orderData) {

            return res.status(404).json({

                success: false,

                message: "Order not found"

            });

        }
        // ==========================
        // AMOUNT VALIDATION
        // ==========================

        if (collectedAmount <= 0) {

            return res.status(400).json({

                success: false,

                message: "Collected amount must be greater than zero"

            });

        }

        if (collectedAmount > orderData.balanceAmount) {

            return res.status(400).json({

                success: false,

                message: "Collected amount cannot be greater than outstanding amount"

            });

        }

        // ==========================
        // COLLECTION NUMBER
        // ==========================

        const collectionNumber =
            await generateCollectionNumber();

        // ==========================
        // CALCULATE OUTSTANDING
        // ==========================

        const previousOutstanding =
            orderData.balanceAmount;

        const remainingOutstanding =
            previousOutstanding -
            collectedAmount;

        // ==========================
        // CREATE COLLECTION
        // ==========================

        const collection =
            await Collection.create({

                collectionNumber,

                order,

                party,

                partyType,

                employee,

                visit,

                collectedAmount,

                paymentMode,

                transactionNumber,

                previousOutstanding,

                remainingOutstanding:

                    remainingOutstanding < 0

                        ? 0

                        : remainingOutstanding,

                remarks

            });

        // ==========================
        // UPDATE ORDER
        // ==========================

        orderData.paidAmount +=
            collectedAmount;

        orderData.balanceAmount -=
            collectedAmount;

        if (orderData.balanceAmount <= 0) {

            orderData.balanceAmount = 0;

            orderData.paymentStatus =
                "Paid";

        }

        else {

            orderData.paymentStatus =
                "Partial";

        }

        await orderData.save();

        // ==========================
        // UPDATE VISIT
        // ==========================

        if (visit) {

            const visitData =
                await Visit.findById(visit);

            if (visitData) {

                visitData.collectionDone =
                    true;

                visitData.collectionAmount +=
                    collectedAmount;

                await visitData.save();

            }

        }

        // ==========================
        // UPDATE ATTENDANCE
        // ==========================

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const tomorrow =
            new Date(today);

        tomorrow.setDate(
            tomorrow.getDate() + 1
        );

        await Attendance.findOneAndUpdate(

            {

                employee,

                attendanceDate: {

                    $gte: today,

                    $lt: tomorrow

                },

                isDeleted: false

            },

            {

                $inc: {

                    totalCollections: 1

                }

            }

        );

        return res.status(201).json({

            success: true,

            message:
                "Collection Saved Successfully",

            data: collection

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.getCollections = async (req, res) => {
    try {

        let filter = {
            isDeleted: false
        };

        // ==========================================
        // ADMIN
        // ==========================================
        if (req.user?.role === "Admin") {

            // Admin can see all collections
            filter = {
                isDeleted: false
            };
        }

        // ==========================================
        // DISTRIBUTOR
        // ==========================================
        else if (req.user?.role === "Distributor") {

            const distributorId = req.user.id;

            // First get Salesmen assigned to this Distributor
            const salesmen = await User.find({
                distributor: distributorId,
                role: "Salesman",
                isDeleted: false
            }).select("_id");

            const salesmanIds = salesmen.map(
                salesman => salesman._id
            );

            // Collections related to orders booked
            // by those Salesmen
            const orders = await Order.find({
                employee: { $in: salesmanIds },
                isDeleted: false
            }).select("_id");

            const orderIds = orders.map(
                order => order._id
            );

            filter.order = { $in: orderIds };
        }

        // ==========================================
        // GET COLLECTIONS
        // ==========================================
        const collections = await Collection.find(filter)
            .populate("party")
            .populate({
                path: "employee",
                populate: [
                    {
                        path: "distributor",
                        select: "firstName lastName fullName mobile email"
                    },
                    {
                        path: "warehouse",
                        select: "warehouseName warehouseCode"
                    }
                ]
            })
            .populate("visit")
            .populate("order")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: collections.length,
            data: collections
        });

    } catch (error) {

        console.log("Get Collections Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getCollectionById = async (req, res) => {
    try {

        const collection = await Collection.findById(
            req.params.id
        )
            .populate("party")
            .populate("employee")
            .populate("visit");

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        res.status(200).json({
            success: true,
            data: collection
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateCollection = async (req, res) => {
    try {

        const collection = await Collection.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        res.status(200).json({
            success: true,
            data: collection
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.deleteCollection = async (req, res) => {
    try {

        const collection = await Collection.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true
            },
            {
                new: true
            }
        );

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Collection deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.verifyCollection = async (req, res) => {
    try {

        const collection = await Collection.findById(
            req.params.id
        );

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        collection.status = "Verified";
        collection.verifiedBy = req.user.id;
        collection.verifiedAt = new Date();

        await collection.save();

        res.status(200).json({
            success: true,
            message: "Collection verified successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.rejectCollection = async (req, res) => {
    try {

        const collection = await Collection.findById(
            req.params.id
        );

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        collection.status = "Rejected";
        collection.verifiedBy = req.user.id;
        collection.verifiedAt = new Date();

        await collection.save();

        res.status(200).json({
            success: true,
            message: "Collection rejected successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getOutstanding = async (req, res) => {
    try {

        // ==========================================
        // BASE FILTERS
        // ==========================================

        let orderFilter = {
            isDeleted: false
        };

        let collectionFilter = {
            isDeleted: false,
            status: {
                $in: ["Pending", "Verified"]
            }
        };


        // ==========================================
        // DISTRIBUTOR ROLE
        // ==========================================

        if (req.user?.role === "Distributor") {

            const distributorId = req.user.id;

            // ------------------------------------------
            // GET SALESmen ASSIGNED TO THIS DISTRIBUTOR
            // ------------------------------------------

            const salesmen = await User.find({
                distributor: distributorId,
                role: "Salesman",
                isDeleted: false
            }).select("_id");

            const salesmanIds = salesmen.map(
                salesman => salesman._id
            );


            // ------------------------------------------
            // ONLY ORDERS BOOKED BY THESE SALESMEN
            // ------------------------------------------

            orderFilter.employee = {
                $in: salesmanIds
            };

        }


        // ==========================================
        // GET ORDERS
        // ==========================================

        const orders = await Order.find(orderFilter)
            .populate({
                path: "party",
                select: "shopName ownerName mobile alternateMobile email address city state"
            })
            .populate({
                path: "employee",
                select: "fullName firstName lastName employeeCode mobile role"
            })
            .sort({ createdAt: -1 });


        // ==========================================
        // GET COLLECTIONS
        // ==========================================

        // Only collections belonging to the above orders
        const orderIds = orders.map(order => order._id);

        collectionFilter.order = {
            $in: orderIds
        };


        const collections = await Collection.find(collectionFilter)
            .populate({
                path: "employee",
                select: "fullName firstName lastName employeeCode mobile role"
            })
            .sort({ collectionDate: -1 });


        // ==========================================
        // GROUP COLLECTIONS BY ORDER
        // ==========================================

        const collectionMap = new Map();

        collections.forEach(collection => {

            const orderId = collection.order?.toString();

            if (!orderId) return;

            if (!collectionMap.has(orderId)) {
                collectionMap.set(orderId, []);
            }

            collectionMap.get(orderId).push(collection);
        });


        // ==========================================
        // GROUP ORDERS BY PARTY
        // ==========================================

        const partyMap = new Map();


        orders.forEach(order => {

            if (!order.party) return;

            const partyId = order.party._id.toString();

            if (!partyMap.has(partyId)) {

                partyMap.set(partyId, {
                    party: order.party,
                    partyType: order.partyType,

                    totalOrders: 0,
                    totalOrderAmount: 0,
                    totalCollectedAmount: 0,
                    totalOutstanding: 0,

                    orders: []
                });
            }


            const partyData = partyMap.get(partyId);


            // ==========================================
            // ORDER TOTAL
            // ==========================================

            const orderTotal =
                Number(order.grandTotal || 0);


            // ==========================================
            // COLLECTIONS FOR THIS ORDER
            // ==========================================

            const orderCollections =
                collectionMap.get(order._id.toString()) || [];


            // ==========================================
            // TOTAL COLLECTED FOR THIS ORDER
            // ==========================================

            const totalCollected =
                orderCollections.reduce(
                    (sum, collection) =>
                        sum + Number(
                            collection.collectedAmount || 0
                        ),
                    0
                );


            // ==========================================
            // OUTSTANDING
            // ==========================================

            const outstanding =
                Math.max(
                    orderTotal - totalCollected,
                    0
                );


            // ==========================================
            // PARTY TOTALS
            // ==========================================

            partyData.totalOrders += 1;

            partyData.totalOrderAmount += orderTotal;

            partyData.totalCollectedAmount += totalCollected;

            partyData.totalOutstanding += outstanding;


            // ==========================================
            // ORDER DETAILS
            // ==========================================

            partyData.orders.push({

                orderId: order._id,

                orderNumber: order.orderNumber,

                orderDate:
                    order.orderDate ||
                    order.createdAt,

                orderStatus: order.orderStatus,

                paymentStatus: order.paymentStatus,

                orderAmount: orderTotal,

                collectedAmount: totalCollected,

                outstandingAmount: outstanding,

                employee: order.employee,

                collections:
                    orderCollections.map(collection => ({

                        _id: collection._id,

                        collectionNumber:
                            collection.collectionNumber,

                        collectionDate:
                            collection.collectionDate,

                        collectedAmount:
                            Number(
                                collection.collectedAmount || 0
                            ),

                        paymentMode:
                            collection.paymentMode,

                        transactionNumber:
                            collection.transactionNumber,

                        previousOutstanding:
                            Number(
                                collection.previousOutstanding || 0
                            ),

                        remainingOutstanding:
                            Number(
                                collection.remainingOutstanding || 0
                            ),

                        status:
                            collection.status,

                        paymentProof:
                            collection.paymentProof,

                        remarks:
                            collection.remarks,

                        employee:
                            collection.employee
                    }))
            });
        });


        // ==========================================
        // ONLY PARTIES HAVING OUTSTANDING
        // ==========================================

        const outstandingParties =
            Array.from(partyMap.values())

                .filter(
                    item =>
                        item.totalOutstanding > 0
                )

                .map(item => ({

                    ...item,

                    totalOrderAmount:
                        Number(
                            item.totalOrderAmount.toFixed(2)
                        ),

                    totalCollectedAmount:
                        Number(
                            item.totalCollectedAmount.toFixed(2)
                        ),

                    totalOutstanding:
                        Number(
                            item.totalOutstanding.toFixed(2)
                        )
                }));


        // ==========================================
        // GRAND TOTAL OUTSTANDING
        // ==========================================

        const totalOutstanding =
            outstandingParties.reduce(
                (sum, party) =>
                    sum + party.totalOutstanding,
                0
            );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            totalOutstanding:
                Number(
                    totalOutstanding.toFixed(2)
                ),

            totalParties:
                outstandingParties.length,

            data:
                outstandingParties
        });


    } catch (error) {

        console.log(
            "Get Outstanding Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message
        });
    }
};

exports.getPartyOutstanding = async (req, res) => {

    try {

        const partyId = req.params.partyId;

        // =====================================
        // PARTY DETAILS
        // =====================================

        const party = await Party.findById(partyId)
            .populate("area", "areaName")
            .populate("route", "routeName");

        if (!party) {

            return res.status(404).json({

                success: false,
                message: "Party not found"

            });

        }


        // =====================================
        // GET ALL PARTY ORDERS
        // =====================================

        const orders = await Order.find({

            party: partyId,
            isDeleted: false

        }).sort({

            orderDate: 1

        });


        // =====================================
        // SUMMARY
        // =====================================

        let totalOutstanding = 0;

        const pendingOrders = [];

        const completedOrders = [];


        // =====================================
        // ORDER LOOP
        // =====================================

        for (const order of orders) {


            const balanceAmount =
                Number(order.balanceAmount || 0);


            totalOutstanding += balanceAmount;


            // =====================================
            // ORDER ITEMS
            // =====================================

            const items = await OrderItem.find({

                order: order._id

            })
                .populate(
                    "product",
                    "productName productCode"
                )
                .populate(
                    "variantId"
                );


            // =====================================
            // PRODUCTS
            // =====================================

            const products = items.map(item => {

                const variant = item.variantId;

                return {

                    _id: item._id,

                    productId:
                        item.product?._id || null,

                    productName:
                        item.product?.productName || "",

                    productCode:
                        item.product?.productCode || "",

                    variantId:
                        variant?._id ||
                        item.variantId ||
                        null,

                    variantName:
                        variant?.variantName ||
                        variant?.name ||
                        "",

                    packSize:
                        item.packSize ||
                        variant?.packSize ||
                        "",

                    quantity:
                        Number(item.quantity || 0),

                    price:
                        Number(item.price || 0),

                    discountAmount:
                        Number(item.discountAmount || 0),

                    gstPercentage:
                        Number(item.gstPercentage || 0),

                    lineTotal:
                        Number(item.lineTotal || 0)

                };

            });


            // =====================================
            // COLLECTION HISTORY
            // =====================================

            const collections =
                await Collection.find({

                    order: order._id,
                    party: partyId,
                    isDeleted: false

                })
                    .sort({

                        collectionDate: 1

                    })
                    .populate(
                        "employee",
                        "name employeeCode mobile"
                    )
                    .lean();


            // =====================================
            // ORDER RESPONSE
            // =====================================

            const orderData = {

                _id: order._id,

                orderNumber:
                    order.orderNumber,

                orderDate:
                    order.orderDate,

                subTotal:
                    Number(order.subTotal || 0),

                discountAmount:
                    Number(order.discountAmount || 0),

                taxableAmount:
                    Number(order.taxableAmount || 0),

                gstAmount:
                    Number(order.gstAmount || 0),

                grandTotal:
                    Number(order.grandTotal || 0),

                paidAmount:
                    Number(order.paidAmount || 0),

                balanceAmount:
                    balanceAmount,

                paymentStatus:
                    order.paymentStatus,

                orderStatus:
                    order.orderStatus,

                partyType:
                    party.partyType,

                partyId:
                    party._id,

                party: {

                    _id:
                        party._id,

                    partyCode:
                        party.partyCode,

                    partyType:
                        party.partyType,

                    partyName:
                        party.partyName,

                    shopName:
                        party.shopName,

                    ownerName:
                        party.ownerName,

                    mobile:
                        party.mobile

                },

                products,

                collections

            };


            // =====================================
            // PENDING / COMPLETED
            // =====================================

            if (
                balanceAmount > 0 &&
                order.paymentStatus !== "Paid"
            ) {

                pendingOrders.push(orderData);

            }

            else {

                completedOrders.push(orderData);

            }

        }


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(200).json({

            success: true,

            party: {

                _id:
                    party._id,

                partyCode:
                    party.partyCode,

                partyType:
                    party.partyType,

                partyName:
                    party.partyName,

                shopName:
                    party.shopName,

                ownerName:
                    party.ownerName,

                mobile:
                    party.mobile,

                alternateMobile:
                    party.alternateMobile,

                whatsappNumber:
                    party.whatsappNumber,

                email:
                    party.email,

                shopImage:
                    party.shopImage,

                gstNumber:
                    party.gstNumber,

                address:
                    party.address,

                city:
                    party.city,

                district:
                    party.district,

                state:
                    party.state,

                pincode:
                    party.pincode,

                area:
                    party.area,

                route:
                    party.route

            },

            summary: {

                totalOutstanding:
                    totalOutstanding,

                pendingInvoices:
                    pendingOrders.length,

                completedInvoices:
                    completedOrders.length

            },

            orders:
                pendingOrders,

            completedOrders:
                completedOrders

        });

    }

    catch (error) {

        console.error(
            "Get Party Outstanding Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
exports.getEmployeeOutstanding = async (req, res) => {

    try {

        const orders = await Order.find({

            employee: req.params.employeeId,

            balanceAmount: {
                $gt: 0
            },

            isDeleted: false

        })
            .populate({
                path: "party",
                select: `
                shopName
                ownerName
                mobile
                area
                route
            `
            })
            .sort({
                createdAt: -1
            });


        // =====================================
        // ADD ORDER ITEMS
        // =====================================

        const orderIds = orders.map(
            order => order._id
        );


        const orderItems = await OrderItem.find({

            order: {
                $in: orderIds
            }

        })
            .populate({

                path: "product",

                select: `
                productName
                productCode
            `

            });


        // =====================================
        // ATTACH PRODUCTS TO EACH ORDER
        // =====================================

        const ordersWithProducts = orders.map(order => {

            const products = orderItems
                .filter(item =>
                    item.order.toString() ===
                    order._id.toString()
                )
                .map(item => ({

                    _id: item._id,

                    productId:
                        item.product?._id,

                    productName:
                        item.product?.productName || "",

                    productCode:
                        item.product?.productCode || "",

                    variantId:
                        item.variantId,

                    packSize:
                        item.packSize,

                    quantity:
                        item.quantity,

                    price:
                        item.price,

                    discountAmount:
                        item.discountAmount,

                    gstPercentage:
                        item.gstPercentage,

                    lineTotal:
                        item.lineTotal

                }));


            return {

                ...order.toObject(),

                products

            };

        });


        // =====================================
        // TOTAL OUTSTANDING
        // =====================================

        const totalOutstanding =
            orders.reduce(

                (sum, order) =>
                    sum + order.balanceAmount,

                0

            );


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(200).json({

            success: true,

            summary: {

                totalOutstanding,

                totalInvoices:
                    orders.length

            },

            orders:
                ordersWithProducts

        });

    }

    catch (error) {

        console.error(
            "Employee Outstanding Error:",
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
// GET EMPLOYEE COLLECTION SUMMARY
// =====================================================

// =====================================================
// GET EMPLOYEE COLLECTIONS - FULL INVOICE DETAILS
// =====================================================

exports.getEmployeeCollections = async (req, res) => {
    try {

        const { employeeId } = req.params;


        // ==========================================
        // VALIDATE EMPLOYEE ID
        // ==========================================

        if (!employeeId) {

            return res.status(400).json({
                success: false,
                message: "Employee Id is required"
            });

        }


        if (!mongoose.Types.ObjectId.isValid(employeeId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid Employee Id"
            });

        }


        // ==========================================
        // CHECK EMPLOYEE
        // ==========================================

        const employee = await User.findById(employeeId)
            .select(
                "firstName lastName fullName employeeCode mobile role"
            )
            .lean();


        if (!employee) {

            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });

        }


        // ==========================================
        // GET COLLECTIONS
        // ==========================================

        const collections = await Collection.find({

            employee: employeeId,

            isDeleted: false

        })

            // ======================================
            // PARTY DETAILS
            // ======================================

            .populate({
                path: "party",
                select: `
                    partyType
                    partyCode
                    partyName
                    shopName
                    ownerName
                    mobile
                    alternateMobile
                    whatsappNumber
                    email
                    gstNumber
                    panNumber
                    licenseNumber
                    address
                    city
                    district
                    state
                    pincode
                    creditLimit
                    creditDays
                    openingBalance
                    status
                `
            })


            // ======================================
            // ORDER / INVOICE DETAILS
            // ======================================

            .populate({
                path: "order"
            })


            // ======================================
            // EMPLOYEE DETAILS
            // ======================================

            .populate({
                path: "employee",
                select: `
                    firstName
                    lastName
                    fullName
                    employeeCode
                    mobile
                    role
                `
            })


            // ======================================
            // VISIT DETAILS
            // ======================================

            .populate({
                path: "visit"
            })


            // ======================================
            // VERIFIED BY
            // ======================================

            .populate({
                path: "verifiedBy",
                select: `
                    firstName
                    lastName
                    fullName
                    employeeCode
                    role
                `
            })


            .sort({
                collectionDate: -1
            })

            .lean();


        // ==========================================
        // FORMAT INVOICE-WISE DATA
        // ==========================================

        const invoiceDetails = collections.map(
            (collection) => {

                const order = collection.order || {};
                const party = collection.party || {};

                return {

                    // =================================
                    // COLLECTION
                    // =================================

                    collection: {

                        _id: collection._id,

                        collectionNumber:
                            collection.collectionNumber,

                        collectionDate:
                            collection.collectionDate,

                        collectedAmount:
                            collection.collectedAmount,

                        paymentMode:
                            collection.paymentMode,

                        transactionNumber:
                            collection.transactionNumber,

                        previousOutstanding:
                            collection.previousOutstanding,

                        remainingOutstanding:
                            collection.remainingOutstanding,

                        paymentProof:
                            collection.paymentProof,

                        remarks:
                            collection.remarks,

                        status:
                            collection.status,

                        verifiedAt:
                            collection.verifiedAt

                    },


                    // =================================
                    // PARTY / OUTLET
                    // =================================

                    party: party,


                    // =================================
                    // INVOICE / ORDER
                    // =================================

                    order: order,


                    // =================================
                    // EMPLOYEE
                    // =================================

                    employee:
                        collection.employee,


                    // =================================
                    // VISIT
                    // =================================

                    visit:
                        collection.visit,


                    // =================================
                    // EASY DISPLAY FIELDS
                    // =================================

                    invoiceSummary: {

                        invoiceNumber:
                            order.orderNumber || "",

                        invoiceDate:
                            order.orderDate || null,

                        invoiceAmount:
                            order.grandTotal || 0,

                        collectedAmount:
                            collection.collectedAmount || 0,

                        remainingAmount:
                            collection.remainingOutstanding || 0,

                        paymentStatus:
                            order.paymentStatus || "Pending",

                        orderStatus:
                            order.orderStatus || "Pending"

                    }

                };

            }
        );


        // ==========================================
        // TOTALS
        // ==========================================

        const totalCollectedAmount =
            collections.reduce(
                (total, item) =>
                    total + Number(
                        item.collectedAmount || 0
                    ),
                0
            );


        const totalCollectionRecords =
            collections.length;


        // ==========================================
        // PENDING VERIFICATION
        // ==========================================

        const pendingVerificationAmount =
            collections
                .filter(
                    item =>
                        item.status === "Pending"
                )
                .reduce(
                    (total, item) =>
                        total + Number(
                            item.collectedAmount || 0
                        ),
                    0
                );


        // ==========================================
        // VERIFIED COLLECTION
        // ==========================================

        const verifiedCollectionAmount =
            collections
                .filter(
                    item =>
                        item.status === "Verified"
                )
                .reduce(
                    (total, item) =>
                        total + Number(
                            item.collectedAmount || 0
                        ),
                    0
                );


        // ==========================================
        // REJECTED COLLECTION
        // ==========================================

        const rejectedCollectionAmount =
            collections
                .filter(
                    item =>
                        item.status === "Rejected"
                )
                .reduce(
                    (total, item) =>
                        total + Number(
                            item.collectedAmount || 0
                        ),
                    0
                );


        // ==========================================
        // OUTSTANDING
        // ==========================================

        const totalOutstandingAmount =
            collections.reduce(
                (total, item) =>
                    total + Number(
                        item.remainingOutstanding || 0
                    ),
                0
            );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Employee collections fetched successfully",

            employee: employee,

            summary: {

                totalCollectionRecords:
                    totalCollectionRecords,

                totalCollectedAmount:
                    totalCollectedAmount,

                totalOutstandingAmount:
                    totalOutstandingAmount,

                pendingVerificationAmount:
                    pendingVerificationAmount,

                verifiedCollectionAmount:
                    verifiedCollectionAmount,

                rejectedCollectionAmount:
                    rejectedCollectionAmount

            },

            count:
                invoiceDetails.length,

            data:
                invoiceDetails

        });


    } catch (error) {

        console.log(
            "Get Employee Collections Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }
};