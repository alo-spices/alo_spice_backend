const mongoose = require("mongoose");
const Attendance = require("../models/attendence");
const User = require("../models/user");
const Order = require("../models/order");
const cloudinary = require("../cloudinaryconfig");

// ======================================
// CREATE ATTENDANCE
// ======================================

exports.createAttendance = async (req, res) => {

    try {

        const {

            employee,
            attendanceDate,
            checkInLatitude,
            checkInLongitude,
            checkInAddress

        } = req.body;

        if (!employee) {

            return res.status(400).json({

                success: false,

                message: "Employee is required"

            });

        }

        const employeeExists =
            await User.findById(employee);

        if (!employeeExists) {

            return res.status(404).json({

                success: false,

                message: "Employee not found"

            });

        }

        const today =
            new Date(attendanceDate);

        today.setHours(0, 0, 0, 0);

        const alreadyMarked =
            await Attendance.findOne({

                employee,

                attendanceDate: {

                    $gte: today,

                    $lt: new Date(
                        today.getTime() +
                        24 * 60 * 60 * 1000
                    )

                },

                isDeleted: false

            });

        if (alreadyMarked) {

            return res.status(409).json({

                success: false,

                message:
                    "Attendance already marked for today"

            });

        }

        let checkInSelfie = "";

        if (req.file) {

            const result =
                await new Promise(
                    (resolve, reject) => {

                        cloudinary.uploader.upload_stream(

                            {
                                folder:
                                    "attendance/checkin"
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

            checkInSelfie =
                result.secure_url;

        }

        const attendance =
            await Attendance.create({

                employee,

                attendanceDate,

                checkInTime:
                    new Date(),

                checkInLatitude,

                checkInLongitude,

                checkInAddress,

                checkInSelfie,

                attendanceStatus:
                    "Present",

                status:
                    "CheckedIn"

            });

        return res.status(201).json({

            success: true,

            message:
                "Attendance marked successfully",

            data:
                attendance

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
// GET ATTENDANCES
// ======================================

// ======================================
// GET ATTENDANCES
// OPTIONAL FILTERS
// employeeId
// fromDate
// toDate
// ======================================

exports.getAttendances = async (req, res) => {

    try {

        const {
            employeeId,
            fromDate,
            toDate
        } = req.query;


        // ======================================
        // BUILD QUERY
        // ======================================

        const query = {

            isDeleted: false

        };


        // ======================================
        // EMPLOYEE FILTER
        // ======================================

        if (employeeId) {

            if (
                !mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid Employee ID"

                });

            }


            query.employee =
                employeeId;

        }


        // ======================================
        // DATE FILTER
        // ======================================

        if (
            fromDate ||
            toDate
        ) {

            query.attendanceDate = {};


            // ==================================
            // FROM DATE
            // ==================================

            if (fromDate) {

                const startDate =
                    new Date(fromDate);


                if (
                    isNaN(
                        startDate.getTime()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid From Date"

                    });

                }


                // Start of day
                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );


                query.attendanceDate.$gte =
                    startDate;

            }


            // ==================================
            // TO DATE
            // ==================================

            if (toDate) {

                const endDate =
                    new Date(toDate);


                if (
                    isNaN(
                        endDate.getTime()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid To Date"

                    });

                }


                // End of day
                endDate.setHours(
                    23,
                    59,
                    59,
                    999
                );


                query.attendanceDate.$lte =
                    endDate;

            }

        }


        // ======================================
        // VALIDATE DATE RANGE
        // ======================================

        if (
            fromDate &&
            toDate
        ) {

            const start =
                new Date(fromDate);


            const end =
                new Date(toDate);


            if (
                start > end
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "From Date cannot be greater than To Date"

                });

            }

        }


        // ======================================
        // GET ATTENDANCES
        // ======================================

        const attendances =
            await Attendance.find(
                query
            )

                .populate(
                    "employee",
                    "fullName employeeCode role mobile"
                )

                .sort({

                    attendanceDate: -1

                });


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            count:
                attendances.length,

            filters: {

                employeeId:
                    employeeId || null,

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null

            },

            data:
                attendances

        });

    }


    catch (error) {

        console.log(
            "Get Attendances Error:",
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
// GET ATTENDANCE BY ID
// ======================================

exports.getAttendanceById = async (req, res) => {

    try {

        const attendance =
            await Attendance.findOne({

                _id: req.params.id,

                isDeleted: false

            })

                .populate(
                    "employee",
                    "fullName employeeCode role mobile email"
                );

        if (!attendance) {

            return res.status(404).json({

                success: false,

                message: "Attendance not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: attendance

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
// CHECK IN
// ======================================

exports.checkIn = async (req, res) => {

    try {

        const {
            employee,
            checkInLatitude,
            checkInLongitude,
            checkInAddress
        } = req.body;

        if (!employee) {

            return res.status(400).json({

                success: false,
                message: "Employee is required"

            });

        }

        const employeeExists =
            await User.findById(employee);

        if (!employeeExists) {

            return res.status(404).json({

                success: false,
                message: "Employee not found"

            });

        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const alreadyCheckedIn =
            await Attendance.findOne({

                employee,

                attendanceDate: {

                    $gte: today,

                    $lt: new Date(
                        today.getTime() +
                        24 * 60 * 60 * 1000
                    )

                },

                isDeleted: false

            });

        if (alreadyCheckedIn) {

            return res.status(409).json({

                success: false,

                message: "Already Checked In Today"

            });

        }

        let selfie = "";

        if (req.file) {

            const result =
                await new Promise((resolve, reject) => {

                    cloudinary.uploader.upload_stream(

                        {
                            folder: "attendance/checkin"
                        },

                        (error, result) => {

                            if (error)
                                reject(error);

                            else
                                resolve(result);

                        }

                    ).end(req.file.buffer);

                });

            selfie = result.secure_url;

        }

        const attendance =
            await Attendance.create({

                employee,

                attendanceDate: new Date(),

                checkInTime: new Date(),

                checkInLatitude,

                checkInLongitude,

                checkInAddress,

                checkInSelfie: selfie,

                attendanceStatus: "Present",

                status: "CheckedIn"

            });

        return res.status(201).json({

            success: true,

            message: "Check In Successful",

            data: attendance

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
// CHECK OUT
// ======================================

exports.checkOut = async (req, res) => {

    try {

        const attendance =
            await Attendance.findById(
                req.params.id
            );

        if (!attendance) {

            return res.status(404).json({

                success: false,

                message: "Attendance not found"

            });

        }

        if (attendance.status === "CheckedOut") {

            return res.status(400).json({

                success: false,

                message: "Already Checked Out"

            });

        }

        let selfie = "";

        if (req.file) {

            const result =
                await new Promise((resolve, reject) => {

                    cloudinary.uploader.upload_stream(

                        {
                            folder: "attendance/checkout"
                        },

                        (error, result) => {

                            if (error)
                                reject(error);

                            else
                                resolve(result);

                        }

                    ).end(req.file.buffer);

                });

            selfie = result.secure_url;

        }

        const checkoutTime = new Date();

        const workingMinutes =
            Math.floor(

                (checkoutTime - attendance.checkInTime)

                / 60000

            );

        attendance.checkOutTime = checkoutTime;

        attendance.checkOutLatitude =
            req.body.checkOutLatitude;

        attendance.checkOutLongitude =
            req.body.checkOutLongitude;

        attendance.checkOutAddress =
            req.body.checkOutAddress;

        attendance.checkOutSelfie =
            selfie;

        attendance.totalWorkingMinutes =
            workingMinutes;

        attendance.status =
            "CheckedOut";

        await attendance.save();

        return res.status(200).json({

            success: true,

            message: "Check Out Successful",

            data: attendance

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.getTodayAttendance = async (req, res) => {

    try {

        const { employeeId } = req.params;

        const {
            type = "today",
            fromDate,
            toDate
        } = req.query;


        // ==========================================
        // EMPLOYEE VALIDATION
        // ==========================================

        if (!employeeId) {

            return res.status(400).json({
                success: false,
                message: "Employee Id is required"
            });

        }


        const employeeExists =
            await User.findById(employeeId);

        if (!employeeExists) {

            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });

        }


        // ==========================================
        // DATE RANGE
        // ==========================================

        const now = new Date();

        let startDate;
        let endDate;


        // ==========================================
        // TODAY
        // ==========================================

        switch (type) {

            case "today":

                startDate = new Date(now);

                startDate.setHours(
                    0, 0, 0, 0
                );


                endDate = new Date(startDate);

                endDate.setDate(
                    endDate.getDate() + 1
                );

                break;


            // ======================================
            // WEEK
            // ======================================

            case "week":

                startDate = new Date(now);

                startDate.setHours(
                    0, 0, 0, 0
                );


                const day =
                    startDate.getDay();


                startDate.setDate(
                    startDate.getDate() - day
                );


                endDate =
                    new Date(startDate);


                endDate.setDate(
                    endDate.getDate() + 7
                );

                break;


            // ======================================
            // MONTH
            // ======================================

            case "month":

                startDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );


                endDate = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    1
                );

                break;


            // ======================================
            // YEAR
            // ======================================

            case "year":

                startDate = new Date(
                    now.getFullYear(),
                    0,
                    1
                );


                endDate = new Date(
                    now.getFullYear() + 1,
                    0,
                    1
                );

                break;


            // ======================================
            // CUSTOM DATE RANGE
            // ======================================

            case "custom":

                if (!fromDate || !toDate) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "fromDate and toDate are required for custom date range"

                    });

                }


                startDate =
                    new Date(fromDate);


                if (
                    isNaN(
                        startDate.getTime()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid fromDate"

                    });

                }


                endDate =
                    new Date(toDate);


                if (
                    isNaN(
                        endDate.getTime()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid toDate"

                    });

                }


                // Include complete To Date
                endDate.setDate(
                    endDate.getDate() + 1
                );


                startDate.setHours(
                    0, 0, 0, 0
                );


                endDate.setHours(
                    0, 0, 0, 0
                );

                break;


            // ======================================
            // INVALID TYPE
            // ======================================

            default:

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid type. Use today, week, month, year or custom."

                });

        }


        // ==========================================
        // DATE VALIDATION
        // ==========================================

        if (startDate >= endDate) {

            return res.status(400).json({

                success: false,

                message:
                    "fromDate must be before toDate"

            });

        }


        // ==========================================
        // GET ATTENDANCE
        // ==========================================

        const attendance =
            await Attendance.find({

                employee: employeeId,

                attendanceDate: {

                    $gte: startDate,

                    $lt: endDate

                },

                isDeleted: false

            })
                .sort({
                    attendanceDate: -1
                });


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message: attendance.length
                ? `${type} attendance found`
                : `No attendance found for ${type}`,

            totalAttendance:
                attendance.length,

            fromDate: startDate,

            toDate: endDate,

            data: attendance

        });


    }
    catch (error) {

        console.log(
            "Get Attendance Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.getMonthlyAttendance = async (req, res) => {

    try {

        const month =
            new Date().getMonth();

        const year =
            new Date().getFullYear();

        const attendances =
            await Attendance.find({

                employee:
                    req.params.employeeId,

                attendanceDate: {

                    $gte:
                        new Date(
                            year,
                            month,
                            1
                        ),

                    $lt:
                        new Date(
                            year,
                            month + 1,
                            1
                        )

                }

            });

        return res.status(200).json({

            success: true,

            count:
                attendances.length,

            data:
                attendances

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

// exports.getAttendanceSummary =async (req, res) => {

//         try {

//             const attendances =
//                 await Attendance.find({

//                     employee:
//                         req.params.employeeId,

//                     isDeleted: false

//                 });

//             const totalPresent =
//                 attendances.filter(

//                     x =>
//                         x.attendanceStatus
//                         === "Present"

//                 ).length;

//             const totalHalfDay =
//                 attendances.filter(

//                     x =>
//                         x.attendanceStatus
//                         === "Half Day"

//                 ).length;

//             const totalMinutes =
//                 attendances.reduce(

//                     (sum, item) =>

//                         sum +
//                         item.totalWorkingMinutes,

//                     0

//                 );

//             return res.status(200).json({

//                 success: true,

//                 data: {

//                     totalDays:
//                         attendances.length,

//                     totalPresent,

//                     totalHalfDay,

//                     totalWorkingMinutes:
//                         totalMinutes

//                 }

//             });

//         }
//         catch (error) {

//             return res.status(500).json({

//                 success: false,

//                 message:
//                     error.message

//             });

//         }

//     };



// ======================================
// GET ATTENDANCE SUMMARY
// ======================================

exports.getAttendanceSummary = async (req, res) => {

    try {

        const { employeeId } = req.params;

        // ======================================
        // EMPLOYEE CHECK
        // ======================================

        const employee = await User.findOne({

            _id: employeeId,

            isDeleted: false

        });

        if (!employee) {

            return res.status(404).json({

                success: false,

                message: "Employee not found"

            });

        }


        // ======================================
        // CURRENT MONTH
        // ======================================

        const now = new Date();

        const year = now.getFullYear();

        const month = now.getMonth();


        const monthStart = new Date(
            year,
            month,
            1
        );

        const monthEnd = new Date(
            year,
            month + 1,
            1
        );


        // ======================================
        // GET ATTENDANCE
        // ======================================

        const attendances =
            await Attendance.find({

                employee: employeeId,

                attendanceDate: {

                    $gte: monthStart,

                    $lt: monthEnd

                },

                isDeleted: false

            });


        // ======================================
        // PRESENT
        // ======================================

        const present =
            attendances.filter(

                item =>
                    item.attendanceStatus === "Present"

            ).length;


        // ======================================
        // HALF DAY
        // ======================================

        const halfDay =
            attendances.filter(

                item =>
                    item.attendanceStatus === "Half Day"

            ).length;


        // ======================================
        // TOTAL WORKING DAYS
        // ======================================

        const today = new Date();

        let totalWorkingDays = 0;


        if (
            year === today.getFullYear() &&
            month === today.getMonth()
        ) {

            // Current month
            totalWorkingDays =
                today.getDate();

        }
        else {

            // Previous month
            totalWorkingDays =
                new Date(
                    year,
                    month + 1,
                    0
                ).getDate();

        }


        // ======================================
        // ABSENT
        // ======================================

        const absent =
            Math.max(

                totalWorkingDays -
                present -
                halfDay,

                0

            );


        // ======================================
        // TOTAL ORDERS
        // ======================================

        const totalOrders = await Order.countDocuments({
            employee: employeeId,
            orderDate: {
                $gte: monthStart,
                $lt: monthEnd
            },
            isDeleted: false
        });


        // ======================================
        // TOTAL VISITS
        // ======================================

        const totalVisits =
            attendances.reduce(

                (sum, item) =>

                    sum +
                    (item.totalVisits || 0),

                0

            );


        // ======================================
        // TOTAL COLLECTIONS
        // ======================================

        const totalCollections =
            attendances.reduce(

                (sum, item) =>

                    sum +
                    (item.totalCollections || 0),

                0

            );


        // ======================================
        // TOTAL WORKING MINUTES
        // ======================================

        const totalWorkingMinutes =
            attendances.reduce(

                (sum, item) =>

                    sum +
                    (item.totalWorkingMinutes || 0),

                0

            );


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            data: {

                employeeId:
                    employee._id,

                employeeName:
                    employee.fullName,

                totalWorkingDays:

                    totalWorkingDays,

                present:

                    present,

                absent:

                    absent,

                halfDay:

                    halfDay,

                totalOrders:

                    totalOrders,

                totalVisits:

                    totalVisits,

                totalCollections:

                    totalCollections,

                totalWorkingMinutes:

                    totalWorkingMinutes

            }

        });

    }
    catch (error) {

        console.error(
            "Get Attendance Summary Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};  