const Leave = require("../models/leave");

// =====================================
// APPLY LEAVE
// =====================================

exports.applyLeave = async (req, res) => {

    try {

        const {
            employee,
            leaveType,
            fromDate,
            toDate,
            reason
        } = req.body;

        const leave =
            await Leave.create({

                employee,
                leaveType,
                fromDate,
                toDate,
                reason

            });

        return res.status(201).json({

            success: true,

            message:
                "Leave Applied Successfully",

            data:
                leave

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
// GET LEAVES
// =====================================

exports.getLeaves = async (req, res) => {

    try {

        const leaves =
            await Leave.find()

                .populate(
                    "employee",
                    "fullName employeeCode role"
                )

                .populate(
                    "approvedBy",
                    "fullName role"
                )

                .sort({
                    createdAt: -1
                });

        return res.status(200).json({

            success: true,

            count:
                leaves.length,

            data:
                leaves

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
// UPDATE LEAVE
// =====================================

exports.updateLeave = async (req, res) => {

    try {

        const leave =
            await Leave.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true
                }

            );

        if (!leave) {

            return res.status(404).json({

                success: false,

                message:
                    "Leave Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Leave Updated Successfully",

            data:
                leave

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
// APPROVE LEAVE
// =====================================

exports.approveLeave = async (req, res) => {

    try {

        const {
            approvedBy
        } = req.body;

        const leave =
            await Leave.findByIdAndUpdate(

                req.params.id,

                {
                    status: "Approved",
                    approvedBy
                },

                {
                    new: true
                }

            );

        if (!leave) {

            return res.status(404).json({

                success: false,

                message:
                    "Leave Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Leave Approved Successfully",

            data:
                leave

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
// REJECT LEAVE
// =====================================

exports.rejectLeave = async (req, res) => {

    try {

        const {
            approvedBy
        } = req.body;

        const leave =
            await Leave.findByIdAndUpdate(

                req.params.id,

                {
                    status: "Rejected",
                    approvedBy
                },

                {
                    new: true
                }

            );

        if (!leave) {

            return res.status(404).json({

                success: false,

                message:
                    "Leave Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Leave Rejected Successfully",

            data:
                leave

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