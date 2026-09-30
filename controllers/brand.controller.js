const Brand = require("../models/brand");
const cloudinary = require("../cloudinaryconfig");

// ======================================
// CREATE BRAND
// ======================================

exports.createBrand = async (req, res) => {

    try {

        const {
            brandName,
            brandCode,
            description,
            website,
            email,
            phone
        } = req.body;

        if (!brandName) {
            return res.status(400).json({
                success: false,
                message: "Brand Name is required"
            });
        }

        if (!brandCode) {
            return res.status(400).json({
                success: false,
                message: "Brand Code is required"
            });
        }

        const existingBrand =
            await Brand.findOne({
                $or: [
                    { brandName },
                    { brandCode }
                ],
                isDeleted: false
            });

        if (existingBrand) {
            return res.status(409).json({
                success: false,
                message: "Brand Name or Brand Code already exists"
            });
        }

        let logo = "";
        let bannerImage = "";

        if (req.files?.logo?.[0]) {

            const result = await new Promise((resolve, reject) => {

                cloudinary.uploader.upload_stream(
                    { folder: "brands/logo" },
                    (error, result) => {

                        if (error) reject(error);
                        else resolve(result);

                    }
                ).end(req.files.logo[0].buffer);

            });

            logo = result.secure_url;
        }

        if (req.files?.bannerImage?.[0]) {

            const result = await new Promise((resolve, reject) => {

                cloudinary.uploader.upload_stream(
                    { folder: "brands/banner" },
                    (error, result) => {

                        if (error) reject(error);
                        else resolve(result);

                    }
                ).end(req.files.bannerImage[0].buffer);

            });

            bannerImage = result.secure_url;
        }

        const brand = await Brand.create({

            brandName,
            brandCode,
            description,
            website,
            email,
            phone,
            logo,
            bannerImage

        });

        return res.status(201).json({

            success: true,

            message: "Brand created successfully",

            data: brand

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================
// GET BRANDS
// ======================================

exports.getBrands = async (req, res) => {

    try {

        const brands = await Brand.find({
            isDeleted: false
        });

        return res.status(200).json({

            success: true,

            count: brands.length,

            data: brands

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================
// UPDATE BRAND
// ======================================

exports.updateBrand = async (req, res) => {

    try {

        const brand =
            await Brand.findById(
                req.params.id
            );

        if (!brand) {

            return res.status(404).json({

                success: false,

                message: "Brand not found"

            });

        }

        let logo = brand.logo;
        let bannerImage = brand.bannerImage;

        if (req.files?.logo?.[0]) {

            const result = await new Promise((resolve, reject) => {

                cloudinary.uploader.upload_stream(
                    { folder: "brands/logo" },
                    (error, result) => {

                        if (error) reject(error);
                        else resolve(result);

                    }
                ).end(req.files.logo[0].buffer);

            });

            logo = result.secure_url;
        }

        if (req.files?.bannerImage?.[0]) {

            const result = await new Promise((resolve, reject) => {

                cloudinary.uploader.upload_stream(
                    { folder: "brands/banner" },
                    (error, result) => {

                        if (error) reject(error);
                        else resolve(result);

                    }
                ).end(req.files.bannerImage[0].buffer);

            });

            bannerImage = result.secure_url;
        }

        const updatedBrand =
            await Brand.findByIdAndUpdate(

                req.params.id,

                {
                    ...req.body,
                    logo,
                    bannerImage
                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message: "Brand updated successfully",

            data: updatedBrand

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// GET BRAND BY ID
// ======================================

exports.getBrandById = async (req, res) => {

    try {

        const brand =
            await Brand.findOne({

                _id: req.params.id,

                isDeleted: false

            });

        if (!brand) {

            return res.status(404).json({

                success: false,

                message: "Brand not found"

            });

        }

        return res.status(200).json({

            success: true,

            data: brand

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
// DELETE BRAND
// ======================================

exports.deleteBrand = async (req, res) => {

    try {

        const brand =
            await Brand.findById(
                req.params.id
            );

        if (!brand) {

            return res.status(404).json({

                success: false,

                message: "Brand not found"

            });

        }

        brand.isDeleted = true;
        brand.status = "Inactive";

        await brand.save();

        return res.status(200).json({

            success: true,

            message: "Brand deleted successfully"

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};