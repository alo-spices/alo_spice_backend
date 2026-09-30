const BeatPlan = require("../models/beat-plan");
const Party = require("../models/party");
const Area = require("../models/area");
const Route = require("../models/routes");
const Visit = require("../models/visit");
const Order = require("../models/order");
const Collection = require("../models/collection");
const User = require("../models/user");
const Delivery = require("../models/delivery");
const mongoose = require("mongoose");

// ======================================
// CREATE BEAT PLAN
// ======================================
exports.createBeatPlan = async (req, res) => {

    try {

        const {
            beatName,
            description,
            area,
            route,
            salesman,
            deliveryBoy,
            day,
            shops,
            beatStartTime,
            beatEndTime
        } = req.body;


        // ==========================================
        // REQUIRED VALIDATIONS
        // ==========================================

        if (!beatName || !beatName.trim()) {

            return res.status(400).json({

                success: false,

                message: "Beat Name is required"

            });

        }


        if (!area) {

            return res.status(400).json({

                success: false,

                message: "Area is required"

            });

        }


        if (!route) {

            return res.status(400).json({

                success: false,

                message: "Route is required"

            });

        }


        // ==========================================
        // SALESMAN / DELIVERY BOY ASSIGNMENT
        // ==========================================

        /*
         * One Beat Plan = One Assigned Person
         *
         * Salesman Beat Plan:
         * salesman = ID
         * deliveryBoy = null
         *
         * Delivery Beat Plan:
         * salesman = null
         * deliveryBoy = ID
         *
         * Both are NOT allowed in same Beat Plan.
         */

        if (!salesman && !deliveryBoy) {

            return res.status(400).json({

                success: false,

                message:
                    "Either Salesman or Delivery Boy is required"

            });

        }


        if (salesman && deliveryBoy) {

            return res.status(400).json({

                success: false,

                message:
                    "A Beat Plan can be assigned to either Salesman or Delivery Boy, not both"

            });

        }


        if (!day) {

            return res.status(400).json({

                success: false,

                message: "Day is required"

            });

        }


        // ==========================================
        // OBJECT ID VALIDATION
        // ==========================================

        if (!mongoose.Types.ObjectId.isValid(area)) {

            return res.status(400).json({

                success: false,

                message: "Invalid Area ID"

            });

        }


        if (!mongoose.Types.ObjectId.isValid(route)) {

            return res.status(400).json({

                success: false,

                message: "Invalid Route ID"

            });

        }


        if (salesman &&
            !mongoose.Types.ObjectId.isValid(salesman)) {

            return res.status(400).json({

                success: false,

                message: "Invalid Salesman ID"

            });

        }


        if (deliveryBoy &&
            !mongoose.Types.ObjectId.isValid(deliveryBoy)) {

            return res.status(400).json({

                success: false,

                message: "Invalid Delivery Boy ID"

            });

        }


        // ==========================================
        // VALIDATE AREA
        // ==========================================

        const areaData = await Area.findOne({

            _id: area,

            isDeleted: false,

            status: "Active"

        });


        if (!areaData) {

            return res.status(404).json({

                success: false,

                message: "Area not found or inactive"

            });

        }


        // ==========================================
        // VALIDATE ROUTE
        // ==========================================

        const routeData = await Route.findOne({

            _id: route,

            isDeleted: false,

            status: "Active"

        });


        if (!routeData) {

            return res.status(404).json({

                success: false,

                message: "Route not found or inactive"

            });

        }


        // ==========================================
        // ROUTE MUST BELONG TO AREA
        // ==========================================

        if (

            routeData.area &&

            routeData.area.toString() !==
            area.toString()

        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Selected Route does not belong to selected Area"

            });

        }


        // ==========================================
        // SALESMAN BEAT PLAN
        // ==========================================

        if (salesman) {

            // ------------------------------------------
            // VALIDATE SALESMAN
            // ------------------------------------------

            const salesmanData = await User.findOne({

                _id: salesman,

                role: "Salesman",

                status: "Active",

                isDeleted: false

            });


            if (!salesmanData) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Salesman not found or inactive"

                });

            }


            // ------------------------------------------
            // DUPLICATE SALESMAN + DAY
            // ------------------------------------------

            const existingSalesmanBeatPlan =
                await BeatPlan.findOne({

                    salesman: salesman,

                    day: day,

                    isDeleted: false

                });


            if (existingSalesmanBeatPlan) {

                return res.status(400).json({

                    success: false,

                    message:
                        `This salesman already has a Beat Plan for ${day}.`

                });

            }

        }


        // ==========================================
        // DELIVERY BOY BEAT PLAN
        // ==========================================

        if (deliveryBoy) {

            // ------------------------------------------
            // VALIDATE DELIVERY BOY
            // ------------------------------------------

            const deliveryBoyData = await User.findOne({

                _id: deliveryBoy,

                role: "DeliveryBoy",

                status: "Active",

                isDeleted: false

            });


            if (!deliveryBoyData) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Delivery Boy not found or inactive"

                });

            }


            // ------------------------------------------
            // DELIVERY BOY AREA VALIDATION
            // ------------------------------------------

            if (

                deliveryBoyData.area &&

                deliveryBoyData.area.toString() !==
                area.toString()

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected Delivery Boy is not assigned to this Area"

                });

            }


            // ------------------------------------------
            // DELIVERY BOY ROUTE VALIDATION
            // ------------------------------------------

            if (

                deliveryBoyData.route &&

                deliveryBoyData.route.toString() !==
                route.toString()

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected Delivery Boy is not assigned to this Route"

                });

            }


            // ------------------------------------------
            // ROUTE DELIVERY BOY VALIDATION
            // ------------------------------------------

            if (routeData.deliveryBoys) {

                const deliveryBoyAssignedToRoute =
                    routeData.deliveryBoys.some(

                        id =>
                            id.toString() ===
                            deliveryBoy.toString()

                    );


                if (!deliveryBoyAssignedToRoute) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Selected Delivery Boy is not assigned to this Route"

                    });

                }

            }


            // ------------------------------------------
            // DUPLICATE DELIVERY BOY + DAY
            // ------------------------------------------

            const existingDeliveryBeatPlan =
                await BeatPlan.findOne({

                    deliveryBoy: deliveryBoy,

                    day: day,

                    isDeleted: false

                });


            if (existingDeliveryBeatPlan) {

                return res.status(400).json({

                    success: false,

                    message:
                        `This Delivery Boy already has a Beat Plan for ${day}.`

                });

            }

        }


        // ==========================================
        // VALIDATE SHOPS
        // ==========================================

        let validShops = [];


        if (
            shops &&
            Array.isArray(shops) &&
            shops.length > 0
        ) {

            // ------------------------------------------
            // REMOVE DUPLICATE SHOP IDs
            // ------------------------------------------

            validShops = [
                ...new Set(
                    shops.map(id => id.toString())
                )
            ];


            // ------------------------------------------
            // VALIDATE OBJECT IDs
            // ------------------------------------------

            const invalidShopIds =
                validShops.filter(

                    id =>
                        !mongoose.Types.ObjectId.isValid(id)

                );


            if (invalidShopIds.length > 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        "One or more Shop IDs are invalid"

                });

            }


            // ------------------------------------------
            // FETCH SHOPS
            // ------------------------------------------

            const shopList =
                await Party.find({

                    _id: {
                        $in: validShops
                    },

                    isDeleted: false,

                    status: "Active"

                }).select(
                    "_id partyName shopName area route"
                );


            // ------------------------------------------
            // CHECK ALL SHOPS EXIST
            // ------------------------------------------

            if (
                shopList.length !==
                validShops.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "One or more selected shops are not found or inactive"

                });

            }


            // ------------------------------------------
            // SHOP AREA + ROUTE VALIDATION
            // ------------------------------------------

            const invalidShop =
                shopList.find(shop => {

                    const areaMismatch =

                        shop.area &&

                        shop.area.toString() !==
                        area.toString();


                    const routeMismatch =

                        shop.route &&

                        shop.route.toString() !==
                        route.toString();


                    return areaMismatch ||
                        routeMismatch;

                });


            if (invalidShop) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Shop "${invalidShop.shopName || invalidShop.partyName}" does not belong to the selected Area/Route`

                });

            }

        }


        // ==========================================
        // CREATE BEAT PLAN
        // ==========================================

        const beatPlan = await BeatPlan.create({

            beatName: beatName.trim(),

            description: description || "",

            area: area,

            route: route,

            // Salesman Beat Plan
            salesman: salesman || null,

            // Delivery Boy Beat Plan
            deliveryBoy: deliveryBoy || null,

            day: day,

            shops: validShops,

            beatStartTime:
                beatStartTime || null,

            beatEndTime:
                beatEndTime || null,

            isStarted: false,

            isCompleted: false,

            completedShops: [],

            pendingShops: validShops,

            status: "Active",

            isDeleted: false

        });


        // ==========================================
        // POPULATE RESPONSE
        // ==========================================

        const populatedBeatPlan =
            await BeatPlan.findById(
                beatPlan._id
            )

                .populate(
                    "area",
                    "areaName areaCode city"
                )

                .populate(
                    "route",
                    "routeName routeCode"
                )

                .populate(
                    "salesman",
                    "firstName lastName fullName employeeCode mobile"
                )

                .populate(
                    "deliveryBoy",
                    "firstName lastName fullName employeeCode mobile"
                )

                .populate(
                    "shops",
                    "partyCode partyName shopName mobile"
                );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(201).json({

            success: true,

            message:
                salesman
                    ? "Salesman Beat Plan created successfully"
                    : "Delivery Boy Beat Plan created successfully",

            data: populatedBeatPlan

        });


    } catch (error) {

        console.error(
            "CREATE BEAT PLAN ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================
// GET ALL BEAT PLANS
// ======================================

exports.getDeliveryBoyBeatPlans = async (req, res) => {

    try {

        const beatPlans = await BeatPlan.find({

            isDeleted: false,

            deliveryBoy: {
                $ne: null
            }

        })

            .populate(
                "area",
                "areaName areaCode"
            )

            .populate(
                "route",
                "routeName routeCode"
            )

            .populate(
                "salesman",
                "fullName employeeCode"
            )

            .populate(
                "deliveryBoy",
                "fullName employeeCode mobile"
            )

            .sort({
                createdAt: -1
            });


        return res.status(200).json({

            success: true,

            count: beatPlans.length,

            data: beatPlans

        });

    } catch (error) {

        console.error(
            "Get Delivery Boy Beat Plans Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getBeatPlans = async (req, res) => {

    try {

        const { deliveryBoy } = req.query;

        // ======================================
        // BASE FILTER
        // ======================================

        const filter = {
            isDeleted: false
        };


        // ======================================
        // ROLE BASED DELIVERY BOY FILTER
        // ======================================

        if (req.user?.role === "DeliveryBoy") {

            const userId = req.user?._id || req.user?.id;

            if (!userId) {

                return res.status(401).json({
                    success: false,
                    message: "Delivery Boy authentication required"
                });

            }

            filter.deliveryBoy = userId;

        }

        // ======================================
        // ADMIN / OTHER ROLE
        // ======================================

        else if (deliveryBoy) {

            filter.deliveryBoy = deliveryBoy;

        }


        // ======================================
        // GET BEAT PLANS
        // ======================================

        const beatPlans = await BeatPlan.find(filter)

            .populate(
                "area",
                "areaName areaCode"
            )

            .populate(
                "route",
                "routeName routeCode"
            )

            .populate(
                "salesman",
                "fullName employeeCode"
            )

            .populate(
                "deliveryBoy",
                "fullName employeeCode"
            )

            .sort({
                createdAt: -1
            });


        return res.status(200).json({

            success: true,

            count: beatPlans.length,

            data: beatPlans

        });


    } catch (error) {

        console.error(
            "Get Beat Plans Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getEmployeeBeats = async (req, res) => {

    try {

        const { employeeId } = req.params;

        const beats = await BeatPlan.find({

            salesman: employeeId,

            status: "Active",

            isDeleted: false

        })

            .populate("area", "areaName areaCode")

            .populate("route", "routeName routeCode")

            .sort({ day: 1 });

        return res.status(200).json({

            success: true,

            count: beats.length,

            data: beats.map(item => ({

                _id: item._id,

                beatName: item.beatName,

                day: item.day,

                area: item.area,

                route: item.route,

                totalShops: item.shops.length

            }))

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
// GET BEAT PLAN BY ID
// ======================================

exports.getBeatPlanById = async (req, res) => {

    try {

        const beatPlan = await BeatPlan.findById(
            req.params.id
        )
            .populate("area")
            .populate("route")
            .populate("salesman")
            .populate("shops");

        if (!beatPlan) {

            return res.status(404).json({

                success: false,

                message: "Beat Plan not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: beatPlan

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================
// UPDATE BEAT PLAN
// ======================================
exports.updateBeatPlan = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            beatName,
            description,
            area,
            route,
            salesman,
            deliveryBoy,
            day,
            shops,
            beatStartTime,
            beatEndTime,
            status
        } = req.body;


        // ==========================================
        // FIND EXISTING BEAT PLAN
        // ==========================================

        const existingBeatPlan =
            await BeatPlan.findOne({

                _id: id,

                isDeleted: false

            });


        if (!existingBeatPlan) {

            return res.status(404).json({

                success: false,

                message: "Beat Plan not found"

            });

        }


        // ==========================================
        // BASIC VALIDATIONS
        // ==========================================

        if (
            beatName !== undefined &&
            !beatName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message: "Beat Name is required"

            });

        }


        if (!area) {

            return res.status(400).json({

                success: false,

                message: "Area is required"

            });

        }


        if (!route) {

            return res.status(400).json({

                success: false,

                message: "Route is required"

            });

        }


        if (!day) {

            return res.status(400).json({

                success: false,

                message: "Day is required"

            });

        }


        // ==========================================
        // SALESMAN / DELIVERY BOY ASSIGNMENT
        // ==========================================

        /*
         * One Beat Plan = One Assigned Person
         *
         * Salesman Beat Plan:
         * salesman = ID
         * deliveryBoy = null
         *
         * Delivery Boy Beat Plan:
         * salesman = null
         * deliveryBoy = ID
         */

        if (!salesman && !deliveryBoy) {

            return res.status(400).json({

                success: false,

                message:
                    "Either Salesman or Delivery Boy is required"

            });

        }


        if (salesman && deliveryBoy) {

            return res.status(400).json({

                success: false,

                message:
                    "A Beat Plan can be assigned to either Salesman or Delivery Boy, not both"

            });

        }


        // ==========================================
        // OBJECT ID VALIDATION
        // ==========================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid Beat Plan ID"

            });

        }


        if (
            !mongoose.Types.ObjectId.isValid(area)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid Area ID"

            });

        }


        if (
            !mongoose.Types.ObjectId.isValid(route)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid Route ID"

            });

        }


        if (
            salesman &&
            !mongoose.Types.ObjectId.isValid(salesman)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid Salesman ID"

            });

        }


        if (
            deliveryBoy &&
            !mongoose.Types.ObjectId.isValid(deliveryBoy)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid Delivery Boy ID"

            });

        }


        // ==========================================
        // VALIDATE AREA
        // ==========================================

        const areaData = await Area.findOne({

            _id: area,

            isDeleted: false,

            status: "Active"

        });


        if (!areaData) {

            return res.status(404).json({

                success: false,

                message: "Area not found or inactive"

            });

        }


        // ==========================================
        // VALIDATE ROUTE
        // ==========================================

        const routeData = await Route.findOne({

            _id: route,

            isDeleted: false,

            status: "Active"

        });


        if (!routeData) {

            return res.status(404).json({

                success: false,

                message: "Route not found or inactive"

            });

        }


        // ==========================================
        // ROUTE MUST BELONG TO AREA
        // ==========================================

        if (

            routeData.area &&

            routeData.area.toString() !==
            area.toString()

        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Selected Route does not belong to selected Area"

            });

        }


        // ==========================================
        // SALESMAN VALIDATION
        // ==========================================

        if (salesman) {

            const salesmanData =
                await User.findOne({

                    _id: salesman,

                    role: "Salesman",

                    status: "Active",

                    isDeleted: false

                });


            if (!salesmanData) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Salesman not found or inactive"

                });

            }


            // ------------------------------------------
            // SALESMAN AREA
            // ------------------------------------------

            if (

                salesmanData.area &&

                salesmanData.area.toString() !==
                area.toString()

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected Salesman is not assigned to this Area"

                });

            }


            // ------------------------------------------
            // SALESMAN ROUTE
            // ------------------------------------------

            if (

                salesmanData.route &&

                salesmanData.route.toString() !==
                route.toString()

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected Salesman is not assigned to this Route"

                });

            }


            // ------------------------------------------
            // DUPLICATE SALESMAN + DAY
            // EXCLUDE CURRENT BEAT PLAN
            // ------------------------------------------

            const existingSalesmanBeatPlan =
                await BeatPlan.findOne({

                    _id: {
                        $ne: id
                    },

                    salesman: salesman,

                    day: day,

                    isDeleted: false

                });


            if (existingSalesmanBeatPlan) {

                return res.status(400).json({

                    success: false,

                    message:
                        `This salesman already has a Beat Plan for ${day}.`

                });

            }

        }


        // ==========================================
        // DELIVERY BOY VALIDATION
        // ==========================================

        if (deliveryBoy) {

            const deliveryBoyData =
                await User.findOne({

                    _id: deliveryBoy,

                    role: "DeliveryBoy",

                    status: "Active",

                    isDeleted: false

                });


            if (!deliveryBoyData) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Delivery Boy not found or inactive"

                });

            }


            // ------------------------------------------
            // DELIVERY BOY AREA
            // ------------------------------------------

            if (

                deliveryBoyData.area &&

                deliveryBoyData.area.toString() !==
                area.toString()

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected Delivery Boy is not assigned to this Area"

                });

            }


            // ------------------------------------------
            // DELIVERY BOY ROUTE
            // ------------------------------------------

            if (

                deliveryBoyData.route &&

                deliveryBoyData.route.toString() !==
                route.toString()

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected Delivery Boy is not assigned to this Route"

                });

            }


            // ------------------------------------------
            // DUPLICATE DELIVERY BOY + DAY
            // EXCLUDE CURRENT BEAT PLAN
            // ------------------------------------------

            const existingDeliveryBeatPlan =
                await BeatPlan.findOne({

                    _id: {
                        $ne: id
                    },

                    deliveryBoy: deliveryBoy,

                    day: day,

                    isDeleted: false

                });


            if (existingDeliveryBeatPlan) {

                return res.status(400).json({

                    success: false,

                    message:
                        `This Delivery Boy already has a Beat Plan for ${day}.`

                });

            }

        }


        // ==========================================
        // VALIDATE SHOPS
        // ==========================================

        let validShops = [];


        if (
            shops &&
            Array.isArray(shops) &&
            shops.length > 0
        ) {

            // ------------------------------------------
            // REMOVE DUPLICATES
            // ------------------------------------------

            validShops = [
                ...new Set(
                    shops.map(
                        shopId => shopId.toString()
                    )
                )
            ];


            // ------------------------------------------
            // VALIDATE SHOP IDs
            // ------------------------------------------

            const invalidShopIds =
                validShops.filter(

                    shopId =>
                        !mongoose.Types.ObjectId.isValid(
                            shopId
                        )

                );


            if (invalidShopIds.length > 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        "One or more Shop IDs are invalid"

                });

            }


            // ------------------------------------------
            // FETCH SHOPS
            // ------------------------------------------

            const shopList =
                await Party.find({

                    _id: {
                        $in: validShops
                    },

                    isDeleted: false,

                    status: "Active"

                }).select(
                    "_id partyName shopName area route"
                );


            // ------------------------------------------
            // CHECK ALL SHOPS EXIST
            // ------------------------------------------

            if (
                shopList.length !==
                validShops.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "One or more selected shops are not found or inactive"

                });

            }


            // ------------------------------------------
            // SHOP AREA + ROUTE
            // ------------------------------------------

            const invalidShop =
                shopList.find(shop => {

                    const areaMismatch =

                        shop.area &&

                        shop.area.toString() !==
                        area.toString();


                    const routeMismatch =

                        shop.route &&

                        shop.route.toString() !==
                        route.toString();


                    return (
                        areaMismatch ||
                        routeMismatch
                    );

                });


            if (invalidShop) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Shop "${invalidShop.shopName || invalidShop.partyName}" does not belong to the selected Area/Route`

                });

            }

        }


        // ==========================================
        // UPDATE DATA
        // ==========================================

        const updateData = {

            beatName:
                beatName !== undefined
                    ? beatName.trim()
                    : existingBeatPlan.beatName,

            description:
                description !== undefined
                    ? description
                    : existingBeatPlan.description,

            area,

            route,

            salesman:
                salesman || null,

            deliveryBoy:
                deliveryBoy || null,

            day,

            shops:
                shops !== undefined
                    ? validShops
                    : existingBeatPlan.shops,

            beatStartTime:
                beatStartTime !== undefined
                    ? beatStartTime
                    : existingBeatPlan.beatStartTime,

            beatEndTime:
                beatEndTime !== undefined
                    ? beatEndTime
                    : existingBeatPlan.beatEndTime,

            status:
                status !== undefined
                    ? status
                    : existingBeatPlan.status

        };


        // ==========================================
        // UPDATE BEAT PLAN
        // ==========================================

        const beatPlan =
            await BeatPlan.findByIdAndUpdate(

                id,

                updateData,

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!beatPlan) {

            return res.status(404).json({

                success: false,

                message: "Beat Plan not found"

            });

        }


        // ==========================================
        // POPULATE UPDATED BEAT PLAN
        // ==========================================

        const populatedBeatPlan =
            await BeatPlan.findById(
                beatPlan._id
            )

                .populate(
                    "area",
                    "areaName areaCode city"
                )

                .populate(
                    "route",
                    "routeName routeCode"
                )

                .populate(
                    "salesman",
                    "firstName lastName fullName employeeCode mobile"
                )

                .populate(
                    "deliveryBoy",
                    "firstName lastName fullName employeeCode mobile"
                )

                .populate(
                    "shops",
                    "partyCode partyName shopName mobile"
                );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                salesman
                    ? "Salesman Beat Plan updated successfully"
                    : "Delivery Boy Beat Plan updated successfully",

            data: populatedBeatPlan

        });


    } catch (error) {

        console.error(
            "UPDATE BEAT PLAN ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================
// DELETE BEAT PLAN (SOFT DELETE)
// ======================================

exports.deleteBeatPlan = async (req, res) => {

    try {

        const beatPlan = await BeatPlan.findById(
            req.params.id
        );

        if (!beatPlan) {

            return res.status(404).json({

                success: false,

                message: "Beat Plan not found"

            });

        }

        beatPlan.isDeleted = true;

        beatPlan.status = "Inactive";

        await beatPlan.save();

        return res.status(200).json({

            success: true,

            message: "Beat Plan deleted successfully"

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getTodayBeat = async (req, res) => {

    try {

        const { employeeId } = req.params;

        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

        const today = days[new Date().getDay()];

        console.log("==================================");
        console.log("Employee Id :", employeeId);
        console.log("Today :", today);
        console.log("Server Date :", new Date());

        // Check all beats assigned to employee
        const employeeBeats = await BeatPlan.find({

            salesman: new mongoose.Types.ObjectId(employeeId),

            isDeleted: false

        });

        console.log("Employee Beats :", employeeBeats);

        const beat = await BeatPlan.findOne({

            salesman: new mongoose.Types.ObjectId(employeeId),

            day: today,

            status: "Active",

            isDeleted: false

        })
            .populate("area", "areaName areaCode")
            .populate("route", "routeName routeCode");

        console.log("Today's Beat :", beat);

        if (!beat) {

            return res.status(404).json({

                success: false,

                message: `No Beat Assigned For ${today}`,

                debug: {

                    employeeId,

                    today

                }

            });

        }

        return res.status(200).json({

            success: true,

            data: {

                _id: beat._id,

                beatName: beat.beatName,

                description: beat.description,

                day: beat.day,

                area: beat.area,

                route: beat.route,

                totalShops: beat.shops.length

            }

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

exports.getBeatShops = async (req, res) => {

    try {

        const beat =
            await BeatPlan.findById(
                req.params.beatId
            )

                .populate({

                    path: "shops",

                    select:
                        "shopName ownerName mobile address city latitude longitude openingBalance status"

                });

        if (!beat) {

            return res.status(404).json({

                success: false,

                message: "Beat Plan not found"

            });

        }

        return res.status(200).json({

            success: true,

            count: beat.shops.length,

            data: beat.shops

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



exports.getBeatShopDetails = async (req, res) => {

    try {

        const shop =
            await Party.findById(
                req.params.shopId
            )

                .populate("area", "areaName")

                .populate("route", "routeName");

        if (!shop) {

            return res.status(404).json({

                success: false,

                message: "Shop not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: shop

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getBeatSummary = async (req, res) => {

    try {

        const { employeeId } = req.params;

        // =====================================
        // TODAY DAY
        // =====================================

        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

        const today =
            days[new Date().getDay()];


        // =====================================
        // TODAY RANGE
        // =====================================

        const startOfDay = new Date();

        startOfDay.setHours(
            0,
            0,
            0,
            0
        );

        const endOfDay = new Date();

        endOfDay.setHours(
            23,
            59,
            59,
            999
        );


        // =====================================
        // GET TODAY BEAT
        // =====================================

        const beat =
            await BeatPlan.findOne({

                salesman: employeeId,

                day: today,

                status: "Active",

                isDeleted: false

            });


        if (!beat) {

            return res.status(404).json({

                success: false,

                message: "No Beat Found"

            });

        }


        // =====================================
        // TOTAL SHOPS
        // =====================================

        const totalShops =
            beat.shops?.length || 0;


        // =====================================
        // GET TODAY VISITS
        // =====================================

        const visits =
            await Visit.find({

                employee: employeeId,

                party: {
                    $in: beat.shops
                },

                visitStartTime: {

                    $gte: startOfDay,

                    $lte: endOfDay

                },

                isDeleted: false

            }).select("party");


        // =====================================
        // UNIQUE VISITED SHOPS
        // =====================================

        const visitedShopIds =
            new Set(

                visits

                    .filter(
                        visit =>
                            visit.party
                    )

                    .map(
                        visit =>
                            String(visit.party)
                    )

            );


        const visited =
            visitedShopIds.size;


        // =====================================
        // PENDING SHOPS
        // =====================================

        const pending =
            Math.max(
                totalShops - visited,
                0
            );


        // =====================================
        // TODAY ORDERS
        // =====================================

        const orders =
            await Order.countDocuments({

                employee: employeeId,

                party: {
                    $in: beat.shops
                },

                createdAt: {

                    $gte: startOfDay,

                    $lte: endOfDay

                },

                isDeleted: false

            });


        // =====================================
        // TODAY COLLECTIONS
        // =====================================

        const collections =
            await Collection.countDocuments({

                employee: employeeId,

                party: {
                    $in: beat.shops
                },

                collectionDate: {

                    $gte: startOfDay,

                    $lte: endOfDay

                }

            });


        // =====================================
        // COVERAGE
        // =====================================

        const coverage =
            totalShops > 0

                ? Math.round(
                    (
                        visited /
                        totalShops
                    ) * 100
                )

                : 0;


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(200).json({

            success: true,

            data: {

                beatName:
                    beat.beatName,

                totalShops,

                visited,

                pending,

                orders,

                collections,

                coverage

            }

        });

    }

    catch (error) {

        console.error(
            "Get Beat Summary Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.startBeat = async (req, res) => {

    try {

        const beat = await BeatPlan.findById(req.params.beatId);

        if (!beat) {

            return res.status(404).json({
                success: false,
                message: "Beat not found"
            });

        }

        if (beat.isStarted) {

            return res.status(400).json({
                success: false,
                message: "Beat already started"
            });

        }

        beat.isStarted = true;

        beat.beatStartTime = new Date();

        beat.pendingShops = beat.shops;

        await beat.save();

        return res.status(200).json({

            success: true,

            message: "Beat Started Successfully",

            data: beat

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.completeBeat = async (req, res) => {

    try {

        const beat = await BeatPlan.findById(req.params.beatId);

        if (!beat) {

            return res.status(404).json({

                success: false,

                message: "Beat not found"

            });

        }

        beat.isCompleted = true;

        beat.beatEndTime = new Date();

        await beat.save();

        return res.status(200).json({

            success: true,

            message: "Beat Completed Successfully",

            data: beat

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.completeShopVisit = async (req, res) => {

    try {

        const { beatId, shopId } = req.body;

        const beat = await BeatPlan.findById(beatId);

        if (!beat) {

            return res.status(404).json({

                success: false,

                message: "Beat not found"

            });

        }

        if (!beat.completedShops.includes(shopId)) {

            beat.completedShops.push(shopId);

        }

        beat.pendingShops = beat.pendingShops.filter(

            x => x.toString() != shopId

        );

        await beat.save();

        return res.status(200).json({

            success: true,

            message: "Shop Completed"

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getBeatProgress = async (req, res) => {

    try {

        const beat = await BeatPlan.findById(req.params.beatId);

        if (!beat) {

            return res.status(404).json({

                success: false,

                message: "Beat not found"

            });

        }

        const total = beat.shops.length;

        const completed = beat.completedShops.length;

        const pending = total - completed;

        return res.status(200).json({

            success: true,

            data: {

                total,

                completed,

                pending,

                coverage:

                    total == 0

                        ? 0

                        : Math.round((completed / total) * 100)

            }

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getRouteShops = async (req, res) => {

    try {

        const shops = await Party.find({

            route: req.params.routeId,

            status: "Active",

            isDeleted: false

        });

        return res.status(200).json({

            success: true,

            count: shops.length,

            data: shops

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


exports.getEmployeeDashboard = async (req, res) => {

    try {

        const { employeeId } = req.params;

        // =====================================
        // EMPLOYEE
        // =====================================

        const employee = await User.findById(employeeId)
            .select("_id firstName lastName fullName employeeCode role");

        if (!employee) {

            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });

        }

        // =====================================
        // TODAY RANGE
        // =====================================

        const startOfDay = new Date();

        startOfDay.setHours(
            0,
            0,
            0,
            0
        );

        const endOfDay = new Date();

        endOfDay.setHours(
            23,
            59,
            59,
            999
        );

        // =====================================
        // DELIVERY BOY DASHBOARD
        // =====================================

        if (employee.role === "DeliveryBoy") {

            // =====================================
            // TODAY DELIVERIES
            // =====================================

            const deliveries = await Delivery.find({

                deliveryBoy: employeeId,

                deliveryDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },

                isDeleted: false

            })

                .populate(
                    "order",
                    "orderNumber grandTotal orderStatus paymentStatus paidAmount balanceAmount"
                )

                .populate(
                    "party",
                    "shopName partyName partyCode ownerName mobile alternateMobile address city state pincode latitude longitude"
                )

                .populate(
                    "sourceDistributor",
                    "firstName lastName fullName employeeCode mobile distributorName shopName"
                )

                .populate(
                    "sourceWarehouse",
                    "warehouseCode warehouseName warehouseType"
                )

                .sort({
                    createdAt: -1
                });


            // =====================================
            // DELIVERY COUNTS
            // =====================================

            const totalDeliveries =
                deliveries.length;


            const assignedDeliveries =
                deliveries.filter(
                    delivery =>
                        delivery.deliveryStatus === "Assigned"
                ).length;


            const dispatchedDeliveries =
                deliveries.filter(
                    delivery =>
                        delivery.deliveryStatus === "Dispatched"
                ).length;


            const deliveredDeliveries =
                deliveries.filter(
                    delivery =>
                        delivery.deliveryStatus === "Delivered"
                ).length;


            const failedDeliveries =
                deliveries.filter(
                    delivery =>
                        delivery.deliveryStatus === "Failed"
                ).length;


            const cancelledDeliveries =
                deliveries.filter(
                    delivery =>
                        delivery.deliveryStatus === "Cancelled"
                ).length;


            // =====================================
            // DELIVERY VALUE
            // =====================================

            const totalDeliveryValue =
                deliveries.reduce(
                    (total, delivery) =>
                        total +
                        Number(
                            delivery.order?.grandTotal || 0
                        ),
                    0
                );


            // =====================================
            // PENDING DELIVERY VALUE
            // =====================================

            const pendingDeliveryValue =
                deliveries
                    .filter(
                        delivery =>
                            delivery.deliveryStatus === "Assigned" ||
                            delivery.deliveryStatus === "Dispatched"
                    )
                    .reduce(
                        (total, delivery) =>
                            total +
                            Number(
                                delivery.order?.grandTotal || 0
                            ),
                        0
                    );


            // =====================================
            // DELIVERED VALUE
            // =====================================

            const deliveredValue =
                deliveries
                    .filter(
                        delivery =>
                            delivery.deliveryStatus === "Delivered"
                    )
                    .reduce(
                        (total, delivery) =>
                            total +
                            Number(
                                delivery.order?.grandTotal || 0
                            ),
                        0
                    );


            // =====================================
            // FAILED VALUE
            // =====================================

            const failedValue =
                deliveries
                    .filter(
                        delivery =>
                            delivery.deliveryStatus === "Failed"
                    )
                    .reduce(
                        (total, delivery) =>
                            total +
                            Number(
                                delivery.order?.grandTotal || 0
                            ),
                        0
                    );


            // =====================================
            // RESPONSE - DELIVERY BOY
            // =====================================

            return res.status(200).json({

                success: true,

                employee: {

                    _id:
                        employee._id,

                    name:
                        employee.fullName,

                    employeeCode:
                        employee.employeeCode,

                    role:
                        employee.role

                },

                today: {

                    deliveries: {

                        total:
                            totalDeliveries,

                        assigned:
                            assignedDeliveries,

                        dispatched:
                            dispatchedDeliveries,

                        delivered:
                            deliveredDeliveries,

                        failed:
                            failedDeliveries,

                        cancelled:
                            cancelledDeliveries

                    },

                    deliveryValue: {

                        total:
                            Number(
                                totalDeliveryValue.toFixed(2)
                            ),

                        pending:
                            Number(
                                pendingDeliveryValue.toFixed(2)
                            ),

                        delivered:
                            Number(
                                deliveredValue.toFixed(2)
                            ),

                        failed:
                            Number(
                                failedValue.toFixed(2)
                            )

                    }

                },

                activeVisit: null

            });

        }


        // =====================================
        // SALESMAN DASHBOARD
        // =====================================


        // =====================================
        // TODAY DAY
        // =====================================

        const days = [

            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"

        ];

        const todayDay =
            days[new Date().getDay()];


        // =====================================
        // TODAY BEAT PLAN
        // =====================================

        const todayBeatPlan =
            await BeatPlan.findOne({

                salesman: employeeId,

                day: todayDay,

                status: "Active",

                isDeleted: false

            });


        // =====================================
        // DEFAULT BEAT PLAN DATA
        // =====================================

        let beatPlanData = {

            beatName: null,

            totalShops: 0,

            visited: 0,

            pending: 0,

            orders: 0,

            collections: 0,

            coverage: 0

        };


        // =====================================
        // BEAT PLAN DATA
        // =====================================

        if (todayBeatPlan) {

            const beatShopIds =
                todayBeatPlan.shops || [];


            // =====================================
            // TODAY VISITS FOR BEAT SHOPS
            // =====================================

            const beatVisits =
                await Visit.find({

                    employee: employeeId,

                    party: {
                        $in: beatShopIds
                    },

                    visitStartTime: {

                        $gte: startOfDay,

                        $lte: endOfDay

                    },

                    isDeleted: false

                }).select("party");


            // =====================================
            // UNIQUE VISITED SHOPS
            // =====================================

            const visitedBeatShopIds =
                new Set(

                    beatVisits

                        .filter(
                            visit =>
                                visit.party
                        )

                        .map(
                            visit =>
                                String(visit.party)
                        )

                );


            const visitedBeatShops =
                visitedBeatShopIds.size;


            // =====================================
            // BEAT ORDERS
            // =====================================

            const beatOrders =
                await Order.find({

                    employee: employeeId,

                    party: {
                        $in: beatShopIds
                    },

                    createdAt: {

                        $gte: startOfDay,

                        $lte: endOfDay

                    },

                    isDeleted: false

                }).select("_id");


            // =====================================
            // BEAT COLLECTIONS
            // =====================================

            const beatCollections =
                await Collection.find({

                    employee: employeeId,

                    party: {
                        $in: beatShopIds
                    },

                    collectionDate: {

                        $gte: startOfDay,

                        $lte: endOfDay

                    }

                }).select("_id");


            // =====================================
            // TOTAL SHOPS
            // =====================================

            const totalBeatShops =
                beatShopIds.length;


            // =====================================
            // PENDING SHOPS
            // =====================================

            const pendingBeatShops =
                Math.max(
                    totalBeatShops -
                    visitedBeatShops,
                    0
                );


            // =====================================
            // BEAT COVERAGE
            // =====================================

            const beatCoverage =
                totalBeatShops > 0

                    ? Math.round(
                        (
                            visitedBeatShops /
                            totalBeatShops
                        ) * 100
                    )

                    : 0;


            beatPlanData = {

                beatName:
                    todayBeatPlan.beatName,

                totalShops:
                    totalBeatShops,

                visited:
                    visitedBeatShops,

                pending:
                    pendingBeatShops,

                orders:
                    beatOrders.length,

                collections:
                    beatCollections.length,

                coverage:
                    beatCoverage

            };

        }


        // =====================================
        // TODAY VISITS
        // =====================================

        const todayVisits =
            await Visit.find({

                employee: employeeId,

                visitStartTime: {

                    $gte: startOfDay,

                    $lte: endOfDay

                },

                isDeleted: false

            })

                .populate(
                    "party",
                    "shopName partyName partyCode"
                )

                .sort({

                    visitStartTime: -1

                });


        const totalVisits =
            todayVisits.length;


        const completedVisits =
            todayVisits.filter(
                x =>
                    x.visitStatus === "Completed"
            ).length;


        const pendingVisits =
            todayVisits.filter(
                x =>
                    x.visitStatus === "Started" ||
                    x.visitStatus === "Cancelled"
            ).length;


        // =====================================
        // PRODUCTIVE CALLS
        // =====================================

        const productiveCalls =
            todayVisits.filter(
                x =>
                    x.orderCreated === true ||
                    x.collectionDone === true
            ).length;


        // =====================================
        // TODAY ORDERS
        // =====================================

        const orders =
            await Order.find({

                employee: employeeId,

                createdAt: {

                    $gte: startOfDay,

                    $lte: endOfDay

                },

                isDeleted: false

            });


        const ordersBooked =
            orders.length;


        const orderValue =
            orders.reduce(

                (total, order) =>

                    total +
                    Number(
                        order.grandTotal || 0
                    ),

                0

            );


        // =====================================
        // TODAY COLLECTIONS
        // =====================================

        const collections =
            await Collection.find({

                employee: employeeId,

                collectionDate: {

                    $gte: startOfDay,

                    $lte: endOfDay

                }

            });


        const collectionCount =
            collections.length;


        const collectionAmount =
            collections.reduce(

                (total, collection) =>

                    total +
                    Number(
                        collection.collectedAmount || 0
                    ),

                0

            );


        // =====================================
        // ASSIGNED OUTLETS
        // =====================================

        const assignedOutlets =
            await Party.countDocuments({

                assignedSalesman:
                    employeeId,

                isDeleted: false

            });


        // =====================================
        // VISITED UNIQUE OUTLETS
        // =====================================

        const visitedOutletIds =
            new Set(

                todayVisits

                    .filter(
                        x =>
                            x.party
                    )

                    .map(
                        x =>
                            x.party._id.toString()
                    )

            );


        const visitedOutlets =
            visitedOutletIds.size;


        // =====================================
        // OUTLET COVERAGE
        // =====================================

        let outletCoverage =
            0;


        if (assignedOutlets > 0) {

            outletCoverage =
                Math.round(

                    (
                        visitedOutlets /
                        assignedOutlets
                    ) * 100

                );

        }


        // =====================================
        // AVERAGE ORDER VALUE
        // =====================================

        const averageOrderValue =
            ordersBooked > 0

                ? orderValue /
                ordersBooked

                : 0;


        // =====================================
        // NEW OUTLETS TODAY
        // =====================================

        const newOutlets =
            await Party.countDocuments({

                assignedSalesman:
                    employeeId,

                createdAt: {

                    $gte: startOfDay,

                    $lte: endOfDay

                },

                isDeleted: false

            });


        // =====================================
        // PENDING COLLECTIONS
        // =====================================

        const pendingOrders =
            await Order.find({

                employee: employeeId,

                balanceAmount: {

                    $gt: 0

                },

                isDeleted: false

            });


        const pendingCollections =
            pendingOrders.reduce(

                (total, order) =>

                    total +
                    Number(
                        order.balanceAmount || 0
                    ),

                0

            );


        // =====================================
        // ACTIVE VISIT
        // =====================================

        const activeVisit =
            await Visit.findOne({

                employee: employeeId,

                visitStatus:
                    "Started",

                isDeleted:
                    false

            })

                .populate(
                    "party",
                    "shopName partyName partyCode"
                )

                .sort({

                    visitStartTime:
                        -1

                });


        // =====================================
        // RESPONSE - SALESMAN
        // =====================================

        return res.status(200).json({

            success: true,

            employee: {

                _id:
                    employee._id,

                name:
                    employee.fullName,

                employeeCode:
                    employee.employeeCode,

                role:
                    employee.role

            },

            today: {

                // =================================
                // TODAY'S BEAT PLAN
                // =================================

                beatPlan:
                    beatPlanData,


                // =================================
                // TODAY'S ACTIVITY
                // =================================

                visits: {

                    total:
                        totalVisits,

                    completed:
                        completedVisits,

                    pending:
                        pendingVisits

                },

                orders: {

                    count:
                        ordersBooked,

                    value:
                        Number(
                            orderValue.toFixed(2)
                        )

                },

                collections: {

                    count:
                        collectionCount,

                    amount:
                        Number(
                            collectionAmount.toFixed(2)
                        )

                },

                outlets: {

                    assigned:
                        assignedOutlets,

                    visited:
                        visitedOutlets,

                    coverage:
                        outletCoverage

                },

                productiveCalls,

                averageOrderValue:
                    Number(
                        averageOrderValue.toFixed(2)
                    ),

                newOutlets,

                pendingCollections:
                    Number(
                        pendingCollections.toFixed(2)
                    )

            },

            activeVisit:

                activeVisit

                    ? {

                        _id:
                            activeVisit._id,

                        shop:
                            activeVisit.party,

                        visitStartTime:
                            activeVisit.visitStartTime

                    }

                    : null

        });

    }

    catch (error) {

        console.error(
            "Employee Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.getTodayTarget = async (req, res) => {

    try {

        const today = new Date();

        const target = await EmployeeTarget.findOne({

            employee: req.params.employeeId,

            month: today.getMonth() + 1,

            year: today.getFullYear()

        });

        return res.status(200).json({

            success: true,

            data: target

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


exports.getEmployeePerformance = async (req, res) => {

    try {

        const target = await EmployeeTarget.findOne({

            employee: req.params.employeeId

        }).sort({

            createdAt: -1

        });

        return res.status(200).json({

            success: true,

            data: target

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getMissedShops = async (req, res) => {

    try {

        const beats = await BeatPlan.find({

            salesman: req.params.employeeId,

            isDeleted: false

        }).populate("pendingShops");

        return res.status(200).json({

            success: true,

            data: beats

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getRevisitShops = async (req, res) => {

    try {

        const visits = await Visit.find({

            employee: req.params.employeeId,

            visitOutcome: "Follow Up Required"

        }).populate("party");

        return res.status(200).json({

            success: true,

            count: visits.length,

            data: visits

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
// ASSIGN DELIVERY BOY TO BEAT PLAN
// ======================================
exports.assignDeliveryBoyToBeatPlan = async (req, res) => {

    try {

        const { id } = req.params;
        const { deliveryBoy } = req.body;


        // ==========================================
        // REQUIRED VALIDATION
        // ==========================================

        if (!deliveryBoy) {

            return res.status(400).json({
                success: false,
                message: "Delivery Boy is required"
            });

        }


        // ==========================================
        // FIND BEAT PLAN
        // ==========================================

        const beatPlan = await BeatPlan.findOne({
            _id: id,
            isDeleted: false,
            status: "Active"
        });

        if (!beatPlan) {

            return res.status(404).json({
                success: false,
                message: "Beat Plan Not Found"
            });

        }


        // ==========================================
        // VALIDATE DELIVERY BOY
        // ==========================================

        const employee = await User.findOne({
            _id: deliveryBoy,
            role: "DeliveryBoy",
            status: "Active",
            isDeleted: false
        });

        if (!employee) {

            return res.status(404).json({
                success: false,
                message: "Active Delivery Boy Not Found"
            });

        }


        // ==========================================
        // SAME BEAT PLAN ALREADY ASSIGNED
        // ==========================================

        if (
            beatPlan.deliveryBoy &&
            String(beatPlan.deliveryBoy) === String(deliveryBoy)
        ) {

            return res.status(400).json({
                success: false,
                message: "This Delivery Boy is already assigned to this Beat Plan"
            });

        }


        // ==========================================
        // ASSIGN DELIVERY BOY
        // ==========================================

        beatPlan.deliveryBoy = deliveryBoy;

        await beatPlan.save();


        // ==========================================
        // POPULATE RESPONSE
        // ==========================================

        const updatedBeatPlan =
            await BeatPlan.findById(beatPlan._id)

                .populate(
                    "area",
                    "areaName areaCode city"
                )

                .populate(
                    "route",
                    "routeName routeCode"
                )

                .populate(
                    "salesman",
                    "firstName lastName fullName employeeCode mobile"
                )

                .populate(
                    "deliveryBoy",
                    "firstName lastName fullName employeeCode mobile"
                )

                .populate(
                    "shops",
                    "partyCode partyName shopName mobile"
                );


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Delivery Boy assigned to Beat Plan successfully",

            data: updatedBeatPlan

        });


    } catch (error) {

        console.log(
            "Assign Delivery Boy To Beat Plan Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.assignDeliveryBoyToBeatPlans = async (req, res) => {
    try {
        const { deliveryBoy, beatPlans } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!deliveryBoy) {
            return res.status(400).json({
                success: false,
                message: "Delivery Boy is required"
            });
        }

        if (!Array.isArray(beatPlans) || beatPlans.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one Beat Plan is required"
            });
        }

        // Remove duplicate Beat Plan IDs
        const uniqueBeatPlans = [
            ...new Set(beatPlans.map(id => String(id)))
        ];

        // ==========================================
        // CHECK DELIVERY BOY
        // ==========================================
        const employee = await User.findOne({
            _id: deliveryBoy,
            role: "DeliveryBoy",
            status: "Active",
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Active Delivery Boy Not Found"
            });
        }

        // ==========================================
        // GET BEAT PLANS
        // ==========================================
        const plans = await BeatPlan.find({
            _id: { $in: uniqueBeatPlans },
            isDeleted: false,
            status: "Active"
        });

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No valid Beat Plans found"
            });
        }

        // ==========================================
        // CHECK INVALID IDS
        // ==========================================
        const foundIds = plans.map(plan => String(plan._id));

        const invalidBeatPlans = uniqueBeatPlans.filter(
            id => !foundIds.includes(id)
        );

        if (invalidBeatPlans.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some Beat Plans are invalid or inactive",
                invalidBeatPlans
            });
        }

        // ==========================================
        // ALREADY ASSIGNED CHECK
        // ==========================================
        const alreadyAssigned = plans.filter(
            plan =>
                plan.deliveryBoy &&
                String(plan.deliveryBoy) === String(deliveryBoy)
        );

        // ==========================================
        // ONLY UPDATE UNASSIGNED / OTHER DELIVERY BOY
        // ==========================================
        const plansToUpdate = plans.filter(
            plan =>
                !plan.deliveryBoy ||
                String(plan.deliveryBoy) !== String(deliveryBoy)
        );

        if (plansToUpdate.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected Beat Plans are already assigned to this Delivery Boy"
            });
        }

        // ==========================================
        // BULK UPDATE
        // ==========================================
        await BeatPlan.updateMany(
            {
                _id: {
                    $in: plansToUpdate.map(plan => plan._id)
                },
                isDeleted: false,
                status: "Active"
            },
            {
                $set: {
                    deliveryBoy: deliveryBoy
                }
            }
        );

        // ==========================================
        // GET UPDATED DATA
        // ==========================================
        const updatedBeatPlans = await BeatPlan.find({
            _id: {
                $in: uniqueBeatPlans
            },
            isDeleted: false
        })
            .populate("area", "areaName areaCode city")
            .populate("route", "routeName routeCode")
            .populate(
                "salesman",
                "firstName lastName fullName employeeCode mobile"
            )
            .populate(
                "deliveryBoy",
                "firstName lastName fullName employeeCode mobile"
            )
            .populate(
                "shops",
                "partyCode partyName shopName mobile"
            );

        return res.status(200).json({
            success: true,
            message: `${plansToUpdate.length} Beat Plan(s) assigned to Delivery Boy successfully`,
            assignedCount: plansToUpdate.length,
            alreadyAssignedCount: alreadyAssigned.length,
            alreadyAssigned: alreadyAssigned.map(plan => plan._id),
            data: updatedBeatPlans
        });

    } catch (error) {
        console.log(
            "Bulk Assign Delivery Boy To Beat Plans Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};