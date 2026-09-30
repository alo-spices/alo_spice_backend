const OrderItem = require("../models/order-items");
const Order = require("../models/order");
const Product = require("../models/product");

exports.createOrderItem = async (req, res) => {

    try {

        const {

            order,
            product,
            variantId,
            packSize,
            price,
            discountAmount,
            gstPercentage,
            quantity

        } = req.body;

        const orderExists =
            await Order.findById(order);

        if (!orderExists) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        const productExists =
            await Product.findById(product);

        if (!productExists) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }

        const lineTotal =
            (price * quantity)
            - discountAmount;

        const item =
            await OrderItem.create({

                order,
                product,
                variantId,
                packSize,
                price,
                discountAmount,
                gstPercentage,
                quantity,
                lineTotal

            });

        return res.status(201).json({

            success: true,

            message:
                "Order Item Created Successfully",

            data:
                item

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
exports.updateOrderItem = async (req, res) => {

    try {

        const {

            price,
            quantity,
            discountAmount

        } = req.body;

        const lineTotal =
            (price * quantity)
            - discountAmount;

        const item =
            await OrderItem.findByIdAndUpdate(

                req.params.id,

                {

                    ...req.body,

                    lineTotal

                },

                {

                    new: true

                }

            );

        if (!item) {

            return res.status(404).json({

                success: false,

                message:
                    "Order Item Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Order Item Updated Successfully",

            data:
                item

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
exports.deleteOrderItem = async (req, res) => {

    try {

        const item =
            await OrderItem.findByIdAndDelete(
                req.params.id
            );

        if (!item) {

            return res.status(404).json({

                success: false,

                message:
                    "Order Item Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Order Item Deleted Successfully"

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