const Visit = require("../models/visit");
const Party = require("../models/party");
const User = require("../models/user");
const cloudinary = require("../cloudinaryconfig");

// ======================================
// GET VISITS
// ======================================

exports.getVisits = async (req, res) => {

    try {

        const visits =
            await Visit.find({

                isDeleted: false

            })

                .populate(
                    "employee",
                    "fullName employeeCode role"
                )

                .populate(
                    "party",
                    "partyName shopName mobile"
                )

                .populate(
                    "area",
                    "areaName"
                )

                .populate(
                    "route",
                    "routeName"
                )

                .sort({
                    createdAt: -1
                });

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
// GET VISIT BY ID
// ======================================

exports.getVisitById = async (req, res) => {

    try {

        const visit =
            await Visit.findOne({

                _id: req.params.id,

                isDeleted: false

            })

                .populate("employee")

                .populate("party")

                .populate("area")

                .populate("route");

        if (!visit) {

            return res.status(404).json({

                success: false,

                message: "Visit not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: visit

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.startVisit = async (req, res) => {

    try {

        const {
            employee,
            party,
            beat,
            area,
            route
        } = req.body;


        // =====================================
        // VALIDATION
        // =====================================

        if (!employee) {

            return res.status(400).json({
                success: false,
                message: "Employee is required"
            });

        }


        if (!party) {

            return res.status(400).json({
                success: false,
                message: "Party is required"
            });

        }


        // =====================================
        // CHECK EMPLOYEE ACTIVE VISIT
        // ONLY "Started" IS ACTIVE
        // =====================================

        const existingVisit = await Visit.findOne({

            employee: employee,

            visitStatus: "Started",

            isDeleted: false

        })
            .populate(
                "party",
                "shopName partyName partyCode ownerName mobile"
            );


        // =====================================
        // ALREADY VISITING ANOTHER SHOP
        // =====================================

        if (existingVisit) {

            const activeShop =
                existingVisit.party?.shopName ||
                existingVisit.party?.partyName ||
                "another outlet";


            // Same shop
            if (
                String(existingVisit.party?._id) ===
                String(party)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "You are already visiting this outlet. Please complete or mark this visit as pending.",

                    data: existingVisit

                });

            }


            // Different shop
            return res.status(400).json({

                success: false,

                message:
                    `You already have an active visit at ${activeShop}. Please complete or mark that visit as pending before starting a new visit.`,

                data: existingVisit

            });

        }


        // =====================================
        // CREATE VISIT
        // =====================================

        const visit = await Visit.create({

            employee,

            party,

            beat,

            area,

            route,

            visitStartTime: new Date(),

            visitStatus: "Started",

            isDeleted: false

        });


        // =====================================
        // POPULATE RESPONSE
        // =====================================

        const populatedVisit =
            await Visit.findById(visit._id)

                .populate(
                    "employee",
                    "fullName employeeCode mobile"
                )

                .populate(
                    "party",
                    "partyName shopName partyCode ownerName mobile"
                )

                .populate(
                    "area",
                    "areaName"
                )

                .populate(
                    "route",
                    "routeName"
                );


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(201).json({

            success: true,

            message:
                "Visit started successfully",

            data: populatedVisit

        });

    }

    catch (error) {

        console.error(
            "Start Visit Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.cancelVisit = async (req, res) => {

    try {

        const visit =
            await Visit.findOne({

                _id: req.params.id,

                isDeleted: false

            });


        if (!visit) {

            return res.status(404).json({

                success: false,

                message:
                    "Visit not found"

            });

        }


        if (
            visit.visitStatus !== "Started"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Visit is already ${visit.visitStatus}`

            });

        }


        visit.visitStatus =
            "Cancelled";

        visit.visitEndTime =
            new Date();

        visit.notes =
            req.body.notes || "";


        await visit.save();


        return res.status(200).json({

            success: true,

            message:
                "Visit cancelled successfully",

            data: visit

        });

    }

    catch (error) {

        console.error(
            "Cancel Visit Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.getTodayVisits = async (req, res) => {

    try {

        const today =
            new Date();

        today.setHours(
            0, 0, 0, 0
        );

        const visits =
            await Visit.find({

                employee:
                    req.params.employeeId,

                createdAt: {

                    $gte:
                        today

                }

            });

        return res.status(200).json({

            success: true,

            count:
                visits.length,

            data:
                visits

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
exports.getVisitSummary = async (req, res) => {

    try {

        const visits =
            await Visit.find({

                employee:
                    req.params.employeeId,

                isDeleted:
                    false

            });

        const totalVisits =
            visits.length;

        const completedVisits =
            visits.filter(

                x =>
                    x.visitStatus ===
                    "Completed"

            ).length;

        const totalOrders =
            visits.reduce(

                (sum, item) =>

                    sum +
                    item.orderCount,

                0

            );

        const totalCollections =
            visits.reduce(

                (sum, item) =>

                    sum +
                    item.collectionAmount,

                0

            );

        return res.status(200).json({

            success: true,

            data: {

                totalVisits,

                completedVisits,

                totalOrders,

                totalCollections

            }

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }


};

exports.getEmployeeVisits = async (req, res) => {

    try {

        const { employeeId } = req.params;

        const { type = "today" } = req.query;

        if (!employeeId) {

            return res.status(400).json({

                success: false,

                message: "Employee Id is required"

            });

        }

        const employeeExists = await User.findById(employeeId);

        if (!employeeExists) {

            return res.status(404).json({

                success: false,

                message: "Employee not found"

            });

        }

        const today = new Date();

        let fromDate = new Date();

        let message = "";

        switch (type) {

            case "today":

                fromDate.setHours(0, 0, 0, 0);

                message = "Today's visits found";

                break;

            case "week":

                fromDate.setDate(today.getDate() - 7);

                message = "Week visits found";

                break;

            case "month":

                fromDate.setMonth(today.getMonth() - 1);

                message = "Month visits found";

                break;

            case "year":

                fromDate.setFullYear(today.getFullYear() - 1);

                message = "Year visits found";

                break;

            default:

                fromDate.setHours(0, 0, 0, 0);

                message = "Today's visits found";

        }

        const visits = await Visit.find({

            employee: employeeId,

            createdAt: {

                $gte: fromDate,

                $lte: today

            },

            isDeleted: false

        })

            .populate(

                "party",

                "partyName shopName ownerName mobile address city"

            )

            .sort({

                createdAt: -1

            });

        return res.status(200).json({

            success: true,

            message,

            totalVisits: visits.length,

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

exports.checkActiveVisit = async (req, res) => {

    try {

        const {
            employeeId,
            partyId
        } = req.params;


        const visit = await Visit.findOne({

            employee: employeeId,

            party: partyId,

            visitStatus: "Started",

            isDeleted: false

        })

            .populate(
                "party",
                "partyCode partyName shopName ownerName mobile"
            )

            .populate(
                "area",
                "areaName"
            )

            .populate(
                "route",
                "routeName"
            )

            .sort({
                visitStartTime: -1
            });


        // =====================================
        // NO ACTIVE VISIT
        // =====================================

        if (!visit) {

            return res.status(200).json({

                success: true,

                hasActiveVisit: false,

                message:
                    "No active visit found",

                data: null

            });

        }


        // =====================================
        // ACTIVE VISIT FOUND
        // =====================================

        return res.status(200).json({

            success: true,

            hasActiveVisit: true,

            message:
                "Active visit found",

            data: visit

        });

    }

    catch (error) {

        console.error(
            "Check Active Visit Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.checkActiveEmployeeVisit = async (req, res) => {

    try {

        const {
            employeeId
        } = req.params;


        if (!employeeId) {

            return res.status(400).json({

                success: false,

                message:
                    "Employee ID is required"

            });

        }


        // =====================================
        // FIND CURRENT ACTIVE VISIT
        // =====================================

        const visit = await Visit.findOne({

            employee: employeeId,

            visitStatus: "Started",

            isDeleted: false

        })

            .populate(
                "party",
                "partyCode partyName shopName ownerName mobile"
            )

            .populate(
                "area",
                "areaName"
            )

            .populate(
                "route",
                "routeName"
            )

            .sort({

                visitStartTime: -1

            });


        // =====================================
        // NO ACTIVE VISIT
        // =====================================

        if (!visit) {

            return res.status(200).json({

                success: true,

                hasActiveVisit: false,

                data: null

            });

        }


        // =====================================
        // ACTIVE VISIT
        // =====================================

        return res.status(200).json({

            success: true,

            hasActiveVisit: true,

            message:
                "Employee already has an active visit",

            data: visit

        });

    }

    catch (error) {

        console.error(
            "Check Active Employee Visit Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// COMPLETE VISIT
// ======================================

exports.completeVisit = async (req, res) => {

    try {

        const visit =
            await Visit.findOne({

                _id: req.params.id,

                isDeleted: false

            });


        if (!visit) {

            return res.status(404).json({

                success: false,

                message:
                    "Visit not found"

            });

        }


        // =====================================
        // ALREADY CLOSED
        // =====================================

        if (
            visit.visitStatus === "Completed" ||
            visit.visitStatus === "Pending" ||
            visit.visitStatus === "Cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Visit is already ${visit.visitStatus}`

            });

        }


        // =====================================
        // END TIME
        // =====================================

        const visitEndTime = new Date();


        const duration =
            visit.visitStartTime
                ? Math.floor(
                    (
                        visitEndTime -
                        visit.visitStartTime
                    ) / 60000
                )
                : 0;


        // =====================================
        // UPDATE
        // =====================================

        visit.visitEndTime =
            visitEndTime;

        visit.endLatitude =
            req.body.endLatitude ?? null;

        visit.endLongitude =
            req.body.endLongitude ?? null;

        visit.endAddress =
            req.body.endAddress || "";

        visit.visitDurationMinutes =
            duration;

        visit.orderCreated =
            req.body.orderCreated === true ||
            req.body.orderCreated === "true";

        visit.orderCount =
            Number(
                req.body.orderCount || 0
            );

        visit.orderAmount =
            Number(
                req.body.orderAmount || 0
            );

        visit.collectionDone =
            req.body.collectionDone === true ||
            req.body.collectionDone === "true";

        visit.collectionAmount =
            Number(
                req.body.collectionAmount || 0
            );

        visit.visitOutcome =
            req.body.visitOutcome ||
            "No Order";

        visit.notes =
            req.body.notes || "";

        visit.nextFollowUpDate =
            req.body.nextFollowUpDate ||
            null;


        // =====================================
        // STATUS
        // =====================================

        visit.visitStatus =
            "Completed";


        await visit.save();


        return res.status(200).json({

            success: true,

            message:
                "Visit completed successfully",

            data: visit

        });

    }

    catch (error) {

        console.error(
            "Complete Visit Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.pendingVisit = async (req, res) => {

    try {

        const visit =
            await Visit.findOne({

                _id: req.params.id,

                isDeleted: false

            });


        if (!visit) {

            return res.status(404).json({

                success: false,

                message:
                    "Visit not found"

            });

        }


        // =====================================
        // ONLY ACTIVE VISIT CAN BE MARKED PENDING
        // =====================================

        if (
            visit.visitStatus !== "Started"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Visit cannot be marked pending because it is already ${visit.visitStatus}`

            });

        }


        const visitEndTime =
            new Date();


        const duration =
            visit.visitStartTime
                ? Math.floor(
                    (
                        visitEndTime -
                        visit.visitStartTime
                    ) / 60000
                )
                : 0;


        // =====================================
        // UPDATE VISIT
        // =====================================

        visit.visitEndTime =
            visitEndTime;

        visit.endLatitude =
            req.body.endLatitude ?? null;

        visit.endLongitude =
            req.body.endLongitude ?? null;

        visit.endAddress =
            req.body.endAddress || "";

        visit.visitDurationMinutes =
            duration;

        visit.visitOutcome =
            req.body.visitOutcome ||
            "Follow Up Required";

        visit.notes =
            req.body.notes || "";


        // =====================================
        // CLOSE AS PENDING
        // =====================================

        visit.visitStatus =
            "Pending";


        await visit.save();


        return res.status(200).json({

            success: true,

            message:
                "Visit marked as pending successfully",

            data: visit

        });

    }

    catch (error) {

        console.error(
            "Pending Visit Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};