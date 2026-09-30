const User = require("../models/user");

// ======================================
// GET PENDING USERS
// ======================================

exports.getPendingUsers = async (req, res) => {

    try {

        const users = await User.find({

            isApproved: false,

            status: "Pending",

            isDeleted: false

        })
            .select("-password");

        return res.status(200).json({

            success: true,

            count: users.length,

            data: users

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
// APPROVE USER
// ======================================

exports.approveUser = async (req, res) => {

    try {

        const user = await User.findById(
            req.params.id
        );

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }

        user.isApproved = true;

        user.status = "Active";

        user.approvedAt = new Date();

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                `${user.role} approved successfully`,

            data: user

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
// REJECT USER
// ======================================

exports.rejectUser = async (req, res) => {

    try {

        const user =
            await User.findById(
                req.params.id
            );

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }

        user.status = "Inactive";

        user.isApproved = false;

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                `${user.role} rejected successfully`

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
// CHANGE STATUS
// ======================================

exports.changeStatus = async (req, res) => {

    try {

        const { status } = req.body;

        const allowedStatus = [
            "Active",
            "Inactive",
            "Pending",
            "Blocked"
        ];


        // ==========================================
        // VALIDATE STATUS
        // ==========================================

        if (!allowedStatus.includes(status)) {

            return res.status(400).json({

                success: false,

                message: "Invalid status"

            });

        }


        // ==========================================
        // GET USER
        // ==========================================

        const user = await User.findById(
            req.params.id
        );


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }


        // ==========================================
        // UPDATE STATUS
        // ==========================================

        user.status = status;


        // ==========================================
        // ACTIVE = APPROVED
        // ==========================================

        if (status === "Active") {

            user.isApproved = true;

            // Logged-in Admin / SubAdmin
            user.approvedBy =
                req.user?._id ||
                req.user?.id ||
                null;

            user.approvedAt = new Date();

        }


        // ==========================================
        // ALL OTHER STATUS = NOT APPROVED
        // ==========================================

        else {

            user.isApproved = false;

            user.approvedBy = null;

            user.approvedAt = null;

        }


        // ==========================================
        // SAVE
        // ==========================================

        await user.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                `User status changed to ${status}`,

            data: {

                id: user._id,

                status: user.status,

                isApproved:
                    user.isApproved,

                approvedBy:
                    user.approvedBy,

                approvedAt:
                    user.approvedAt

            }

        });


    }

    catch (error) {

        console.error(
            "Change User Status Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};