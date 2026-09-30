const StockTransaction = require("../models/stock-transection");
const Stock = require("../models/stock");

// =====================================
// GET TRANSACTIONS
// =====================================

exports.getTransactions = async (req, res) => {

    try {

        const transactions =
            await StockTransaction.find()
                .populate(
                    "product",
                    "productName productCode"
                )
                .populate(
                    "party",
                    "partyName shopName"
                )
                .populate(
                    "createdBy",
                    "fullName role"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({

            success: true,

            count:
                transactions.length,

            data:
                transactions

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
// GET TRANSACTION BY ID
// =====================================

exports.getTransactionById = async (req, res) => {

    try {

        const transaction =
            await StockTransaction.findById(
                req.params.id
            )

                .populate("stock")
                .populate("product")
                .populate("party")
                .populate("createdBy");

        if (!transaction) {

            return res.status(404).json({

                success: false,

                message: "Transaction Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            data: transaction

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// =====================================
// STOCK IN
// =====================================

exports.stockIn = async (req, res) => {

    try {

        const {
            stock,
            quantity,
            remarks,
            createdBy
        } = req.body;

        const stockData =
            await Stock.findById(stock);

        if (!stockData) {

            return res.status(404).json({

                success: false,

                message: "Stock Not Found"

            });

        }

        const previousStock =
            stockData.availableQuantity;

        stockData.availableQuantity +=
            Number(quantity);

        await stockData.save();

        const transaction =
           await StockTransaction.create({

    stock,
    product,
    variantId,
    party,

    transactionType: "StockIn",

    quantity,

    previousStock,

    currentStock,

    remarks,

    createdBy   // compulsory

});

        return res.status(201).json({

            success: true,

            message:
                "Stock In Successfully",

            data: transaction

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// =====================================
// STOCK OUT
// =====================================

exports.stockOut = async (req, res) => {

    try {

        const {
            stock,
            quantity,
            remarks,
            createdBy
        } = req.body;

        const stockData =
            await Stock.findById(stock);

        if (!stockData) {

            return res.status(404).json({

                success: false,

                message: "Stock Not Found"

            });

        }

        if (
            stockData.availableQuantity <
            quantity
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Insufficient Stock"

            });

        }

        const previousStock =
            stockData.availableQuantity;

        stockData.availableQuantity -=
            Number(quantity);

        await stockData.save();

        const transaction =
            await StockTransaction.create({

                stock: stockData._id,

                product:
                    stockData.product,

                variantId:
                    stockData.variantId,

                party:
                    stockData.party,

                transactionType:
                    "StockOut",

                quantity,

                previousStock,

                currentStock:
                    stockData.availableQuantity,

                remarks,

                createdBy

            });

        return res.status(201).json({

            success: true,

            message:
                "Stock Out Successfully",

            data: transaction

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// =====================================
// ADJUST STOCK
// =====================================

exports.adjustStock = async (req, res) => {

    try {

        const {
            stock,
            quantity,
            remarks,
            createdBy
        } = req.body;

        const stockData =
            await Stock.findById(stock);

        if (!stockData) {

            return res.status(404).json({

                success: false,

                message: "Stock Not Found"

            });

        }

        const previousStock =
            stockData.availableQuantity;

        stockData.availableQuantity =
            quantity;

        await stockData.save();

        const transaction =
            await StockTransaction.create({

                stock: stockData._id,

                product:
                    stockData.product,

                variantId:
                    stockData.variantId,

                party:
                    stockData.party,

                transactionType:
                    "Adjustment",

                quantity,

                previousStock,

                currentStock:
                    stockData.availableQuantity,

                remarks,

                createdBy

            });

        return res.status(200).json({

            success: true,

            message:
                "Stock Adjusted Successfully",

            data: transaction

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// =====================================
// RETURN STOCK
// =====================================

exports.returnStock = async (req, res) => {

    try {

        const {
            stock,
            quantity,
            remarks,
            createdBy
        } = req.body;

        const stockData =
            await Stock.findById(stock);

        if (!stockData) {

            return res.status(404).json({

                success: false,

                message: "Stock Not Found"

            });

        }

        const previousStock =
            stockData.availableQuantity;

        stockData.availableQuantity +=
            Number(quantity);

        await stockData.save();

        const transaction =
            await StockTransaction.create({

                stock: stockData._id,

                product:
                    stockData.product,

                variantId:
                    stockData.variantId,

                party:
                    stockData.party,

                transactionType:
                    "Return",

                quantity,

                previousStock,

                currentStock:
                    stockData.availableQuantity,

                remarks,

                createdBy

            });

        return res.status(200).json({

            success: true,

            message:
                "Stock Returned Successfully",

            data: transaction

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};