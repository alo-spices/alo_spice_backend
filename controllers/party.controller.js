const Party = require("../models/party");
const Area = require("../models/area");
const Route = require("../models/routes");
const User = require("../models/user");
const cloudinary = require("../cloudinaryconfig");
// ======================================
// CREATE PARTY
// ======================================

exports.createParty = async (req, res) => {

    try {

        const {
            partyType,
            shopName,
            mobile,
            area,
            route
        } = req.body;

        // ===============================
        // VALIDATIONS
        // ===============================

        if (!partyType) {
            return res.status(400).json({
                success: false,
                message: "Party Type is required"
            });
        }

        if (!shopName) {
            return res.status(400).json({
                success: false,
                message: "Shop Name is required"
            });
        }

        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: "Mobile Number is required"
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

        // ===============================
        // DUPLICATE MOBILE CHECK
        // ===============================

        const existingMobile = await Party.findOne({
            mobile,
            isDeleted: false
        });

        if (existingMobile) {
            return res.status(409).json({
                success: false,
                message: "Mobile Number already exists"
            });
        }

        // ===============================
        // AREA VALIDATION
        // ===============================

        const areaExists = await Area.findById(area);

        if (!areaExists) {
            return res.status(404).json({
                success: false,
                message: "Area not found"
            });
        }

        // ===============================
        // ROUTE VALIDATION
        // ===============================

        const routeExists = await Route.findById(route);

        if (!routeExists) {
            return res.status(404).json({
                success: false,
                message: "Route not found"
            });
        }

        // ===============================
        // PARTY NAME AUTO
        // ===============================

        const partyName = shopName;

        // ===============================
        // PARTY CODE GENERATION
        // ===============================

        let prefix = "";

        switch (partyType) {

            case "Retailer":
                prefix = "RET";
                break;

            case "Wholesaler":
                prefix = "WH";
                break;

            case "Distributor":
                prefix = "DST";
                break;

            default:
                prefix = "PTY";
        }

        const lastParty = await Party.findOne({
            partyCode: new RegExp("^" + prefix)
        }).sort({ createdAt: -1 });

        let nextNumber = 1;

        if (lastParty) {

            const lastNumber = parseInt(
                lastParty.partyCode.replace(prefix, "")
            );

            nextNumber = lastNumber + 1;
        }

        const partyCode =
            prefix +
            nextNumber
                .toString()
                .padStart(6, "0");

        // ===============================
        // CLOUDINARY IMAGE UPLOAD
        // ===============================

        let shopImage = "";

        if (req.file) {

            const imageResult = await new Promise((resolve, reject) => {

                cloudinary.uploader.upload_stream(

                    {
                        folder: "party-images",
                        resource_type: "image"
                    },

                    (error, result) => {

                        if (error)
                            reject(error);
                        else
                            resolve(result);

                    }

                ).end(req.file.buffer);

            });

            shopImage = imageResult.secure_url;

        }


        // ===============================
        // SAVE
        // ===============================

        const party = await Party.create({

            ...req.body,

            partyName,

            partyCode,

            shopImage

        });

        return res.status(201).json({

            success: true,

            message: "Party created successfully",

            data: party

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
// GET PARTIES
// ======================================

exports.getParties = async (req, res) => {

    try {

        const parties =
            await Party.find({

                isDeleted: false

            })

                .populate(
                    "area",
                    "areaName"
                )

                .populate(
                    "route",
                    "routeName"
                )

                .populate(
                    "assignedSalesman",
                    "fullName"
                );

        return res.status(200).json({

            success: true,

            count: parties.length,

            data: parties

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getShopsByRoute = async (req, res) => {

    try {

        const { routeId } = req.params;

        if (!routeId) {
            return res.status(400).json({
                success: false,
                message: "Route ID is required"
            });
        }

        const shops = await Party.find({
            route: routeId,
            isDeleted: false,
            status: "Active"
        })
            .select(
                "_id partyCode partyName shopName mobile area route"
            )
            .sort({
                shopName: 1
            });

        return res.status(200).json({

            success: true,

            count: shops.length,

            data: shops

        });

    } catch (error) {

        console.error(
            "Get Shops By Route Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// GET PARTY BY ID
// ======================================

exports.getPartyById = async (req, res) => {

    try {

        const party =
            await Party.findOne({

                _id: req.params.id,

                isDeleted: false

            })

                .populate("area")
                .populate("route")
                .populate("assignedSalesman");

        if (!party) {

            return res.status(404).json({

                success: false,

                message: "Party not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: party

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
// UPDATE PARTY
// ======================================

exports.updateParty = async (req, res) => {

    try {

        const party =
            await Party.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true
                }

            );

        if (!party) {

            return res.status(404).json({

                success: false,

                message: "Party not found"

            });

        }

        return res.status(200).json({

            success: true,

            message: "Party updated successfully",

            data: party

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
// DELETE PARTY
// ======================================

exports.deleteParty = async (req, res) => {

    try {

        const party =
            await Party.findById(
                req.params.id
            );

        if (!party) {

            return res.status(404).json({

                success: false,

                message: "Party not found"

            });

        }

        party.isDeleted = true;

        party.status = "Inactive";

        await party.save();

        return res.status(200).json({

            success: true,

            message: "Party deleted successfully"

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};