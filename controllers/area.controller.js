const Area = require("../models/area");
const Party = require("../models/party");
// ======================================
// CREATE AREA
// ======================================

exports.createArea = async (req, res) => {

    try {

        const {
            areaName,
            areaCode,
            city,
            district,
            state,
            pincode,
            description
        } = req.body;

        if (!areaName) {
            return res.status(400).json({
                success: false,
                message: "Area Name is required"
            });
        }

        if (!areaCode) {
            return res.status(400).json({
                success: false,
                message: "Area Code is required"
            });
        }

        if (!city) {
            return res.status(400).json({
                success: false,
                message: "City is required"
            });
        }

        const existingArea =
            await Area.findOne({
                $or: [
                    { areaName },
                    { areaCode }
                ],
                isDeleted: false
            });

        if (existingArea) {

            return res.status(409).json({

                success: false,

                message:
                    "Area Name or Area Code already exists"

            });

        }

        const area =
            await Area.create(req.body);

        return res.status(201).json({

            success: true,

            message:
                "Area created successfully",

            data: area

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
// GET AREAS
// ======================================

exports.getAreas = async (req, res) => {

    try {

        const areas =
            await Area.find({
                isDeleted: false
            })
                .populate("salesManager", "fullName role")
                .populate("salesmen", "fullName role");

        return res.status(200).json({

            success: true,

            count: areas.length,

            data: areas

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
// GET AREA BY ID
// ======================================

exports.getAreaById = async (req, res) => {

    try {

        const area =
            await Area.findById(
                req.params.id
            )
                .populate("salesManager")
                .populate("salesmen");

        if (!area) {

            return res.status(404).json({

                success: false,

                message:
                    "Area not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: area

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
// UPDATE AREA
// ======================================

exports.updateArea = async (req, res) => {

    try {

        const area =
            await Area.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true
                }

            );

        if (!area) {

            return res.status(404).json({

                success: false,

                message:
                    "Area not found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Area updated successfully",

            data: area

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
// ======================================
// DELETE AREA
// ======================================

exports.deleteArea = async (req, res) => {

    try {

        const area =
            await Area.findById(
                req.params.id
            );

        if (!area) {

            return res.status(404).json({

                success: false,

                message:
                    "Area not found"

            });

        }

        area.isDeleted = true;

        area.status = "Inactive";

        await area.save();

        return res.status(200).json({

            success: true,

            message:
                "Area deleted successfully"

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


exports.getAreaShops = async (req, res) => {

    try {

        const shops = await Party.find({

            area: req.params.areaId,

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

exports.searchShops = async (req, res) => {

    try {

        const keyword = req.query.keyword || "";

        const shops = await Party.find({

            isDeleted: false,

            status: "Active",

            $or: [

                {

                    shopName: {

                        $regex: keyword,

                        $options: "i"

                    }

                },

                {

                    ownerName: {

                        $regex: keyword,

                        $options: "i"

                    }

                },

                {

                    mobile: {

                        $regex: keyword,

                        $options: "i"

                    }

                }

            ]

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

exports.getNearbyShops = async (req, res) => {

    try {

        const {

            latitude,

            longitude

        } = req.query;

        const shops = await Party.find({

            status: "Active",

            isDeleted: false

        });

        const nearby = shops.filter(shop => {

            if (!shop.latitude || !shop.longitude)

                return false;

            const distance = Math.sqrt(

                Math.pow(shop.latitude - latitude, 2)

                +

                Math.pow(shop.longitude - longitude, 2)

            );

            return distance <= 0.02;

        });

        return res.status(200).json({

            success: true,

            count: nearby.length,

            data: nearby

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getShopHistory = async (req, res) => {

    try {

        const shopId = req.params.shopId;

        const lastVisit = await Visit

            .findOne({

                party: shopId

            })

            .sort({

                createdAt: -1

            });

        const lastOrder = await Order

            .findOne({

                party: shopId

            })

            .sort({

                createdAt: -1

            });

        const lastCollection = await Collection

            .findOne({

                party: shopId

            })

            .sort({

                createdAt: -1

            });

        return res.status(200).json({

            success: true,

            data: {

                lastVisit,

                lastOrder,

                lastCollection

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