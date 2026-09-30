
const Order = require("../models/order");
const Attendance = require("../models/attendence");
const Party = require("../models/party");
const BeatPlan = require("../models/beat-plan");
const User = require("../models/user");
const Delivery = require("../models/delivery");
const Visit = require("../models/visit");


// =====================================
// GENERATE ORDER NUMBER
// =====================================

const generateOrderNumber = () => {

    const random =
        Math.floor(
            1000 + Math.random() * 9000
        );

    return `ORD${Date.now()}${random}`;

};

// =====================================
// CREATE ORDER
// =====================================

exports.createOrder = async (req, res) => {

    try {

        const {

            party,
            partyType,
            employee,
            visit,

            subTotal,
            discountAmount,
            taxableAmount,
            gstAmount,
            grandTotal,

            remarks

        } = req.body;


        // ==========================
        // GET SALESMAN
        // ==========================

        const salesman =
            await User.findById(employee);

        if (!salesman) {

            throw new Error(
                "Salesman not found."
            );

        }


        // ==========================
        // CHECK SALESMAN ASSIGNMENT
        // ==========================

        if (
            ![
                "WAREHOUSE",
                "DISTRIBUTOR"
            ].includes(salesman.assignmentType)
        ) {

            throw new Error(
                "Salesman is not assigned to Warehouse or Distributor."
            );

        }


        // ==========================
        // CREATE ORDER
        // ==========================

        const order = await Order.create({

            orderNumber:
                generateOrderNumber(),

            party,
            partyType,
            employee,
            visit,

            subTotal,
            discountAmount,
            taxableAmount,
            gstAmount,
            grandTotal,

            paidAmount: 0,

            balanceAmount:
                grandTotal,

            remarks

        });


        // ==========================
        // GET PARTY
        // ==========================

        const partyData =
            await Party.findById(party);

        if (!partyData) {

            throw new Error(
                "Party not found."
            );

        }


        // ==========================
        // GET ORDER DAY
        // ==========================

        const orderDay =
            new Date(
                order.orderDate
            ).toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );


        // ==========================
        // FIND BEAT PLAN
        // ==========================

        const beatPlan =
            await BeatPlan.findOne({

                area: partyData.area,

                route: partyData.route,

                salesman: employee,

                day: orderDay,

                status: "Active",

                isDeleted: false

            });


        if (!beatPlan) {

            throw new Error(
                "Beat Plan not found for this order."
            );

        }


        // ==========================
        // CHECK DELIVERY BOY
        // ==========================

        if (!beatPlan.deliveryBoy) {

            throw new Error(
                "Delivery Boy is not assigned to this Beat Plan."
            );

        }


        // ==========================
        // GET DELIVERY BOY
        // ==========================

        const deliveryBoy =
            await User.findById(
                beatPlan.deliveryBoy
            );

        if (!deliveryBoy) {

            throw new Error(
                "Delivery Boy not found."
            );

        }


        // ==========================
        // CHECK DELIVERY BOY ROLE
        // ==========================

        if (
            deliveryBoy.role !== "DeliveryBoy"
        ) {

            throw new Error(
                "Assigned user is not a Delivery Boy."
            );

        }


        // ==========================
        // VALIDATE SAME SOURCE
        // ==========================

        if (
            deliveryBoy.assignmentType !==
            salesman.assignmentType
        ) {

            throw new Error(
                "Salesman and Delivery Boy are assigned to different source types."
            );

        }


        // ==========================
        // WAREHOUSE SOURCE
        // ==========================

        let sourceType = null;

        let sourceWarehouse = null;

        let sourceDistributor = null;


        if (
            salesman.assignmentType ===
            "WAREHOUSE"
        ) {

            if (!salesman.warehouse) {

                throw new Error(
                    "Salesman is not assigned to a Warehouse."
                );

            }


            if (!deliveryBoy.warehouse) {

                throw new Error(
                    "Delivery Boy is not assigned to a Warehouse."
                );

            }


            if (
                String(salesman.warehouse) !==
                String(deliveryBoy.warehouse)
            ) {

                throw new Error(
                    "Salesman and Delivery Boy are assigned to different Warehouses."
                );

            }


            sourceType =
                "WAREHOUSE";

            sourceWarehouse =
                salesman.warehouse;

        }


        // ==========================
        // DISTRIBUTOR SOURCE
        // ==========================

        if (
            salesman.assignmentType ===
            "DISTRIBUTOR"
        ) {

            if (!salesman.distributor) {

                throw new Error(
                    "Salesman is not assigned to a Distributor."
                );

            }


            if (!deliveryBoy.distributor) {

                throw new Error(
                    "Delivery Boy is not assigned to a Distributor."
                );

            }


            if (
                String(salesman.distributor) !==
                String(deliveryBoy.distributor)
            ) {

                throw new Error(
                    "Salesman and Delivery Boy are assigned to different Distributors."
                );

            }


            sourceType =
                "DISTRIBUTOR";

            sourceDistributor =
                salesman.distributor;

        }


        // ==========================
        // CHECK DUPLICATE DELIVERY
        // ==========================

        const existingDelivery =
            await Delivery.findOne({

                order: order._id,

                isDeleted: false

            });


        // ==========================
        // CREATE DELIVERY
        // ==========================

        if (!existingDelivery) {

            await Delivery.create({

                deliveryNumber:
                    `DEL-${String(
                        await Delivery.countDocuments() + 1
                    ).padStart(5, "0")}`,

                order:
                    order._id,

                party:
                    party,

                deliveryBoy:
                    beatPlan.deliveryBoy,

                sourceType:
                    sourceType,

                sourceWarehouse:
                    sourceWarehouse,

                sourceDistributor:
                    sourceDistributor,

                deliveryStatus:
                    "Assigned"

            });

        }


        // ==========================
        // UPDATE VISIT
        // ==========================

        const visitData =
            await Visit.findById(visit);


        if (visitData) {

            visitData.orderCreated =
                true;

            visitData.orderCount +=
                1;

            visitData.orderAmount +=
                grandTotal;

            visitData.visitOutcome =
                "Order Taken";

            visitData.visitStatus =
                "Completed";

            visitData.visitEndTime =
                new Date();

            await visitData.save();

        }


        // ==========================
        // UPDATE TODAY ATTENDANCE
        // ==========================

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        const tomorrow =
            new Date(today);

        tomorrow.setDate(
            today.getDate() + 1
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

                    totalOrders: 1

                }

            }

        );


        // ==========================
        // RESPONSE
        // ==========================

        return res.status(201).json({

            success: true,

            message:
                "Order Created Successfully",

            data: order

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
exports.approveOrder = async (req, res) => {

    try {

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    orderStatus:
                        "Approved"
                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Order Approved Successfully",

            data:
                order

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
exports.rejectOrder = async (req, res) => {

    try {

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    orderStatus:
                        "Cancelled",

                    remarks:
                        req.body.remarks
                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Order Rejected Successfully",

            data:
                order

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
exports.processOrder = async (req, res) => {

    try {

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    orderStatus:
                        "Processing"
                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Order Processing Started",

            data:
                order

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
exports.markDelivered = async (req, res) => {

    try {

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    orderStatus:
                        "Delivered"
                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Order Delivered Successfully",

            data:
                order

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
exports.getPartyOrders = async (req, res) => {

    const orders =
        await Order.find({

            party:
                req.params.partyId,

            isDeleted: false

        });

    res.status(200).json({

        success: true,

        count:
            orders.length,

        data:
            orders

    });

};
exports.getEmployeeOrders = async (req, res) => {

    const orders =
        await Order.find({

            employee:
                req.params.employeeId,

            isDeleted: false

        });

    res.status(200).json({

        success: true,

        count:
            orders.length,

        data:
            orders

    });

};
exports.getOrders = async (req, res) => {

    try {

        // ==========================================
        // EMPLOYEE POPULATE
        // ==========================================

        const employeePopulate = {

            path: "employee",

            select:
                "_id firstName lastName fullName employeeCode profileImage mobile role assignmentType warehouse distributor area route",

            populate: [

                // ==========================================
                // DISTRIBUTOR DETAILS
                // ==========================================

                {
                    path: "distributor",

                    select:
                        "_id firstName lastName fullName mobile email profileImage role distributorName shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"
                },

                // ==========================================
                // WAREHOUSE DETAILS
                // ==========================================

                {
                    path: "warehouse",

                    select:
                        "_id warehouseName code address city state pincode"
                },

                // ==========================================
                // AREA DETAILS
                // ==========================================

                {
                    path: "area",

                    select:
                        "_id name"
                },

                // ==========================================
                // ROUTE DETAILS
                // ==========================================

                {
                    path: "route",

                    select:
                        "_id name"
                }

            ]

        };


        // ==========================================
        // PARTY POPULATE
        // ==========================================

        const partyPopulate = {

            path: "party",

            select:
                "_id firstName lastName fullName mobile email role profileImage shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"

        };


        // ==========================================
        // ADMIN
        // ==========================================

        if (req.user?.role === "Admin") {

            const orders = await Order.find({

                isDeleted: false

            })

                .populate(employeePopulate)

                .populate(partyPopulate)

                .sort({

                    createdAt: -1

                });


            return res.status(200).json({

                success: true,

                count: orders.length,

                data: orders

            });

        }


        // ==========================================
        // DISTRIBUTOR
        // ==========================================

        if (req.user?.role === "Distributor") {

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
            // GET ASSIGNED SALESMEN
            // ==========================================

            const employees = await User.find({

                distributor: distributorId,

                role: "Salesman",

                status: "Active",

                isDeleted: false

            })

                .select("_id");


            const employeeIds = employees.map(

                employee => employee._id

            );


            // ==========================================
            // GET DISTRIBUTOR ORDERS
            // ==========================================

            const orders = await Order.find({

                employee: {

                    $in: employeeIds

                },

                isDeleted: false

            })

                .populate(employeePopulate)

                .populate(partyPopulate)

                .sort({

                    createdAt: -1

                });


            return res.status(200).json({

                success: true,

                count: orders.length,

                data: orders

            });

        }


        // ==========================================
        // OTHER ROLES
        // ==========================================

        const orders = await Order.find({

            isDeleted: false

        })

            .populate(employeePopulate)

            .populate(partyPopulate)

            .sort({

                createdAt: -1

            });


        return res.status(200).json({

            success: true,

            count: orders.length,

            data: orders

        });

    }

    catch (error) {

        console.log(

            "Get Orders Error:",

            error

        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.getOrderById = async (req, res) => {

    try {

        // ==========================================
        // GET ORDER BY ID
        // ==========================================

        const order = await Order.findOne({

            _id: req.params.id,

            isDeleted: false

        })


            // ==========================================
            // EMPLOYEE POPULATE
            // ==========================================

            .populate({

                path: "employee",

                select:
                    "_id firstName lastName fullName employeeCode profileImage mobile role assignmentType warehouse distributor area route",

                populate: [

                    // ==========================================
                    // DISTRIBUTOR DETAILS
                    // ==========================================

                    {

                        path: "distributor",

                        select:
                            "_id firstName lastName fullName mobile email profileImage role distributorName shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"

                    },


                    // ==========================================
                    // WAREHOUSE DETAILS
                    // ==========================================

                    {

                        path: "warehouse",

                        select:
                            "_id warehouseName code address city state pincode"

                    },


                    // ==========================================
                    // AREA DETAILS
                    // ==========================================

                    {

                        path: "area",

                        select:
                            "_id name"

                    },


                    // ==========================================
                    // ROUTE DETAILS
                    // ==========================================

                    {

                        path: "route",

                        select:
                            "_id name"

                    }

                ]

            })


            // ==========================================
            // PARTY POPULATE
            // ==========================================

            .populate({

                path: "party",

                select:
                    "_id firstName lastName fullName mobile email role profileImage shopName gstNumber panNumber addressLine1 addressLine2 city state pincode"

            });


        // ==========================================
        // ORDER NOT FOUND
        // ==========================================

        if (!order) {

            return res.status(404).json({

                success: false,

                message: "Order Not Found"

            });

        }


        // ==========================================
        // SUCCESS
        // ==========================================

        return res.status(200).json({

            success: true,

            data: order

        });

    }


    catch (error) {

        console.log(

            "Get Order By ID Error:",

            error

        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.updateOrder = async (req, res) => {

    try {

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Order Updated Successfully",

            data: order

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.cancelOrder = async (req, res) => {

    try {

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {

                    orderStatus:
                        "Cancelled"

                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Order Cancelled Successfully",

            data: order

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

