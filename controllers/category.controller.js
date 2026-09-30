const Category = require("../models/category");
const Brand = require("../models/brand");
const cloudinary = require("../cloudinaryconfig");
// ======================================
// CREATE CATEGORY
// ======================================

exports.createCategory = async (req, res) => {

    try {

        const {

            categoryName,
            categoryCode,
            description,
            brand,
            displayOrder

        } = req.body;

        if (!categoryName) {
            return res.status(400).json({
                success: false,
                message: "Category Name is required"
            });
        }

        if (!categoryCode) {
            return res.status(400).json({
                success: false,
                message: "Category Code is required"
            });
        }

        if (!brand) {
            return res.status(400).json({
                success: false,
                message: "Brand is required"
            });
        }

        const brandExists =
            await Brand.findById(brand);

        if (!brandExists) {

            return res.status(404).json({

                success: false,

                message: "Brand not found"

            });

        }

        const existingCategory =
            await Category.findOne({

                categoryCode,

                isDeleted: false

            });

        if (existingCategory) {

            return res.status(409).json({

                success: false,

                message:
                    "Category Code already exists"

            });

        }

        let image = "";

        if (req.file) {

            const result =
                await new Promise(
                    (resolve, reject) => {

                        cloudinary.uploader.upload_stream(

                            {
                                folder:
                                    "categories"
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

            image =
                result.secure_url;

        }

        const category =
            await Category.create({

                categoryName,
                categoryCode,
                description,
                brand,
                displayOrder,
                image

            });

        return res.status(201).json({

            success: true,

            message:
                "Category created successfully",

            data: category

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
// GET CATEGORIES
// ======================================

exports.getCategories = async (req, res) => {

    try {

        const categories =
            await Category.find({

                isDeleted: false

            })
            .populate(
                "brand",
                "brandName brandCode"
            );

        return res.status(200).json({

            success: true,

            count:
                categories.length,

            data:
                categories

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
// UPDATE CATEGORY
// ======================================

exports.updateCategory = async (req, res) => {

    try {

        const category =
            await Category.findById(
                req.params.id
            );

        if (!category) {

            return res.status(404).json({

                success: false,

                message:
                    "Category not found"

            });

        }

        let image =
            category.image;

        if (req.file) {

            const result =
                await new Promise(
                    (resolve, reject) => {

                        cloudinary.uploader.upload_stream(

                            {
                                folder:
                                    "categories"
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

            image =
                result.secure_url;

        }

        const updatedCategory =
            await Category.findByIdAndUpdate(

                req.params.id,

                {
                    ...req.body,
                    image
                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Category updated successfully",

            data:
                updatedCategory

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
// DELETE CATEGORY
// ======================================

exports.deleteCategory = async (req, res) => {

    try {

        const category =
            await Category.findById(
                req.params.id
            );

        if (!category) {

            return res.status(404).json({

                success: false,

                message:
                    "Category not found"

            });

        }

        category.isDeleted = true;

        category.status = "Inactive";

        await category.save();

        return res.status(200).json({

            success: true,

            message:
                "Category deleted successfully"

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
// GET CATEGORY BY ID
// ======================================

exports.getCategoryById = async (req, res) => {

    try {

        const category =
            await Category.findOne({

                _id: req.params.id,

                isDeleted: false

            })
            .populate(
                "brand",
                "brandName brandCode logo"
            );

        if (!category) {

            return res.status(404).json({

                success: false,

                message: "Category not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: category

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};