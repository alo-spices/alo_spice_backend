const Notification = require("../models/notification");

// =====================================
// CREATE NOTIFICATION
// =====================================

exports.createNotification = async (req, res) => {

    try {

        const {
            user,
            title,
            message,
            type,
            redirectId,
            redirectModule
        } = req.body;

        const notification =
            await Notification.create({

                user,
                title,
                message,
                type,
                redirectId,
                redirectModule

            });

        return res.status(201).json({

            success: true,

            message:
                "Notification Created Successfully",

            data:
                notification

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
// GET NOTIFICATIONS
// =====================================

exports.getNotifications = async (req, res) => {

    try {

        const notifications =
            await Notification.find()

                .populate(
                    "user",
                    "fullName role"
                )

                .sort({
                    createdAt: -1
                });

        return res.status(200).json({

            success: true,

            count:
                notifications.length,

            data:
                notifications

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
// MARK AS READ
// =====================================

exports.markAsRead = async (req, res) => {

    try {

        const notification =
            await Notification.findByIdAndUpdate(

                req.params.id,

                {
                    isRead: true
                },

                {
                    new: true
                }

            );

        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Notification Marked As Read",

            data:
                notification

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
// DELETE NOTIFICATION
// =====================================

exports.deleteNotification = async (req, res) => {

    try {

        const notification =
            await Notification.findByIdAndDelete(
                req.params.id
            );

        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Notification Deleted Successfully"

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
// SEND ORDER NOTIFICATION
// =====================================

exports.sendOrderNotification = async (req, res) => {

    try {

        const {
            user,
            orderId,
            orderNumber
        } = req.body;

        const notification =
            await Notification.create({

                user,

                title:
                    "New Order",

                message:
                    `Order ${orderNumber} Created Successfully`,

                type:
                    "Order",

                redirectId:
                    orderId,

                redirectModule:
                    "Order"

            });

        return res.status(201).json({

            success: true,

            message:
                "Order Notification Sent",

            data:
                notification

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
// SEND COLLECTION NOTIFICATION
// =====================================

exports.sendCollectionNotification = async (req, res) => {

    try {

        const {
            user,
            collectionId,
            amount
        } = req.body;

        const notification =
            await Notification.create({

                user,

                title:
                    "Collection Received",

                message:
                    `Collection Amount ₹${amount} Received`,

                type:
                    "Collection",

                redirectId:
                    collectionId,

                redirectModule:
                    "Collection"

            });

        return res.status(201).json({

            success: true,

            message:
                "Collection Notification Sent",

            data:
                notification

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
// SEND STOCK ALERT
// =====================================

exports.sendStockAlert = async (req, res) => {

    try {

        const {
            user,
            productName,
            stockId
        } = req.body;

        const notification =
            await Notification.create({

                user,

                title:
                    "Low Stock Alert",

                message:
                    `${productName} Stock Running Low`,

                type:
                    "Stock",

                redirectId:
                    stockId,

                redirectModule:
                    "Stock"

            });

        return res.status(201).json({

            success: true,

            message:
                "Stock Alert Sent",

            data:
                notification

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