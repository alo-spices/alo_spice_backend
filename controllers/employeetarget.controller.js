const EmployeeTarget = require("../models/employee-target");

// =====================================
// CREATE TARGET
// =====================================

exports.createTarget = async (req, res) => {

    try {

        const target =
            await EmployeeTarget.create(
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Target Created Successfully",

            data:
                target

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

// =====================================
// GET TARGETS
// =====================================

exports.getTargets = async (req, res) => {

    try {

        const targets =
            await EmployeeTarget.find()

                .populate(
                    "employee",
                    "fullName employeeCode role"
                );

        return res.status(200).json({

            success: true,

            count:
                targets.length,

            data:
                targets

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

// =====================================
// UPDATE TARGET
// =====================================

exports.updateTarget = async (req, res) => {

    try {

        const target =
            await EmployeeTarget.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true
                }

            );

        if (!target) {

            return res.status(404).json({

                success: false,

                message:
                    "Target Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Target Updated Successfully",

            data:
                target

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

// =====================================
// DELETE TARGET
// =====================================

exports.deleteTarget = async (req, res) => {

    try {

        const target =
            await EmployeeTarget.findByIdAndDelete(
                req.params.id
            );

        if (!target) {

            return res.status(404).json({

                success: false,

                message:
                    "Target Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Target Deleted Successfully"

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

// =====================================
// ASSIGN TARGET
// =====================================

exports.assignTarget = async (req, res) => {

    try {

        const target =
            await EmployeeTarget.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Target Assigned Successfully",

            data:
                target

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

// =====================================
// GET ACHIEVEMENT
// =====================================

exports.getAchievement = async (req, res) => {

    try {

        const target =
            await EmployeeTarget.findById(
                req.params.id
            )

                .populate(
                    "employee",
                    "fullName employeeCode"
                );

        if (!target) {

            return res.status(404).json({

                success: false,

                message:
                    "Target Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            data: {

                employee:
                    target.employee,

                salesTarget:
                    target.salesTarget,

                achievedSales:
                    target.achievedSales,

                collectionTarget:
                    target.collectionTarget,

                achievedCollection:
                    target.achievedCollection,

                visitTarget:
                    target.visitTarget,

                achievedVisits:
                    target.achievedVisits

            }

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

// =====================================
// TARGET SUMMARY
// =====================================

exports.getTargetSummary = async (req, res) => {

    try {

        const targets =
            await EmployeeTarget.find();

        const totalSalesTarget =
            targets.reduce(
                (sum, item) =>
                    sum + item.salesTarget,
                0
            );

        const totalSalesAchieved =
            targets.reduce(
                (sum, item) =>
                    sum + item.achievedSales,
                0
            );

        const totalCollectionTarget =
            targets.reduce(
                (sum, item) =>
                    sum + item.collectionTarget,
                0
            );

        const totalCollectionAchieved =
            targets.reduce(
                (sum, item) =>
                    sum + item.achievedCollection,
                0
            );

        return res.status(200).json({

            success: true,

            data: {

                totalSalesTarget,

                totalSalesAchieved,

                totalCollectionTarget,

                totalCollectionAchieved

            }

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