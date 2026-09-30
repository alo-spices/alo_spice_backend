const Stock = require("../models/stock");
const Product = require("../models/product");
const Party = require("../models/party");

// =====================================
// CREATE STOCK
// =====================================

exports.createStock = async (req, res) => {

    try {

        const {
            product,
            variantId,
            packSize,
            batchNo,
            availableQuantity,
            reservedQuantity,
            damagedQuantity,
            minimumStockLevel
        } = req.body;

        const stock = await Stock.create({

            product,
            variantId,
            packSize,
            batchNo,
            availableQuantity,
            reservedQuantity,
            damagedQuantity,

            minimumStockLevel

        });

        return res.status(201).json({

            success: true,

            message:
                "Stock Created Successfully",

            data: stock

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
// GET STOCK
// =====================================

exports.getStock = async (req, res) => {

    try {

        const stocks =
            await Stock.find({
                isDeleted: false
            })
                .populate("product")
                .populate("party");

        return res.status(200).json({

            success: true,

            count:
                stocks.length,

            data:
                stocks

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
// UPDATE STOCK
// =====================================

exports.updateStock = async (req, res) => {

    try {

        const stock =
            await Stock.findByIdAndUpdate(

                req.params.id,

                req.body,

                { new: true }

            );

        if (!stock) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Stock Updated Successfully",

            data:
                stock

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
// INCREASE STOCK
// =====================================

exports.increaseStock = async (req, res) => {

    try {

        const { quantity } = req.body;

        const stock =
            await Stock.findById(
                req.params.id
            );

        if (!stock) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Not Found"

            });

        }

        stock.availableQuantity +=
            Number(quantity);

        await stock.save();

        return res.status(200).json({

            success: true,

            message:
                "Stock Increased Successfully",

            data:
                stock

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
// DECREASE STOCK
// =====================================

exports.decreaseStock = async (req, res) => {

    try {

        const { quantity } = req.body;

        const stock =
            await Stock.findById(
                req.params.id
            );

        if (!stock) {

            return res.status(404).json({

                success: false,

                message:
                    "Stock Not Found"

            });

        }

        if (
            stock.availableQuantity <
            quantity
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Insufficient Stock"

            });

        }

        stock.availableQuantity -=
            Number(quantity);

        await stock.save();

        return res.status(200).json({

            success: true,

            message:
                "Stock Decreased Successfully",

            data:
                stock

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
// LOW STOCK
// =====================================

exports.getLowStock = async (req, res) => {

    try {

        const stocks =
            await Stock.find({

                $expr: {

                    $lte: [
                        "$availableQuantity",
                        "$minimumStockLevel"
                    ]

                },

                isDeleted: false

            });

        return res.status(200).json({

            success: true,

            count:
                stocks.length,

            data:
                stocks

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
// STOCK SUMMARY
// =====================================

exports.getStockSummary = async (req, res) => {

    try {

        const totalProducts =
            await Stock.countDocuments({

                isDeleted: false

            });

        const summary =
            await Stock.aggregate([

                {
                    $group: {

                        _id: null,

                        totalAvailable: {
                            $sum:
                                "$availableQuantity"
                        },

                        totalReserved: {
                            $sum:
                                "$reservedQuantity"
                        },

                        totalDamaged: {
                            $sum:
                                "$damagedQuantity"
                        }

                    }

                }

            ]);

        return res.status(200).json({

            success: true,

            data: {

                totalProducts,

                totalAvailable:
                    summary[0]?.totalAvailable || 0,

                totalReserved:
                    summary[0]?.totalReserved || 0,

                totalDamaged:
                    summary[0]?.totalDamaged || 0

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