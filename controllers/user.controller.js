const mongoose = require("mongoose");
const User = require("../models/user");
const cloudinary = require("../cloudinaryconfig");


// ======================================
// GET ALL USERS
// OPTIONAL ROLE FILTER
// ======================================

exports.getAllUsers = async (req, res) => {

    try {

        const {
            role,
            roles
        } = req.query;


        // ======================================
        // BUILD QUERY
        // ======================================

        const query = {

            isDeleted: false

        };


        // ======================================
        // SINGLE ROLE
        // ======================================

        if (role) {

            const allowedRoles = [

                "Admin",
                "SubAdmin",
                "WarehouseManager",
                "SalesManager",
                "Salesman",
                "Accountant",
                "DeliveryBoy",
                "Distributor"

            ];


            if (
                !allowedRoles.includes(role)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid role"

                });

            }


            query.role = role;

        }


        // ======================================
        // MULTIPLE ROLES
        // ======================================

        if (
            roles &&
            !role
        ) {

            const roleList =
                roles
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(
                        item =>
                            item
                    );


            const allowedRoles = [

                "Admin",
                "SubAdmin",
                "WarehouseManager",
                "SalesManager",
                "Salesman",
                "Accountant",
                "DeliveryBoy",
                "Distributor"

            ];


            const invalidRoles =
                roleList.filter(

                    item =>
                        !allowedRoles.includes(
                            item
                        )

                );


            if (
                invalidRoles.length > 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Invalid role(s): ${invalidRoles.join(", ")}`

                });

            }


            if (
                roleList.length > 0
            ) {

                query.role = {
                    $in: roleList
                };

            }

        }


        // ======================================
        // GET USERS
        // ======================================

        const users =
            await User.find(
                query
            )

                // ==================================
                // IMPORTANT:
                // Do not expose password
                // ==================================

                .select(
                    "-password"
                )

                // ==================================
                // Populate Warehouse
                // ==================================

                .populate(
                    "warehouse",
                    "warehouseCode warehouseName warehouseType managerName mobileNumber email address city state pincode isActive"
                )

                // ==================================
                // Populate Distributor
                // ==================================

                .populate(
                    "distributor",
                    "fullName employeeCode mobile distributorName shopName"
                )

                // ==================================
                // Populate Area
                // ==================================

                .populate(
                    "area",
                    "areaName areaCode city district state pincode"
                )

                // ==================================
                // Populate Route
                // ==================================

                .populate(
                    "route",
                    "routeName routeCode"
                )

                // ==================================
                // Populate Reporting Manager
                // ==================================

                .populate(
                    "reportingManager",
                    "fullName employeeCode role"
                )

                // ==================================
                // Populate Approved By
                // ==================================

                .populate(
                    "approvedBy",
                    "fullName employeeCode role"
                )

                .sort({

                    createdAt: -1

                });


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            count:
                users.length,

            filters: {

                role:
                    role || null,

                roles:
                    roles || null

            },

            data:
                users

        });

    }


    catch (error) {

        console.log(
            "Get All Users Error:",
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
// GET USER BY ID
// ======================================

exports.getUserById = async (req, res) => {

    try {

        const { id } = req.params;


        // ======================================
        // VALIDATE USER ID
        // ======================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid User ID"

            });

        }


        // ======================================
        // GET USER
        // ======================================

        const user =
            await User.findOne({

                _id: id,

                isDeleted: false

            })

                // ==================================
                // PASSWORD EXCLUDE
                // ==================================

                .select("-password")


                // ==================================
                // WAREHOUSE
                // ==================================

                .populate(

                    "warehouse",

                    "warehouseCode warehouseName warehouseType managerName mobileNumber email address city state pincode isActive"

                )


                // ==================================
                // AREA
                // ==================================

                .populate(

                    "area"

                )


                // ==================================
                // ROUTE
                // ==================================

                .populate(

                    "route"

                )


                // ==================================
                // REPORTING MANAGER
                // ==================================

                .populate(

                    "reportingManager",

                    "firstName lastName fullName employeeCode mobile email role profileImage"

                )


                // ==================================
                // APPROVED BY
                // ==================================

                .populate(

                    "approvedBy",

                    "firstName lastName fullName employeeCode role"

                );


        // ======================================
        // USER NOT FOUND
        // ======================================

        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            data: user

        });

    }


    catch (error) {

        console.log(

            "Get User By ID Error:",

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
// UPDATE USER
// ======================================

exports.updateUser = async (req, res) => {

    try {

        const { id } = req.params;


        // ======================================
        // BASIC INFO
        // ======================================

        const {
            firstName,
            lastName,
            gender,
            dateOfBirth,

            // ==================================
            // CONTACT
            // ==================================

            mobile,
            alternateMobile,
            email,

            // ==================================
            // LOGIN
            // ==================================

            password,

            // ==================================
            // ROLE
            // ==================================

            role,

            // ==================================
            // ASSIGNMENT
            // ==================================

            warehouse,
            area,
            route,
            reportingManager,

            // ==================================
            // DISTRIBUTOR
            // ==================================

            distributorName,
            shopName,
            gstNumber,
            panNumber,

            // ==================================
            // ADDRESS
            // ==================================

            addressLine1,
            addressLine2,
            city,
            state,
            pincode

        } = req.body;


        // ======================================
        // VALIDATE USER ID
        // ======================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid User ID"

            });

        }


        // ======================================
        // FIND USER
        // ======================================

        const user =
            await User.findOne({

                _id: id,

                isDeleted: false

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User Not Found"

            });

        }


        // ======================================
        // BASIC VALIDATION
        // ======================================

        if (!firstName) {

            return res.status(400).json({

                success: false,

                message:
                    "First Name is required"

            });

        }


        if (!mobile) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile Number is required"

            });

        }


        if (!role) {

            return res.status(400).json({

                success: false,

                message:
                    "Role is required"

            });

        }


        // ======================================
        // ADMIN USER CANNOT BE CHANGED
        // TO / FROM ADMIN
        // ======================================

        if (
            role === "Admin" &&
            user.role !== "Admin"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin Role Assignment Is Not Allowed"

            });

        }


        if (
            user.role === "Admin" &&
            role !== "Admin"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin Role Cannot Be Changed"

            });

        }


        // ======================================
        // CHECK MOBILE DUPLICATE
        // ======================================

        const existingUser =
            await User.findOne({

                mobile,

                isDeleted: false,

                _id: {
                    $ne: id
                }

            });


        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "Mobile Already Exists"

            });

        }


        // ======================================
        // WAREHOUSE MANAGER VALIDATION
        // ======================================

        if (
            role === "WarehouseManager" &&
            !warehouse
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Warehouse is required for Warehouse Manager"

            });

        }


        // ======================================
        // DISTRIBUTOR VALIDATION
        // ======================================

        if (
            role === "Distributor" &&
            !distributorName
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Distributor Name is required"

            });

        }


        if (
            role === "Distributor" &&
            !shopName
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Shop Name is required for Distributor"

            });

        }


        // ======================================
        // PROFILE IMAGE
        // ======================================

        let profileImage =
            user.profileImage || "";


        if (req.file) {

            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        cloudinary.uploader.upload_stream(

                            {
                                folder:
                                    "users"
                            },

                            (
                                error,
                                result
                            ) => {

                                if (error) {

                                    reject(error);

                                }
                                else {

                                    resolve(result);

                                }

                            }

                        ).end(
                            req.file.buffer
                        );

                    }
                );


            profileImage =
                uploadResult.secure_url;

        }


        // ======================================
        // UPDATE COMMON DETAILS
        // ======================================

        user.firstName =
            firstName;

        user.lastName =
            lastName || "";

        user.fullName =
            `${firstName} ${lastName || ""}`.trim();

        user.gender =
            gender || "Male";

        user.dateOfBirth =
            dateOfBirth || null;


        // ======================================
        // CONTACT
        // ======================================

        user.mobile =
            mobile;

        user.alternateMobile =
            alternateMobile || "";

        user.email =
            email || "";


        // ======================================
        // ROLE
        // ======================================

        user.role =
            role;


        // ======================================
        // PROFILE IMAGE
        // ======================================

        user.profileImage =
            profileImage;


        // ======================================
        // WAREHOUSE
        // ======================================

        user.warehouse =
            role === "WarehouseManager"
                ? warehouse
                : null;


        // ======================================
        // AREA
        // ======================================

        user.area =
            (
                role === "WarehouseManager" ||
                role === "SalesManager" ||
                role === "Salesman" ||
                role === "DeliveryBoy"
            )
                ? (
                    area || null
                )
                : null;


        // ======================================
        // ROUTE
        // ======================================

        user.route =
            (
                role === "SalesManager" ||
                role === "Salesman" ||
                role === "DeliveryBoy"
            )
                ? (
                    route || null
                )
                : null;


        // ======================================
        // REPORTING MANAGER
        // ======================================

        user.reportingManager =
            (
                role === "SalesManager" ||
                role === "Salesman" ||
                role === "DeliveryBoy"
            )
                ? (
                    reportingManager || null
                )
                : null;


        // ======================================
        // DISTRIBUTOR DETAILS
        // ======================================

        if (
            role === "Distributor"
        ) {

            user.distributorName =
                distributorName || "";

            user.shopName =
                shopName || "";

            user.gstNumber =
                gstNumber || "";

            user.panNumber =
                panNumber || "";

        }
        else {

            user.distributorName =
                "";

            user.shopName =
                "";

            user.gstNumber =
                "";

            user.panNumber =
                "";

        }


        // ======================================
        // ADDRESS
        // ======================================

        user.addressLine1 =
            addressLine1 || "";

        user.addressLine2 =
            addressLine2 || "";

        user.city =
            city || "";

        user.state =
            state || "";

        user.pincode =
            pincode || "";


        // ======================================
        // PASSWORD
        // ======================================

        if (
            password &&
            password.trim()
        ) {

            user.password =
                await bcrypt.hash(
                    password,
                    10
                );

        }


        // ======================================
        // SAVE
        // ======================================

        await user.save();


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            message:
                "User Updated Successfully",

            data: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                employeeCode:
                    user.employeeCode,

                profileImage:
                    user.profileImage,

                gender:
                    user.gender,

                dateOfBirth:
                    user.dateOfBirth,

                mobile:
                    user.mobile,

                alternateMobile:
                    user.alternateMobile,

                email:
                    user.email,

                role:
                    user.role,

                warehouse:
                    user.warehouse,

                area:
                    user.area,

                route:
                    user.route,

                reportingManager:
                    user.reportingManager,

                distributorName:
                    user.distributorName,

                shopName:
                    user.shopName,

                gstNumber:
                    user.gstNumber,

                panNumber:
                    user.panNumber,

                addressLine1:
                    user.addressLine1,

                addressLine2:
                    user.addressLine2,

                city:
                    user.city,

                state:
                    user.state,

                pincode:
                    user.pincode,

                isApproved:
                    user.isApproved,

                approvedBy:
                    user.approvedBy,

                approvedAt:
                    user.approvedAt,

                status:
                    user.status

            }

        });

    }


    catch (error) {

        console.log(
            "Update User Error:",
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
// DELETE USER
// ======================================

exports.deleteUser = async (req, res) => {

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

        user.isDeleted = true;

        user.status = "Inactive";

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                "User deleted successfully",

            data: {

                id: user._id,

                isDeleted: true,

                status: "Inactive"

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


// ======================================
// GET PROFILE
// ======================================

exports.getProfile = async (req, res) => {

    try {

        const user = await User.findById(
            req.params.id
        ).select("-password");

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }

        return res.status(200).json({

            success: true,

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
// UPDATE PROFILE
// ======================================

exports.updateProfile = async (req, res) => {

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

        let profileImage =
            user.profileImage;

        if (req.file) {

            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        cloudinary.uploader.upload_stream(

                            {
                                folder: "users"
                            },

                            (
                                error,
                                result
                            ) => {

                                if (error)
                                    reject(error);

                                else
                                    resolve(result);

                            }

                        )
                            .end(req.file.buffer);

                    }
                );

            profileImage =
                uploadResult.secure_url;

        }

        const updatedUser =
            await User.findByIdAndUpdate(

                req.params.id,

                {

                    ...req.body,

                    profileImage

                },

                {
                    new: true
                }

            ).select("-password");

        return res.status(200).json({

            success: true,

            message:
                "Profile updated successfully",

            data:
                updatedUser

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ===================================
// UPDATE USER STATUS
// ===================================

exports.updateUserStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatus = [
            "Pending",
            "Active",
            "Inactive",
            "Blocked"
        ];

        if (!allowedStatus.includes(status)) {

            return res.status(400).json({

                success: false,

                message:
                    `Invalid status. Allowed values: ${allowedStatus.join(", ")}`
            });

        }

        const user =
            await User.findOne({

                _id: id,

                isDeleted: false

            });

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }

        // Update status
        user.status = status;

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                "User status updated successfully",

            data: user

        });

    }
    catch (error) {

        console.error(
            "Update User Status Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to update user status",

            error:
                error.message

        });

    }

};