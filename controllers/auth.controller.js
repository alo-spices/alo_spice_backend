const User = require("../models/user");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cloudinary = require("../cloudinaryconfig");



// ======================================
// ADMIN REGISTER
// ======================================

exports.adminRegister = async (req, res) => {

    try {

        const {
            firstName,
            lastName,
            mobile,
            email,
            password
        } = req.body;

        if (!firstName)
            return res.status(400).json({
                success: false,
                message: "First Name is required"
            });

        if (!mobile)
            return res.status(400).json({
                success: false,
                message: "Mobile Number is required"
            });

        if (!password)
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });

        const existingUser =
            await User.findOne({ mobile });

        if (existingUser)
            return res.status(409).json({
                success: false,
                message: "Mobile already exists"
            });

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const admin =
            await User.create({

                firstName,

                lastName,

                fullName:
                    `${firstName} ${lastName || ""}`.trim(),

                mobile,

                email,

                password:
                    hashedPassword,

                role: "Admin",

                isApproved: true,

                status: "Active"

            });

        return res.status(201).json({

            success: true,

            message:
                "Admin Registered Successfully",

            data: admin

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
// ADMIN LOGIN
// ======================================

exports.adminLogin = async (req, res) => {

    try {

        const {
            mobile,
            password
        } = req.body;

        const admin =
            await User.findOne({

                mobile,

                role: "Admin",

                isDeleted: false

            });

        if (!admin) {

            return res.status(404).json({

                success: false,

                message:
                    "Admin Not Found"

            });

        }

        const isMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!isMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid Password"

            });

        }

        const token =
            jwt.sign(

                {
                    id: admin._id,
                    role: admin.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Login Successful",

            token,

            user: {

                id: admin._id,

                fullName:
                    admin.fullName,

                role:
                    admin.role

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
// USER REGISTER
// ======================================

exports.registerUser = async (req, res) => {

    try {

        const {

            // ======================================
            // BASIC INFO
            // ======================================

            firstName,
            lastName,
            gender,
            dateOfBirth,

            // ======================================
            // CONTACT INFO
            // ======================================

            mobile,
            alternateMobile,
            email,

            // ======================================
            // LOGIN
            // ======================================

            password,

            // ======================================
            // ROLE
            // ======================================

            role,

            // ======================================
            // ASSIGNMENT
            // ======================================

            warehouse,
            area,
            route,
            reportingManager,

            // ======================================
            // DISTRIBUTOR DETAILS
            // ======================================

            distributorName,
            shopName,
            gstNumber,
            panNumber,

            // ======================================
            // ADDRESS
            // ======================================

            addressLine1,
            addressLine2,
            city,
            state,
            pincode

        } = req.body;


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


        if (!password) {

            return res.status(400).json({

                success: false,

                message:
                    "Password is required"

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
        // ADMIN REGISTRATION NOT ALLOWED
        // ======================================

        if (role === "Admin") {

            return res.status(400).json({

                success: false,

                message:
                    "Admin Registration Not Allowed"

            });

        }


        // ======================================
        // WAREHOUSE MANAGER
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


        if (
            role === "WarehouseManager" &&
            !area
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Area is required for Warehouse Manager"

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
        // CHECK MOBILE
        // ======================================

        const existingUser =
            await User.findOne({

                mobile,

                isDeleted: false

            });


        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "Mobile Already Exists"

            });

        }


        // ======================================
        // PROFILE IMAGE
        // ======================================

        let profileImage = "";


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
        // HASH PASSWORD
        // ======================================

        const hashedPassword =
            await bcrypt.hash(

                password,

                10

            );


        // ======================================
        // EMPLOYEE CODE
        // ======================================

        const employeeCode =
            "EMP" +
            Date.now()
                .toString()
                .slice(-6);


        // ======================================
        // CREATE USER
        // ======================================

        const user =
            await User.create({

                // ==================================
                // BASIC INFO
                // ==================================

                firstName,

                lastName:
                    lastName || "",

                fullName:
                    `${firstName} ${lastName || ""}`.trim(),

                employeeCode,

                profileImage,

                gender:
                    gender || "Male",

                dateOfBirth:
                    dateOfBirth || null,


                // ==================================
                // CONTACT
                // ==================================

                mobile,

                alternateMobile:
                    alternateMobile || "",

                email:
                    email || "",


                // ==================================
                // LOGIN
                // ==================================

                password:
                    hashedPassword,


                // ==================================
                // ROLE
                // ==================================

                role,


                // ==================================
                // WAREHOUSE
                // ==================================

                warehouse:
                    warehouse || null,


                // ==================================
                // APPROVAL
                // ==================================

                isApproved:
                    false,

                approvedBy:
                    null,

                approvedAt:
                    null,


                // ==================================
                // STATUS
                // ==================================

                status:
                    "Pending",


                // ==================================
                // AREA / ROUTE / MANAGER
                // ==================================

                area:
                    area || null,

                route:
                    route || null,

                reportingManager:
                    reportingManager || null,


                // ==================================
                // DISTRIBUTOR DETAILS
                // ==================================

                distributorName:
                    distributorName || "",

                shopName:
                    shopName || "",

                gstNumber:
                    gstNumber || "",

                panNumber:
                    panNumber || "",


                // ==================================
                // ADDRESS
                // ==================================

                addressLine1:
                    addressLine1 || "",

                addressLine2:
                    addressLine2 || "",

                city:
                    city || "",

                state:
                    state || "",

                pincode:
                    pincode || "",


                // ==================================
                // DEVICE
                // ==================================

                lastLoginAt:
                    null,

                lastLoginIP:
                    "",


                // ==================================
                // SYSTEM
                // ==================================

                isDeleted:
                    false

            });


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(201).json({

            success: true,

            message:
                "Registration Successful. Waiting For Admin Approval.",

            data: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                employeeCode:
                    user.employeeCode,

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

                isApproved:
                    user.isApproved,

                status:
                    user.status

            }

        });

    }


    catch (error) {

        console.log(
            "User Register Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

exports.employeeSelfRegister = async (req, res) => {

    try {

        const {

            firstName,
            lastName,
            mobile,
            email,
            password,
            role

        } = req.body;

        if (!firstName)
            return res.status(400).json({
                success: false,
                message: "First Name is required"
            });

        if (!mobile)
            return res.status(400).json({
                success: false,
                message: "Mobile Number is required"
            });

        if (!password)
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });

        const existingUser = await User.findOne({
            mobile,
            isDeleted: false
        });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Mobile Number Already Exists"
            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        let profileImage = "";

        if (req.file) {

            const uploadResult =
                await new Promise((resolve, reject) => {

                    cloudinary.uploader.upload_stream(

                        {
                            folder: "users"
                        },

                        (error, result) => {

                            if (error) reject(error);

                            else resolve(result);

                        }

                    ).end(req.file.buffer);

                });

            profileImage = uploadResult.secure_url;

        }

        const employeeCode =
            "EMP" + Date.now().toString().slice(-6);

        const user = await User.create({

            firstName,

            lastName,

            fullName:
                `${firstName} ${lastName || ""}`.trim(),

            mobile,

            email,

            password: hashedPassword,

            profileImage,

            employeeCode,

            role,

            status: "Pending",

            isApproved: false

        });

        return res.status(201).json({

            success: true,

            message:
                "Registration Successful. Waiting for Admin Approval.",

            data: user

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

}
// ======================================
// USER LOGIN
// ======================================

// ======================================
// USER LOGIN
// ======================================

exports.loginUser = async (req, res) => {

    try {

        const {
            mobile,
            password,
            role
        } = req.body;


        // ======================================
        // BASIC VALIDATION
        // ======================================

        if (!mobile) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile Number is required"

            });

        }


        if (!password) {

            return res.status(400).json({

                success: false,

                message:
                    "Password is required"

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
        // ADMIN MUST USE ADMIN LOGIN
        // ======================================

        if (role === "Admin") {

            return res.status(400).json({

                success: false,

                message:
                    "Please use Admin Login"

            });

        }


        // ======================================
        // FIND USER
        // ======================================

        const user =
            await User.findOne({

                mobile,

                role,

                isDeleted: false

            })

                .populate(
                    "warehouse",
                    "warehouseCode warehouseName warehouseType"
                )

                .populate(
                    "area"
                );


        // ======================================
        // USER NOT FOUND
        // ======================================

        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "Invalid Mobile Number or Role"

            });

        }


        // ======================================
        // PASSWORD CHECK
        // ======================================

        const isMatch =
            await bcrypt.compare(

                password,

                user.password

            );


        if (!isMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid Password"

            });

        }


        // ======================================
        // APPROVAL CHECK
        // ======================================

        if (!user.isApproved) {

            return res.status(403).json({

                success: false,

                message:
                    "Waiting For Admin Approval"

            });

        }


        // ======================================
        // ACCOUNT STATUS
        // ======================================

        if (
            user.status !== "Active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    `Account Is ${user.status}`

            });

        }


        // ======================================
        // WAREHOUSE MANAGER VALIDATION
        // ======================================

        if (
            user.role === "WarehouseManager" &&
            !user.warehouse
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "No Warehouse Assigned To This User"

            });

        }


        // ======================================
        // WAREHOUSE ACTIVE CHECK
        // ======================================

        if (
            user.role === "WarehouseManager" &&
            user.warehouse
        ) {

            // If populated warehouse exists,
            // check active status.

            const warehouseActive =
                user.warehouse.isActive;

            /*
              Note:

              Current populate fields do not include
              isActive. So if you want this check,
              add isActive to populate fields.
            */

        }


        // ======================================
        // JWT PAYLOAD
        // ======================================

        const tokenPayload = {

            id:
                user._id,

            role:
                user.role,

            warehouseId:
                user.warehouse?._id || null,

            areaId:
                user.area?._id || null

        };


        // ======================================
        // CREATE JWT
        // ======================================

        const token =
            jwt.sign(

                tokenPayload,

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d"
                }

            );


        // ======================================
        // UPDATE LAST LOGIN
        // ======================================

        user.lastLoginAt =
            new Date();

        await user.save();


        // ======================================
        // SUCCESS RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            message:
                "Login Successful",

            token,

            user: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                mobile:
                    user.mobile,

                role:
                    user.role,

                profileImage:
                    user.profileImage,

                warehouse:
                    user.warehouse || null,

                area:
                    user.area || null

            }

        });

    }


    catch (error) {

        console.log(
            "User Login Error:",
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
// ASSIGN USER TO WAREHOUSE / DISTRIBUTOR
// ADMIN
// ======================================


exports.assignUser = async (req, res) => {
    try {

        const { userId } = req.params;
        const {
            assignmentType,
            warehouse,
            distributor
        } = req.body;

        // ==========================================
        // VALIDATE USER ID
        // ==========================================

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        // ==========================================
        // VALIDATE ASSIGNMENT TYPE
        // ==========================================

        if (!["WAREHOUSE", "DISTRIBUTOR"].includes(assignmentType)) {
            return res.status(400).json({
                success: false,
                message: "Assignment type must be WAREHOUSE or DISTRIBUTOR"
            });
        }

        // ==========================================
        // FIND USER
        // ==========================================

        const user = await User.findOne({
            _id: userId,
            isDeleted: false
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // ==========================================
        // WAREHOUSE ASSIGNMENT
        // ==========================================

        if (assignmentType === "WAREHOUSE") {

            if (!warehouse) {
                return res.status(400).json({
                    success: false,
                    message: "Warehouse is required for warehouse assignment"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(warehouse)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid warehouse ID"
                });
            }

            const warehouseExists = await Warehouse.findOne({
                _id: warehouse,
                isDeleted: false
            });

            if (!warehouseExists) {
                return res.status(404).json({
                    success: false,
                    message: "Warehouse not found"
                });
            }

            user.assignmentType = "WAREHOUSE";
            user.warehouse = warehouse;
            user.distributor = null;
        }

        // ==========================================
        // DISTRIBUTOR ASSIGNMENT
        // ==========================================

        if (assignmentType === "DISTRIBUTOR") {

            if (!distributor) {
                return res.status(400).json({
                    success: false,
                    message: "Distributor is required for distributor assignment"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(distributor)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid distributor ID"
                });
            }

            const distributorExists = await User.findOne({
                _id: distributor,
                role: "Distributor",
                isDeleted: false
            });

            if (!distributorExists) {
                return res.status(404).json({
                    success: false,
                    message: "Distributor not found"
                });
            }

            user.assignmentType = "DISTRIBUTOR";
            user.distributor = distributor;
            user.warehouse = null;
        }

        // ==========================================
        // SAVE
        // ==========================================

        await user.save();

        // ==========================================
        // RESPONSE
        // ==========================================

        const updatedUser = await User.findById(user._id)
            .populate("warehouse")
            .populate("distributor", "firstName lastName fullName mobile distributorName shopName");

        return res.status(200).json({
            success: true,
            message: "User assignment updated successfully",
            data: updatedUser
        });

    } catch (error) {

        console.error("Assign User Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user assignment",
            error: error.message
        });
    }
};

// =====================================================
// GET EMPLOYEES BY DISTRIBUTOR
// =====================================================

exports.getEmployeesByDistributor = async (req, res) => {
    try {

        const { distributorId } = req.params;

        // ==========================================
        // VALIDATE DISTRIBUTOR ID
        // ==========================================

        if (!mongoose.Types.ObjectId.isValid(distributorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid distributor ID"
            });
        }

        // ==========================================
        // CHECK DISTRIBUTOR
        // ==========================================

        const distributor = await User.findOne({
            _id: distributorId,
            role: "Distributor",
            isDeleted: false
        }).select(
            "_id firstName lastName fullName employeeCode mobile distributorName shopName"
        );

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: "Distributor not found"
            });
        }

        // ==========================================
        // GET EMPLOYEES
        // ==========================================

        const employees = await User.find({
            distributor: distributorId,
            assignmentType: "DISTRIBUTOR",
            isDeleted: false,

            // Employee roles only
            role: {
                $in: [
                    "SalesManager",
                    "Salesman",
                    "Accountant",
                    "DeliveryBoy"
                ]
            }

        })
            .select(
                "-password -lastLoginIP"
            )
            .sort({
                createdAt: -1
            });

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,
            count: employees.length,

            distributor: distributor,

            data: employees
        });

    } catch (error) {

        console.error(
            "Get Employees By Distributor Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get distributor employees",
            error: error.message
        });
    }
};


// ==========================================
// ADMIN LOGOUT
// ==========================================

exports.adminLogout = async (req, res) => {

    try {

        return res.status(200).json({

            success: true,

            message: "Logout Successful"

        });

    } catch (error) {

        console.error(
            "Admin Logout Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Logout Failed",
            error: error.message

        });

    }

};