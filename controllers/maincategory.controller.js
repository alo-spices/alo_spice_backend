const MainCategory = require("../models/main-category");

// =====================================================
// CREATE MAIN CATEGORY
// =====================================================

const createMainCategory = async (req, res) => {
    try {

        const {
            mainCategoryName,
            description,
            image,
            status
        } = req.body;

        if (!mainCategoryName) {
            return res.status(400).json({
                success: false,
                message: "Main category name is required."
            });
        }

        // Check duplicate
        const existingMainCategory = await MainCategory.findOne({
            mainCategoryName: {
                $regex: `^${mainCategoryName}$`,
                $options: "i"
            },
            isDeleted: false
        });

        if (existingMainCategory) {
            return res.status(400).json({
                success: false,
                message: "Main category already exists."
            });
        }

        const mainCategory = await MainCategory.create({
            mainCategoryName,
            description: description || "",
            image: image || "",
            status: status || "Active"
        });

        return res.status(201).json({
            success: true,
            message: "Main category created successfully.",
            data: mainCategory
        });

    } catch (error) {

        console.error("Create Main Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create main category.",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL MAIN CATEGORIES
// =====================================================

const getAllMainCategories = async (req, res) => {
    try {

        const mainCategories = await MainCategory.find({
            isDeleted: false
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: mainCategories.length,
            data: mainCategories
        });

    } catch (error) {

        console.error("Get Main Categories Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get main categories.",
            error: error.message
        });
    }
};


// =====================================================
// GET MAIN CATEGORY BY ID
// =====================================================

const getMainCategoryById = async (req, res) => {
    try {

        const { id } = req.params;

        const mainCategory = await MainCategory.findOne({
            _id: id,
            isDeleted: false
        });

        if (!mainCategory) {
            return res.status(404).json({
                success: false,
                message: "Main category not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: mainCategory
        });

    } catch (error) {

        console.error("Get Main Category By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get main category.",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE MAIN CATEGORY
// =====================================================

const updateMainCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            mainCategoryName,
            description,
            image,
            status
        } = req.body;

        const mainCategory = await MainCategory.findOne({
            _id: id,
            isDeleted: false
        });

        if (!mainCategory) {
            return res.status(404).json({
                success: false,
                message: "Main category not found."
            });
        }

        // Check duplicate name
        if (mainCategoryName) {

            const duplicate = await MainCategory.findOne({
                _id: { $ne: id },
                mainCategoryName: {
                    $regex: `^${mainCategoryName}$`,
                    $options: "i"
                },
                isDeleted: false
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "Another main category with this name already exists."
                });
            }

            mainCategory.mainCategoryName = mainCategoryName;
        }

        if (description !== undefined) {
            mainCategory.description = description;
        }

        if (image !== undefined) {
            mainCategory.image = image;
        }

        if (status !== undefined) {
            mainCategory.status = status;
        }

        await mainCategory.save();

        return res.status(200).json({
            success: true,
            message: "Main category updated successfully.",
            data: mainCategory
        });

    } catch (error) {

        console.error("Update Main Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update main category.",
            error: error.message
        });
    }
};


// =====================================================
// DELETE MAIN CATEGORY - SOFT DELETE
// =====================================================

const deleteMainCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const mainCategory = await MainCategory.findOne({
            _id: id,
            isDeleted: false
        });

        if (!mainCategory) {
            return res.status(404).json({
                success: false,
                message: "Main category not found."
            });
        }

        mainCategory.isDeleted = true;

        await mainCategory.save();

        return res.status(200).json({
            success: true,
            message: "Main category deleted successfully."
        });

    } catch (error) {

        console.error("Delete Main Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete main category.",
            error: error.message
        });
    }
};


module.exports = {
    createMainCategory,
    getAllMainCategories,
    getMainCategoryById,
    updateMainCategory,
    deleteMainCategory
};