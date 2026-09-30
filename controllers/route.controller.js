const Route = require("../models/routes");
const Area = require("../models/area");

// ======================================
// CREATE ROUTE
// ======================================

exports.createRoute = async (req, res) => {

    try {

        const {
            routeName,
            routeCode,
            area,
            description,
            monthlySalesTarget,
            monthlyCollectionTarget
        } = req.body;

        if (!routeName) {
            return res.status(400).json({
                success: false,
                message: "Route Name is required"
            });
        }

        if (!routeCode) {
            return res.status(400).json({
                success: false,
                message: "Route Code is required"
            });
        }

        if (!area) {
            return res.status(400).json({
                success: false,
                message: "Area is required"
            });
        }

        const areaExists =
            await Area.findById(area);

        if (!areaExists) {
            return res.status(404).json({
                success: false,
                message: "Area not found"
            });
        }

        const existingRoute =
            await Route.findOne({
                routeCode,
                isDeleted: false
            });

        if (existingRoute) {
            return res.status(409).json({
                success: false,
                message: "Route Code already exists"
            });
        }

        const route =
            await Route.create({

                routeName,
                routeCode,
                area,
                description,
                monthlySalesTarget,
                monthlyCollectionTarget

            });

        return res.status(201).json({

            success: true,

            message: "Route created successfully",

            data: route

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
// GET ROUTES
// ======================================

exports.getRoutes = async (req, res) => {

    try {

        const routes =
            await Route.find({

                isDeleted: false

            })

                .populate(
                    "area",
                    "areaName areaCode"
                )

                .populate(
                    "salesManager",
                    "fullName"
                )

                .populate(
                    "salesmen",
                    "fullName"
                )

                .populate(
                    "distributor",
                    "fullName"
                );

        return res.status(200).json({

            success: true,

            count: routes.length,

            data: routes

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
// GET ROUTE BY ID
// ======================================

exports.getRouteById = async (req, res) => {

    try {

        const route =
            await Route.findOne({

                _id: req.params.id,

                isDeleted: false

            })

                .populate("area")
                .populate("salesManager")
                .populate("salesmen")
                .populate("distributor");

        if (!route) {

            return res.status(404).json({

                success: false,

                message: "Route not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: route

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
// UPDATE ROUTE
// ======================================

exports.updateRoute = async (req, res) => {

    try {

        const route =
            await Route.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true
                }

            );

        if (!route) {

            return res.status(404).json({

                success: false,

                message: "Route not found"

            });

        }

        return res.status(200).json({

            success: true,

            message: "Route updated successfully",

            data: route

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
// DELETE ROUTE
// ======================================

exports.deleteRoute = async (req, res) => {

    try {

        const route =
            await Route.findById(
                req.params.id
            );

        if (!route) {

            return res.status(404).json({

                success: false,

                message: "Route not found"

            });

        }

        route.isDeleted = true;

        route.status = "Inactive";

        await route.save();

        return res.status(200).json({

            success: true,

            message: "Route deleted successfully"

        });

    }
    catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


exports.getRouteSummary = async (req, res) => {

    try {

        const totalShops = await Party.countDocuments({

            route: req.params.routeId,

            isDeleted: false

        });

        const visits = await Visit.countDocuments({

            route: req.params.routeId

        });

        const orders = await Order.countDocuments({

            route: req.params.routeId

        });

        const collections = await Collection.aggregate([

            {
                $lookup: {

                    from: "parties",

                    localField: "party",

                    foreignField: "_id",

                    as: "party"

                }

            }

        ]);

        return res.status(200).json({

            success: true,

            data: {

                totalShops,

                visits,

                orders,

                collections: collections.length

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
