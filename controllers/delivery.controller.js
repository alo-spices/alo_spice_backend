const Delivery = require("../models/delivery");
const Order = require("../models/order");
const OrderItem = require("../models/order-items");
const Collection = require("../models/collection");
const Party = require("../models/party");
const BeatPlan = require("../models/beat-plan");
const User = require("../models/user");
const cloudinary = require("../cloudinaryconfig");

const generateDeliveryNumber = async () => {

    const count =
        await Delivery.countDocuments();

    return `DEL-${String(
        count + 1
    ).padStart(5, "0")}`;

};
exports.createDelivery = async (req, res) => {

    try {

        const {
            order,
            party,
            sourceType,
            sourceWarehouse,
            sourceDistributor
        } = req.body;


        // ==========================================
        // REQUIRED FIELDS
        // ==========================================

        if (!order) {

            return res.status(400).json({

                success: false,

                message: "Order is required."

            });

        }


        if (!party) {

            return res.status(400).json({

                success: false,

                message: "Party is required."

            });

        }


        // ==========================================
        // VALIDATE SOURCE TYPE
        // ==========================================

        if (
            ![
                "WAREHOUSE",
                "DISTRIBUTOR"
            ].includes(sourceType)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid source type is required."

            });

        }


        // ==========================================
        // WAREHOUSE SOURCE
        // ==========================================

        if (
            sourceType === "WAREHOUSE" &&
            !sourceWarehouse
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Source warehouse is required."

            });

        }


        // ==========================================
        // DISTRIBUTOR SOURCE
        // ==========================================

        if (
            sourceType === "DISTRIBUTOR" &&
            !sourceDistributor
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Source distributor is required."

            });

        }


        // ==========================================
        // CREATE DELIVERY
        // ==========================================

        const delivery =
            await Delivery.create({

                deliveryNumber:
                    await generateDeliveryNumber(),

                order,

                party,

                sourceType,

                sourceWarehouse:
                    sourceType === "WAREHOUSE"
                        ? sourceWarehouse
                        : null,

                sourceDistributor:
                    sourceType === "DISTRIBUTOR"
                        ? sourceDistributor
                        : null

            });


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(201).json({

            success: true,

            message:
                "Delivery Created Successfully",

            data: delivery

        });

    }
    catch (error) {

        console.log(
            "Create Delivery Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// GET ALL DELIVERIES
// ======================================


exports.getDeliveries = async (req, res) => {

    try {

        // ==========================================
        // BASE FILTER
        // ==========================================

        let filter = {
            isDeleted: false
        };


        // ==========================================
        // DISTRIBUTOR
        // ==========================================

        if (req.user?.role === "Distributor") {

            filter.sourceType = "DISTRIBUTOR";

            filter.sourceDistributor = req.user.id;

        }


        // ==========================================
        // DELIVERY BOY
        // ==========================================

        if (req.user?.role === "DeliveryBoy") {

            filter.deliveryBoy = req.user.id;

        }


        // ==========================================
        // GET DELIVERIES
        // ==========================================

        const deliveries =
            await Delivery.find(filter)

                // ==========================================
                // ORDER + SALESMAN
                // ==========================================

                .populate({
                    path: "order",
                    populate: {
                        path: "employee",
                        select:
                            "firstName lastName fullName employeeCode mobile role assignmentType distributor warehouse"
                    }
                })


                // ==========================================
                // PARTY + AREA + ROUTE
                // ==========================================

                .populate({
                    path: "party",
                    populate: [

                        {
                            path: "area",
                            select:
                                "areaName areaCode city"
                        },

                        {
                            path: "route",
                            select:
                                "routeName routeCode"
                        }

                    ]
                })


                // ==========================================
                // DELIVERY BOY DETAILS
                // ==========================================

                .populate(
                    "deliveryBoy",
                    "firstName lastName fullName employeeCode mobile role distributor warehouse"
                )


                // ==========================================
                // SOURCE WAREHOUSE DETAILS
                // ==========================================

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType managerName mobileNumber email address city state pincode"
                )


                // ==========================================
                // SOURCE DISTRIBUTOR DETAILS
                // ==========================================

                .populate(
                    "sourceDistributor",
                    "firstName lastName fullName employeeCode mobile email role distributorName shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"
                )


                // ==========================================
                // LATEST FIRST
                // ==========================================

                .sort({
                    createdAt: -1
                });


        // ==========================================
        // GET ORDER IDS
        // ==========================================

        const orderIds = deliveries
            .map(delivery => delivery?.order?._id)
            .filter(Boolean);


        // ==========================================
        // GET ORDER ITEMS
        //
        // IMPORTANT:
        // Order does NOT contain items.
        // OrderItem is a separate collection.
        // ==========================================

        let orderItems = [];

        if (orderIds.length > 0) {

            orderItems =
                await OrderItem.find({
                    order: {
                        $in: orderIds
                    }
                })
                    .populate({
                        path: "product",
                        select:
                            "productName productCode"
                    })
                    .lean();

        }


        // ==========================================
        // GROUP ORDER ITEMS BY ORDER ID
        // ==========================================

        const orderItemsMap = {};


        orderItems.forEach(item => {

            const orderId =
                item?.order
                    ? String(item.order)
                    : null;


            if (!orderId) {
                return;
            }


            if (!orderItemsMap[orderId]) {

                orderItemsMap[orderId] = [];

            }


            orderItemsMap[orderId].push(item);

        });


        // ==========================================
        // ATTACH ORDER ITEMS TO EACH DELIVERY
        // ==========================================

        const deliveryData =
            deliveries.map(delivery => {

                const data =
                    delivery.toObject();


                const orderId =
                    delivery?.order?._id
                        ? String(delivery.order._id)
                        : null;


                data.orderItems =
                    orderId
                        ? (
                            orderItemsMap[orderId] || []
                        )
                        : [];


                return data;

            });


        // ==========================================
        // DELIVERY BOY SUMMARY
        // ==========================================

        let summary = null;

        let salesmanWise = [];


        if (req.user?.role === "DeliveryBoy") {


            // ==========================================
            // BASIC SUMMARY
            // ==========================================

            const totalDeliveries =
                deliveryData.length;


            const pendingDeliveries =
                deliveryData.filter(
                    item =>
                        item.deliveryStatus === "Assigned" ||
                        item.deliveryStatus === "Dispatched"
                ).length;


            const deliveredDeliveries =
                deliveryData.filter(
                    item =>
                        item.deliveryStatus === "Delivered"
                ).length;


            const failedDeliveries =
                deliveryData.filter(
                    item =>
                        item.deliveryStatus === "Failed"
                ).length;


            // ==========================================
            // GROUP BY SALESMAN + ROUTE
            // ==========================================

            const grouped = {};


            deliveryData.forEach((delivery) => {


                const salesman =
                    delivery?.order?.employee;


                const route =
                    delivery?.party?.route;


                const area =
                    delivery?.party?.area;


                // ==========================================
                // IDS
                // ==========================================

                const salesmanId =
                    salesman?._id
                        ? String(salesman._id)
                        : "NO_SALESMAN";


                const routeId =
                    route?._id
                        ? String(route._id)
                        : "NO_ROUTE";


                const groupKey =
                    `${salesmanId}_${routeId} `;


                // ==========================================
                // CREATE GROUP
                // ==========================================

                if (!grouped[groupKey]) {

                    grouped[groupKey] = {

                        salesman: salesman
                            ? {

                                _id:
                                    salesman._id,

                                fullName:
                                    salesman.fullName,

                                employeeCode:
                                    salesman.employeeCode,

                                mobile:
                                    salesman.mobile

                            }
                            : null,


                        route: route
                            ? {

                                _id:
                                    route._id,

                                routeName:
                                    route.routeName,

                                routeCode:
                                    route.routeCode

                            }
                            : null,


                        area: area
                            ? {

                                _id:
                                    area._id,

                                areaName:
                                    area.areaName,

                                areaCode:
                                    area.areaCode,

                                city:
                                    area.city

                            }
                            : null,


                        totalDeliveries: 0,

                        pendingDeliveries: 0,

                        deliveredDeliveries: 0,

                        failedDeliveries: 0,

                        deliveries: []

                    };

                }


                // ==========================================
                // TOTAL
                // ==========================================

                grouped[groupKey]
                    .totalDeliveries += 1;


                // ==========================================
                // STATUS COUNTS
                // ==========================================

                if (
                    delivery.deliveryStatus === "Assigned" ||
                    delivery.deliveryStatus === "Dispatched"
                ) {

                    grouped[groupKey]
                        .pendingDeliveries += 1;

                }


                if (
                    delivery.deliveryStatus === "Delivered"
                ) {

                    grouped[groupKey]
                        .deliveredDeliveries += 1;

                }


                if (
                    delivery.deliveryStatus === "Failed"
                ) {

                    grouped[groupKey]
                        .failedDeliveries += 1;

                }


                // ==========================================
                // ADD DELIVERY
                // ==========================================

                grouped[groupKey]
                    .deliveries
                    .push(delivery);

            });


            // ==========================================
            // CONVERT OBJECT TO ARRAY
            // ==========================================

            salesmanWise =
                Object.values(grouped);


            // ==========================================
            // SORT SALESMAN
            // ==========================================

            salesmanWise.sort((a, b) => {

                const salesmanA =
                    a?.salesman?.fullName || "";


                const salesmanB =
                    b?.salesman?.fullName || "";


                return salesmanA.localeCompare(
                    salesmanB
                );

            });


            // ==========================================
            // SUMMARY
            // ==========================================

            summary = {

                totalDeliveries:
                    totalDeliveries,


                totalSalesmen:
                    salesmanWise.length,


                totalRoutes:
                    new Set(

                        salesmanWise

                            .filter(
                                item =>
                                    item.route?._id
                            )

                            .map(
                                item =>
                                    String(
                                        item.route._id
                                    )
                            )

                    ).size,


                pendingDeliveries:
                    pendingDeliveries,


                deliveredDeliveries:
                    deliveredDeliveries,


                failedDeliveries:
                    failedDeliveries

            };

        }


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,


            count:
                deliveryData.length,


            // ==========================================
            // DELIVERY BOY SUMMARY
            // ==========================================

            ...(req.user?.role === "DeliveryBoy"
                ? {

                    summary:
                        summary,

                    salesmanWise:
                        salesmanWise

                }
                : {}),


            // ==========================================
            // DELIVERY DATA
            // ==========================================

            data:
                deliveryData

        });

    }


    catch (error) {

        console.log(
            "Get Deliveries Error:",
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
// GET DELIVERY BY ID
// ======================================
exports.getDeliveryById = async (req, res) => {

    try {

        // ==========================================
        // BASE FILTER
        // ==========================================

        let filter = {
            _id: req.params.id,
            isDeleted: false
        };


        // ==========================================
        // DISTRIBUTOR ACCESS
        // ==========================================

        /*
         * Distributor vere Distributor delivery ni
         * access cheyyakudadhu.
         */

        if (req.user?.role === "Distributor") {

            filter.sourceType = "DISTRIBUTOR";

            filter.sourceDistributor =
                req.user._id || req.user.id;

        }


        // ==========================================
        // GET DELIVERY
        // ==========================================

        const delivery =
            await Delivery.findOne(filter)

                // ==========================================
                // ORDER DETAILS
                // ==========================================

                .populate({
                    path: "order",
                    populate: {
                        path: "employee",
                        select:
                            "firstName lastName fullName employeeCode mobile role assignmentType distributor warehouse"
                    }
                })

                // ==========================================
                // PARTY DETAILS
                // ==========================================

                .populate({
                    path: "party",
                    populate: [
                        {
                            path: "area",
                            select: "areaName areaCode city"
                        },
                        {
                            path: "route",
                            select: "routeName routeCode"
                        }
                    ]
                })

                // ==========================================
                // DELIVERY BOY DETAILS
                // ==========================================

                .populate(
                    "deliveryBoy",
                    "firstName lastName fullName employeeCode mobile role distributor warehouse"
                )

                // ==========================================
                // SOURCE WAREHOUSE DETAILS
                // ==========================================

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType managerName mobileNumber email address city state pincode"
                )

                // ==========================================
                // SOURCE DISTRIBUTOR DETAILS
                // ==========================================

                .populate(
                    "sourceDistributor",
                    "firstName lastName fullName employeeCode mobile email role distributorName shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"
                )

                .lean();


        // ==========================================
        // DELIVERY NOT FOUND
        // ==========================================

        if (!delivery) {

            return res.status(404).json({
                success: false,
                message: "Delivery Not Found"
            });

        }


        // ==========================================
        // GET ORDER ITEMS
        // ==========================================

        let orderItems = [];

        if (delivery.order?._id) {

            orderItems = await OrderItem.find({
                order: delivery.order._id
            })
                .populate({
                    path: "product",
                    select: "productName productCode"
                })
                .lean();

        }


        // ==========================================
        // ATTACH ORDER ITEMS
        // ==========================================

        delivery.orderItems = orderItems;


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            data: delivery

        });

    } catch (error) {

        console.log(
            "Get Delivery By ID Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// UPDATE DELIVERY
// ======================================
exports.updateDelivery = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            order,
            party,
            sourceType,
            sourceWarehouse,
            sourceDistributor,
            deliveryBoy,
            remarks
        } = req.body;


        // ==========================================
        // FIND DELIVERY
        // ==========================================

        const delivery =
            await Delivery.findOne({
                _id: id,
                isDeleted: false
            });


        if (!delivery) {

            return res.status(404).json({
                success: false,
                message: "Delivery Not Found"
            });

        }


        // ==========================================
        // DISTRIBUTOR ACCESS VALIDATION
        // ==========================================

        /*
         * Distributor only tana point nunchi
         * vellina delivery ni update cheyyagaladu.
         */

        if (req.user?.role === "Distributor") {

            if (
                delivery.sourceType !== "DISTRIBUTOR" ||
                String(delivery.sourceDistributor) !==
                String(req.user._id)
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to update this delivery."
                });

            }

        }


        // ==========================================
        // VALIDATE SOURCE TYPE
        // ==========================================

        if (
            sourceType !== undefined &&
            ![
                "WAREHOUSE",
                "DISTRIBUTOR"
            ].includes(sourceType)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid delivery source type."
            });

        }


        // ==========================================
        // FINAL SOURCE VALUES
        // ==========================================

        const finalSourceType =
            sourceType !== undefined
                ? sourceType
                : delivery.sourceType;

        const finalWarehouse =
            sourceWarehouse !== undefined
                ? sourceWarehouse
                : delivery.sourceWarehouse;

        const finalDistributor =
            sourceDistributor !== undefined
                ? sourceDistributor
                : delivery.sourceDistributor;


        // ==========================================
        // DISTRIBUTOR SOURCE SECURITY
        // ==========================================

        if (req.user?.role === "Distributor") {

            /*
             * Distributor source ni change cheyyakudadhu.
             * Same logged-in distributor undali.
             */

            if (
                finalSourceType !== "DISTRIBUTOR" ||
                String(finalDistributor) !==
                String(req.user._id)
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Distributor can update only his own deliveries."
                });

            }

        }


        // ==========================================
        // WAREHOUSE SOURCE VALIDATION
        // ==========================================

        if (
            finalSourceType === "WAREHOUSE" &&
            !finalWarehouse
        ) {

            return res.status(400).json({
                success: false,
                message: "Source warehouse is required."
            });

        }


        // ==========================================
        // DISTRIBUTOR SOURCE VALIDATION
        // ==========================================

        if (
            finalSourceType === "DISTRIBUTOR" &&
            !finalDistributor
        ) {

            return res.status(400).json({
                success: false,
                message: "Source distributor is required."
            });

        }


        // ==========================================
        // UPDATE BASIC DETAILS
        // ==========================================

        if (order !== undefined) {

            delivery.order = order;

        }


        if (party !== undefined) {

            delivery.party = party;

        }


        if (deliveryBoy !== undefined) {

            delivery.deliveryBoy = deliveryBoy;

        }


        if (remarks !== undefined) {

            delivery.remarks = remarks;

        }


        // ==========================================
        // UPDATE SOURCE
        // ==========================================

        delivery.sourceType = finalSourceType;


        if (finalSourceType === "WAREHOUSE") {

            delivery.sourceWarehouse = finalWarehouse;

            delivery.sourceDistributor = null;

        }


        if (finalSourceType === "DISTRIBUTOR") {

            delivery.sourceDistributor = finalDistributor;

            delivery.sourceWarehouse = null;

        }


        // ==========================================
        // SAVE
        // ==========================================

        await delivery.save();


        // ==========================================
        // GET UPDATED DELIVERY
        // ==========================================

        const updatedDelivery =
            await Delivery.findById(delivery._id)

                .populate("order")

                .populate("party")

                .populate(
                    "deliveryBoy",
                    "firstName lastName fullName employeeCode mobile role distributor warehouse"
                )

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType managerName mobileNumber email address city state pincode"
                )

                .populate(
                    "sourceDistributor",
                    "firstName lastName fullName employeeCode mobile email role distributorName shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"
                );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message: "Delivery Updated Successfully",

            data: updatedDelivery

        });

    } catch (error) {

        console.log(
            "Update Delivery Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.assignDeliveryBoy = async (req, res) => {

    try {

        const { deliveryBoy } = req.body;


        // ==========================================
        // FIND DELIVERY
        // ==========================================

        const delivery =
            await Delivery.findOne({

                _id: req.params.id,

                isDeleted: false

            });


        if (!delivery) {

            return res.status(404).json({

                success: false,

                message: "Delivery Not Found"

            });

        }


        // ==========================================
        // VALIDATE DELIVERY BOY
        // ==========================================

        const employee =
            await User.findOne({

                _id: deliveryBoy,

                role: "DeliveryBoy",

                status: "Active",

                isDeleted: false

            });


        if (!employee) {

            return res.status(404).json({

                success: false,

                message:
                    "Active Delivery Boy Not Found."

            });

        }


        // ==========================================
        // SOURCE VALIDATION
        // ==========================================

        if (
            delivery.sourceType === "WAREHOUSE"
        ) {

            if (
                !employee.warehouse ||
                String(employee.warehouse) !==
                String(delivery.sourceWarehouse)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery Boy is not assigned to the selected warehouse."

                });

            }

        }


        if (
            delivery.sourceType === "DISTRIBUTOR"
        ) {

            if (
                !employee.distributor ||
                String(employee.distributor) !==
                String(delivery.sourceDistributor)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery Boy is not assigned to the selected distributor."

                });

            }

        }


        // ==========================================
        // ASSIGN
        // ==========================================

        delivery.deliveryBoy =
            deliveryBoy;

        delivery.deliveryStatus =
            "Assigned";


        await delivery.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        const updatedDelivery =
            await Delivery.findById(
                delivery._id
            )
                .populate("order")
                .populate("party")
                .populate(
                    "deliveryBoy",
                    "firstName lastName fullName employeeCode mobile role warehouse distributor"
                )
                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName"
                )
                .populate(
                    "sourceDistributor",
                    "firstName lastName fullName mobile distributorName"
                );


        return res.status(200).json({

            success: true,

            message:
                "Delivery Boy Assigned Successfully",

            data:
                updatedDelivery

        });

    }
    catch (error) {

        console.log(
            "Assign Delivery Boy Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.dispatchDelivery = async (req, res) => {

    try {

        // ==========================================
        // GET DELIVERY
        // ==========================================

        const delivery =
            await Delivery.findOne({

                _id: req.params.id,

                isDeleted: false

            });

        if (!delivery) {

            return res.status(404).json({

                success: false,

                message:
                    "Delivery Not Found"

            });

        }


        // ==========================================
        // GET LOGGED-IN USER ID
        // Supports both _id and id
        // ==========================================

        const userId =
            req.user?._id ||
            req.user?.id;


        // ==========================================
        // CHECK LOGIN
        // ==========================================

        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized. Please login again."

            });

        }


        // ==========================================
        // ONLY ASSIGNED DELIVERY BOY
        // ==========================================

        if (
            !delivery.deliveryBoy ||
            String(delivery.deliveryBoy) !==
            String(userId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not assigned to this delivery."

            });

        }


        // ==========================================
        // CHECK USER ROLE
        // ==========================================

        if (
            req.user.role !==
            "DeliveryBoy"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Only Delivery Boy can dispatch this delivery."

            });

        }


        // ==========================================
        // STATUS VALIDATION
        // ==========================================

        if (
            delivery.deliveryStatus !==
            "Assigned"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Only assigned deliveries can be dispatched. Current status: ${delivery.deliveryStatus}`

            });

        }


        // ==========================================
        // DISPATCH DELIVERY
        // ==========================================

        delivery.dispatchedAt =
            new Date();

        delivery.dispatchedBy =
            userId;

        delivery.deliveryStatus =
            "Dispatched";


        await delivery.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Delivery Dispatched Successfully",

            data:
                delivery

        });

    }

    catch (error) {

        console.log(
            "Dispatch Delivery Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.markDelivereds = async (req, res) => {
    try {
        const {
            receiverName,
            receiverMobile,
            latitude,
            longitude,
            deliveryAddress,
            deliveryPhoto,
            deliverySignature
        } = req.body;

        const delivery = await Delivery.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery Not Found"
            });
        }

        // ==========================================
        // GET LOGGED-IN USER ID
        // JWT uses `id`, not `_id`
        // ==========================================
        const userId =
            req.user?._id ||
            req.user?.id;

        console.log("=================================");
        console.log("MARK DELIVERY COMPLETED");
        console.log("REQ USER:", req.user);
        console.log("USER ID:", userId);
        console.log("DELIVERY BOY:", delivery.deliveryBoy);
        console.log("DELIVERY STATUS:", delivery.deliveryStatus);
        console.log("=================================");

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. User ID not found."
            });
        }

        // ==========================================
        // ONLY ASSIGNED DELIVERY BOY
        // ==========================================
        if (
            !delivery.deliveryBoy ||
            String(delivery.deliveryBoy) !== String(userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this delivery."
            });
        }

        // ==========================================
        // ONLY DELIVERY BOY
        // ==========================================
        if (req.user?.role !== "DeliveryBoy") {
            return res.status(403).json({
                success: false,
                message: "Only Delivery Boy can complete this delivery."
            });
        }

        // ==========================================
        // ONLY DISPATCHED DELIVERY CAN BE COMPLETED
        // ==========================================
        if (delivery.deliveryStatus !== "Dispatched") {
            return res.status(400).json({
                success: false,
                message:
                    `Only dispatched deliveries can be completed. Current status: ${delivery.deliveryStatus}`
            });
        }

        // ==========================================
        // COMPLETE DELIVERY
        // ==========================================
        delivery.deliveredAt = new Date();

        delivery.receiverName =
            receiverName || "";

        delivery.receiverMobile =
            receiverMobile || "";

        delivery.latitude =
            latitude ?? null;

        delivery.longitude =
            longitude ?? null;

        delivery.deliveryAddress =
            deliveryAddress || "";

        delivery.deliveryPhoto =
            deliveryPhoto || "";

        delivery.deliverySignature =
            deliverySignature || "";

        delivery.deliveryStatus = "Delivered";

        await delivery.save();

        console.log(
            "DELIVERY COMPLETED SUCCESSFULLY:",
            delivery._id
        );

        return res.status(200).json({
            success: true,
            message: "Delivery Completed Successfully",
            data: delivery
        });

    } catch (error) {

        console.log(
            "Mark Delivery Completed Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.markFailed = async (req, res) => {

    try {

        const { remarks } =
            req.body;


        const delivery =
            await Delivery.findOne({

                _id: req.params.id,

                isDeleted: false

            });


        if (!delivery) {

            return res.status(404).json({

                success: false,

                message:
                    "Delivery Not Found"

            });

        }


        // ==========================================
        // ONLY ASSIGNED DELIVERY BOY
        // ==========================================

        if (
            !req.user?._id ||
            String(delivery.deliveryBoy) !==
            String(req.user._id)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not assigned to this delivery."

            });

        }


        // ==========================================
        // STATUS VALIDATION
        // ==========================================

        if (
            delivery.deliveryStatus !==
            "Assigned" &&
            delivery.deliveryStatus !==
            "Dispatched"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This delivery cannot be marked as failed."

            });

        }


        delivery.deliveryStatus =
            "Failed";

        delivery.remarks =
            remarks || "";


        await delivery.save();


        return res.status(200).json({

            success: true,

            message:
                "Delivery Marked Failed",

            data:
                delivery

        });

    }
    catch (error) {

        console.log(
            "Mark Delivery Failed Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getDeliveryBoyCompletedDeliveries = async (req, res) => {

    try {

        // ==========================================
        // AUTH USER
        // ==========================================

        const deliveryBoyId = req.user?.id || req.user?._id;

        if (!deliveryBoyId) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        // ==========================================
        // VALIDATE DELIVERY BOY
        // ==========================================

        const deliveryBoy = await User.findById(deliveryBoyId)
            .select("firstName lastName fullName employeeCode mobile role");

        if (!deliveryBoy) {

            return res.status(404).json({
                success: false,
                message: "Delivery Boy Not Found"
            });

        }

        if (deliveryBoy.role !== "DeliveryBoy") {

            return res.status(403).json({
                success: false,
                message: "Only Delivery Boy can access this API"
            });

        }


        // ==========================================
        // GET COMPLETED DELIVERIES
        // ==========================================

        const deliveries = await Delivery.find({
            deliveryBoy: deliveryBoyId,
            deliveryStatus: "Delivered",
            isDeleted: false
        })

            // ==========================================
            // ORDER + SALESMAN
            // ==========================================

            .populate({
                path: "order",
                populate: {
                    path: "employee",
                    select:
                        "firstName lastName fullName employeeCode mobile role assignmentType distributor warehouse"
                }
            })

            // ==========================================
            // PARTY + AREA + ROUTE
            // ==========================================

            .populate({
                path: "party",
                populate: [
                    {
                        path: "area",
                        select: "areaName areaCode city"
                    },
                    {
                        path: "route",
                        select: "routeName routeCode"
                    }
                ]
            })

            // ==========================================
            // DELIVERY BOY
            // ==========================================

            .populate(
                "deliveryBoy",
                "firstName lastName fullName employeeCode mobile role"
            )

            // ==========================================
            // SOURCE WAREHOUSE
            // ==========================================

            .populate(
                "sourceWarehouse",
                "warehouseCode warehouseName warehouseType managerName mobileNumber email address city state pincode"
            )

            // ==========================================
            // SOURCE DISTRIBUTOR
            // ==========================================

            .populate(
                "sourceDistributor",
                "firstName lastName fullName employeeCode mobile email role distributorName shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"
            )

            .sort({
                deliveredAt: -1,
                createdAt: -1
            })
            .lean();


        // ==========================================
        // GET ORDER ITEMS
        // ==========================================

        const orderIds = deliveries
            .map(item => item?.order?._id)
            .filter(Boolean);


        let orderItems = [];

        if (orderIds.length > 0) {

            orderItems = await OrderItem.find({
                order: { $in: orderIds }
            })

                .populate({
                    path: "product",
                    select: "productName productCode"
                })

                .lean();

        }


        // ==========================================
        // GROUP ORDER ITEMS
        // ==========================================

        const orderItemsMap = {};

        orderItems.forEach(item => {

            const orderId = String(item.order);

            if (!orderItemsMap[orderId]) {
                orderItemsMap[orderId] = [];
            }

            orderItemsMap[orderId].push(item);

        });


        // ==========================================
        // ATTACH ORDER ITEMS
        // ==========================================

        const deliveryData = deliveries.map(delivery => {

            const data = {
                ...delivery
            };

            const orderId = delivery?.order?._id
                ? String(delivery.order._id)
                : null;

            data.orderItems =
                orderId
                    ? orderItemsMap[orderId] || []
                    : [];

            return data;

        });


        // ==========================================
        // SUMMARY
        // ==========================================

        const totalDeliveries = deliveryData.length;

        const totalAmount = deliveryData.reduce(
            (total, delivery) =>
                total +
                Number(delivery?.order?.grandTotal || 0),
            0
        );

        const totalCollected = deliveryData.reduce(
            (total, delivery) =>
                total +
                Number(delivery?.order?.paidAmount || 0),
            0
        );

        const totalOutstanding = deliveryData.reduce(
            (total, delivery) =>
                total +
                Number(delivery?.order?.balanceAmount || 0),
            0
        );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message: "Completed Deliveries Fetched Successfully",

            summary: {
                totalDeliveries,
                totalAmount,
                totalCollected,
                totalOutstanding
            },

            count: deliveryData.length,

            data: deliveryData

        });

    } catch (error) {

        console.log(
            "Get Delivery Boy Completed Deliveries Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getDeliveryBoyPendingDeliveries = async (req, res) => {

    try {

        // ==========================================
        // AUTH USER
        // ==========================================

        const deliveryBoyId = req.user?.id || req.user?._id;

        if (!deliveryBoyId) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        // ==========================================
        // VALIDATE DELIVERY BOY
        // ==========================================

        const deliveryBoy = await User.findById(deliveryBoyId)
            .select("firstName lastName fullName employeeCode mobile role");

        if (!deliveryBoy) {

            return res.status(404).json({
                success: false,
                message: "Delivery Boy Not Found"
            });

        }

        if (deliveryBoy.role !== "DeliveryBoy") {

            return res.status(403).json({
                success: false,
                message: "Only Delivery Boy can access this API"
            });

        }


        // ==========================================
        // GET PENDING DELIVERIES
        // ==========================================

        const deliveries = await Delivery.find({

            deliveryBoy: deliveryBoyId,

            deliveryStatus: {
                $in: [
                    "Assigned",
                    "Dispatched"
                ]
            },

            isDeleted: false

        })

            // ==========================================
            // ORDER + SALESMAN
            // ==========================================

            .populate({
                path: "order",
                populate: {
                    path: "employee",
                    select:
                        "firstName lastName fullName employeeCode mobile role assignmentType distributor warehouse"
                }
            })

            // ==========================================
            // PARTY + AREA + ROUTE
            // ==========================================

            .populate({
                path: "party",
                populate: [
                    {
                        path: "area",
                        select: "areaName areaCode city"
                    },
                    {
                        path: "route",
                        select: "routeName routeCode"
                    }
                ]
            })

            // ==========================================
            // DELIVERY BOY
            // ==========================================

            .populate(
                "deliveryBoy",
                "firstName lastName fullName employeeCode mobile role"
            )

            // ==========================================
            // SOURCE WAREHOUSE
            // ==========================================

            .populate(
                "sourceWarehouse",
                "warehouseCode warehouseName warehouseType managerName mobileNumber email address city state pincode"
            )

            // ==========================================
            // SOURCE DISTRIBUTOR
            // ==========================================

            .populate(
                "sourceDistributor",
                "firstName lastName fullName employeeCode mobile email role distributorName shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"
            )

            .sort({
                deliveryStatus: 1,
                createdAt: 1
            })

            .lean();


        // ==========================================
        // GET ORDER IDS
        // ==========================================

        const orderIds = deliveries
            .map(item => item?.order?._id)
            .filter(Boolean);


        // ==========================================
        // GET ORDER ITEMS
        // ==========================================

        let orderItems = [];

        if (orderIds.length > 0) {

            orderItems = await OrderItem.find({
                order: {
                    $in: orderIds
                }
            })

                .populate({
                    path: "product",
                    select: "productName productCode"
                })

                .lean();

        }


        // ==========================================
        // GROUP ORDER ITEMS
        // ==========================================

        const orderItemsMap = {};

        orderItems.forEach(item => {

            const orderId = String(item.order);

            if (!orderItemsMap[orderId]) {
                orderItemsMap[orderId] = [];
            }

            orderItemsMap[orderId].push(item);

        });


        // ==========================================
        // ATTACH ORDER ITEMS
        // ==========================================

        const deliveryData = deliveries.map(delivery => {

            const data = {
                ...delivery
            };

            const orderId = delivery?.order?._id
                ? String(delivery.order._id)
                : null;

            data.orderItems =
                orderId
                    ? orderItemsMap[orderId] || []
                    : [];

            return data;

        });


        // ==========================================
        // SUMMARY
        // ==========================================

        const totalDeliveries = deliveryData.length;

        const assigned = deliveryData.filter(
            item => item.deliveryStatus === "Assigned"
        ).length;

        const dispatched = deliveryData.filter(
            item => item.deliveryStatus === "Dispatched"
        ).length;

        const totalAmount = deliveryData.reduce(
            (total, delivery) =>
                total +
                Number(delivery?.order?.grandTotal || 0),
            0
        );

        const totalOutstanding = deliveryData.reduce(
            (total, delivery) =>
                total +
                Number(delivery?.order?.balanceAmount || 0),
            0
        );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message: "Pending Deliveries Fetched Successfully",

            summary: {
                totalDeliveries,
                assigned,
                dispatched,
                totalAmount,
                totalOutstanding
            },

            count: deliveryData.length,

            data: deliveryData

        });

    } catch (error) {

        console.log(
            "Get Delivery Boy Pending Deliveries Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getDeliveryBoyCollections = async (req, res) => {

    try {

        // ==========================================
        // AUTH USER
        // ==========================================

        const deliveryBoyId = req.user?.id || req.user?._id;

        if (!deliveryBoyId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        // ==========================================
        // VALIDATE DELIVERY BOY
        // ==========================================

        const deliveryBoy = await User.findById(deliveryBoyId)
            .select(
                "firstName lastName fullName employeeCode mobile role"
            );

        if (!deliveryBoy) {
            return res.status(404).json({
                success: false,
                message: "Delivery Boy Not Found"
            });
        }

        if (deliveryBoy.role !== "DeliveryBoy") {
            return res.status(403).json({
                success: false,
                message: "Only Delivery Boy can access this API"
            });
        }


        // ==========================================
        // GET COLLECTIONS
        // ==========================================

        const collections = await Collection.find({
            employee: deliveryBoyId,
            isDeleted: false
        })

            // ==========================================
            // PARTY
            // ==========================================

            .populate({
                path: "party",
                populate: [
                    {
                        path: "area",
                        select: "areaName areaCode city"
                    },
                    {
                        path: "route",
                        select: "routeName routeCode"
                    }
                ]
            })

            // ==========================================
            // ORDER
            // ==========================================

            .populate({
                path: "order",
                select:
                    "orderNumber orderDate party partyType employee subTotal discountAmount taxableAmount gstAmount grandTotal orderStatus paymentStatus paidAmount balanceAmount remarks"
            })

            // ==========================================
            // EMPLOYEE
            // ==========================================

            .populate(
                "employee",
                "firstName lastName fullName employeeCode mobile role"
            )

            // ==========================================
            // VISIT
            // ==========================================

            .populate(
                "visit",
                "visitDate visitStatus visitOutcome collectionDone collectionAmount"
            )

            // ==========================================
            // VERIFIED BY
            // ==========================================

            .populate(
                "verifiedBy",
                "firstName lastName fullName employeeCode"
            )

            .sort({
                collectionDate: -1,
                createdAt: -1
            })

            .lean();


        // ==========================================
        // SUMMARY
        // ==========================================

        const totalCollections = collections.length;

        const totalCollectedAmount = collections.reduce(
            (total, item) =>
                total + Number(item.collectedAmount || 0),
            0
        );

        const pendingVerification = collections.filter(
            item => item.status === "Pending"
        ).length;

        const verifiedCollections = collections.filter(
            item => item.status === "Verified"
        ).length;

        const rejectedCollections = collections.filter(
            item => item.status === "Rejected"
        ).length;


        // ==========================================
        // PAYMENT MODE SUMMARY
        // ==========================================

        const paymentModeSummary = {
            Cash: 0,
            UPI: 0,
            "Bank Transfer": 0,
            Cheque: 0
        };

        collections.forEach(item => {

            const mode = item.paymentMode;

            if (paymentModeSummary[mode] !== undefined) {

                paymentModeSummary[mode] +=
                    Number(item.collectedAmount || 0);

            }

        });


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Delivery Boy Collections Fetched Successfully",

            summary: {
                totalCollections,
                totalCollectedAmount,
                pendingVerification,
                verifiedCollections,
                rejectedCollections,
                paymentModeSummary
            },

            count: collections.length,

            data: collections

        });

    } catch (error) {

        console.log(
            "Get Delivery Boy Collections Error:",
            error
        );

        return res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


exports.getDeliveryBoyPendingCollections = async (req, res) => {

    try {

        // ==========================================
        // AUTH USER
        // ==========================================

        const deliveryBoyId = req.user?.id || req.user?._id;

        if (!deliveryBoyId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        // ==========================================
        // VALIDATE DELIVERY BOY
        // ==========================================

        const deliveryBoy = await User.findById(deliveryBoyId)
            .select(
                "firstName lastName fullName employeeCode mobile role"
            );

        if (!deliveryBoy) {
            return res.status(404).json({
                success: false,
                message: "Delivery Boy Not Found"
            });
        }

        if (deliveryBoy.role !== "DeliveryBoy") {
            return res.status(403).json({
                success: false,
                message: "Only Delivery Boy can access this API"
            });
        }


        // ==========================================
        // GET COMPLETED DELIVERIES
        // ==========================================

        const deliveries = await Delivery.find({

            deliveryBoy: deliveryBoyId,

            deliveryStatus: "Delivered",

            isDeleted: false

        })

            // ==========================================
            // ORDER
            // ==========================================

            .populate({
                path: "order",
                populate: {
                    path: "employee",
                    select:
                        "firstName lastName fullName employeeCode mobile role"
                }
            })

            // ==========================================
            // PARTY
            // ==========================================

            .populate({
                path: "party",
                populate: [
                    {
                        path: "area",
                        select: "areaName areaCode city"
                    },
                    {
                        path: "route",
                        select: "routeName routeCode"
                    }
                ]
            })

            // ==========================================
            // DELIVERY BOY
            // ==========================================

            .populate(
                "deliveryBoy",
                "firstName lastName fullName employeeCode mobile role"
            )

            .sort({
                deliveredAt: -1,
                createdAt: -1
            })

            .lean();


        // ==========================================
        // ONLY OUTSTANDING ORDERS
        // ==========================================

        const pendingCollections = deliveries.filter(delivery => {

            const balanceAmount =
                Number(delivery?.order?.balanceAmount || 0);

            return balanceAmount > 0;

        });


        // ==========================================
        // SUMMARY
        // ==========================================

        const totalPendingCollections =
            pendingCollections.length;

        const totalPendingAmount =
            pendingCollections.reduce(
                (total, delivery) =>
                    total +
                    Number(
                        delivery?.order?.balanceAmount || 0
                    ),
                0
            );


        const totalOrderValue =
            pendingCollections.reduce(
                (total, delivery) =>
                    total +
                    Number(
                        delivery?.order?.grandTotal || 0
                    ),
                0
            );


        const totalPaidAmount =
            pendingCollections.reduce(
                (total, delivery) =>
                    total +
                    Number(
                        delivery?.order?.paidAmount || 0
                    ),
                0
            );


        // ==========================================
        // FORMAT RESPONSE
        // ==========================================

        const data = pendingCollections.map(delivery => {

            return {

                deliveryId: delivery._id,

                deliveryNumber:
                    delivery.deliveryNumber,

                deliveredAt:
                    delivery.deliveredAt,

                deliveryStatus:
                    delivery.deliveryStatus,

                receiverName:
                    delivery.receiverName,

                receiverMobile:
                    delivery.receiverMobile,

                deliveryAddress:
                    delivery.deliveryAddress,

                latitude:
                    delivery.latitude,

                longitude:
                    delivery.longitude,

                // ======================================
                // PARTY
                // ======================================

                party: delivery.party,

                // ======================================
                // ORDER
                // ======================================

                order: delivery.order,

                // ======================================
                // PAYMENT
                // ======================================

                paymentSummary: {

                    grandTotal:
                        Number(
                            delivery?.order?.grandTotal || 0
                        ),

                    paidAmount:
                        Number(
                            delivery?.order?.paidAmount || 0
                        ),

                    balanceAmount:
                        Number(
                            delivery?.order?.balanceAmount || 0
                        ),

                    paymentStatus:
                        delivery?.order?.paymentStatus || "Pending"

                }

            };

        });


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Delivery Boy Pending Collections Fetched Successfully",

            summary: {

                totalPendingCollections,

                totalOrderValue,

                totalPaidAmount,

                totalPendingAmount

            },

            count: data.length,

            data

        });

    } catch (error) {

        console.log(
            "Get Delivery Boy Pending Collections Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};