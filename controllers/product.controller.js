const Product = require("../models/product");
const Brand = require("../models/brand");
const Category = require("../models/category");
const RawMaterial = require("../models/raw-material");
const cloudinary = require("../cloudinaryconfig");

// ======================================
// CREATE PRODUCT
// ======================================
exports.createProduct = async (req, res) => {

    try {

        const {

            productName,
            productCode,
            brand,
            category,
            rawMaterial,
            shortDescription,
            description,
            hsnCode,
            gstPercentage,
            productType,
            displayOrder,
            featuredProduct,
            variants

        } = req.body;


        // ======================================
        // BASIC VALIDATIONS
        // ======================================

        if (!productName) {

            return res.status(400).json({

                success: false,

                message:
                    "Product Name is required"

            });

        }


        if (!productCode) {

            return res.status(400).json({

                success: false,

                message:
                    "Product Code is required"

            });

        }


        if (!brand) {

            return res.status(400).json({

                success: false,

                message:
                    "Brand is required"

            });

        }


        if (!category) {

            return res.status(400).json({

                success: false,

                message:
                    "Category is required"

            });

        }


        // ======================================
        // PRODUCT CODE DUPLICATE CHECK
        // ======================================

        const existingProduct =
            await Product.findOne({

                productCode:
                    productCode.trim(),

                isDeleted: false

            });


        if (existingProduct) {

            return res.status(409).json({

                success: false,

                message:
                    "Product Code already exists"

            });

        }


        // ======================================
        // PARSE VARIANTS
        // ======================================

        let parsedVariants = [];


        try {

            parsedVariants =
                JSON.parse(
                    variants || "[]"
                );

        }

        catch (error) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid variants data"

            });

        }


        // ======================================
        // VARIANT VALIDATION
        // ======================================

        if (
            !Array.isArray(parsedVariants) ||
            parsedVariants.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one product variant is required"

            });

        }


        // ======================================
        // MAIN IMAGE UPLOAD
        // ======================================

        if (
            req.files &&
            req.files.image &&
            req.files.image.length > 0
        ) {

            const file =
                req.files.image[0];


            const result =
                await new Promise(
                    (resolve, reject) => {

                        const uploadStream =
                            cloudinary.uploader.upload_stream(

                                {

                                    folder:
                                        "products/variants",

                                    resource_type:
                                        "image"

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

                            );


                        uploadStream.end(
                            file.buffer
                        );

                    }
                );


            // ==================================
            // SAVE IMAGE URL IN FIRST VARIANT
            // ==================================

            parsedVariants[0].image =
                result.secure_url;

        }


        // ======================================
        // GALLERY IMAGE UPLOAD
        // ======================================

        if (
            req.files &&
            req.files.gallery &&
            req.files.gallery.length > 0
        ) {

            // Make sure gallery is initialized

            parsedVariants[0].gallery = [];


            for (
                const file
                of req.files.gallery
            ) {

                const result =
                    await new Promise(
                        (resolve, reject) => {

                            const uploadStream =
                                cloudinary.uploader.upload_stream(

                                    {

                                        folder:
                                            "products/variants/gallery",

                                        resource_type:
                                            "image"

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

                                );


                            uploadStream.end(
                                file.buffer
                            );

                        }
                    );


                // ==================================
                // SAVE GALLERY URL
                // ==================================

                parsedVariants[0].gallery.push(
                    result.secure_url
                );

            }

        }
        else {

            // No gallery selected

            parsedVariants[0].gallery =
                parsedVariants[0].gallery || [];

        }


        // ======================================
        // CREATE PRODUCT
        // ======================================

        const product =
            await Product.create({

                productName:
                    productName.trim(),

                productCode:
                    productCode.trim(),

                shortDescription:
                    shortDescription || "",

                description:
                    description || "",

                brand:
                    brand,

                category:
                    category,

                rawMaterial:
                    rawMaterial || null,

                hsnCode:
                    hsnCode || "",

                gstPercentage:
                    gstPercentage !== undefined &&
                        gstPercentage !== ""
                        ? Number(gstPercentage)
                        : 0,

                productType:
                    productType || "Regular",

                displayOrder:
                    displayOrder !== undefined &&
                        displayOrder !== ""
                        ? Number(displayOrder)
                        : 0,

                featuredProduct:
                    featuredProduct === true ||
                    featuredProduct === "true",

                variants:
                    parsedVariants

            });


        // ======================================
        // SUCCESS RESPONSE
        // ======================================

        return res.status(201).json({

            success: true,

            message:
                "Product created successfully",

            data:
                product

        });

    }


    catch (error) {

        console.error(
            "Create Product Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};
// exports.createProduct = async (req, res) => {

//     try {

//         const {

//             productName,
//             productCode,
//             brand,
//             category,
//             shortDescription,
//             description,
//             hsnCode,
//             gstPercentage,
//             productType,
//             displayOrder,
//             featuredProduct,
//             variants

//         } = req.body;

//         if (!productName) {

//             return res.status(400).json({

//                 success: false,

//                 message: "Product Name is required"

//             });

//         }

//         if (!productCode) {

//             return res.status(400).json({

//                 success: false,

//                 message: "Product Code is required"

//             });

//         }

//         if (!brand) {

//             return res.status(400).json({

//                 success: false,

//                 message: "Brand is required"

//             });

//         }

//         if (!category) {

//             return res.status(400).json({

//                 success: false,

//                 message: "Category is required"

//             });

//         }

//         const existingProduct =
//             await Product.findOne({

//                 productCode,

//                 isDeleted: false

//             });

//         if (existingProduct) {

//             return res.status(409).json({

//                 success: false,

//                 message:
//                     "Product Code already exists"

//             });

//         }

//         let image = "";

//         let gallery = [];

//         // Main Image

//         if (req.files?.image?.[0]) {

//             const result =
//                 await new Promise(
//                     (resolve, reject) => {

//                         cloudinary.uploader.upload_stream(

//                             {
//                                 folder: "products"
//                             },

//                             (error, result) => {

//                                 if (error)
//                                     reject(error);

//                                 else
//                                     resolve(result);

//                             }

//                         ).end(
//                             req.files.image[0].buffer
//                         );

//                     }
//                 );

//             image =
//                 result.secure_url;

//         }

//         // Gallery Images

//         if (req.files?.gallery) {

//             for (const file of req.files.gallery) {

//                 const result =
//                     await new Promise(
//                         (resolve, reject) => {

//                             cloudinary.uploader.upload_stream(

//                                 {
//                                     folder:
//                                         "products/gallery"
//                                 },

//                                 (
//                                     error,
//                                     result
//                                 ) => {

//                                     if (error)
//                                         reject(error);

//                                     else
//                                         resolve(result);

//                                 }

//                             ).end(
//                                 file.buffer
//                             );

//                         }
//                     );

//                 gallery.push(
//                     result.secure_url
//                 );

//             }

//         }

//         const product =
//             await Product.create({

//                 productName,

//                 productCode,

//                 shortDescription,

//                 description,

//                 brand,

//                 category,

//                 image,

//                 gallery,

//                 hsnCode,

//                 gstPercentage,

//                 productType,

//                 displayOrder,

//                 featuredProduct,

//                 variants:
//                     JSON.parse(
//                         variants || "[]"
//                     )

//             });

//         return res.status(201).json({

//             success: true,

//             message:
//                 "Product created successfully",

//             data: product

//         });

//     }
//     catch (error) {

//         return res.status(500).json({

//             success: false,

//             message:
//                 error.message

//         });

//     }

// };
// ======================================
// GET PRODUCTS
// ======================================

exports.getProducts = async (req, res) => {

    try {

        const products =
            await Product.find({

                isDeleted: false

            })

                .populate(
                    "brand",
                    "brandName brandCode"
                )

                .populate(
                    "category",
                    "categoryName categoryCode"
                )

                .sort({
                    displayOrder: 1
                });

        return res.status(200).json({

            success: true,

            count:
                products.length,

            data:
                products

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
// GET PRODUCT BY ID
// ======================================

exports.getProductById = async (req, res) => {

    try {

        const product =
            await Product.findOne({

                _id:
                    req.params.id,

                isDeleted:
                    false

            })

                .populate(
                    "brand"
                )

                .populate(
                    "category"
                );

        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }

        return res.status(200).json({

            success: true,

            data:
                product

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
// UPDATE PRODUCT
// ======================================

exports.updateProduct = async (req, res) => {

    try {

        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }

        let image =
            product.image;

        let gallery =
            product.gallery;

        // Main Image

        if (req.files?.image?.[0]) {

            const result =
                await new Promise(
                    (resolve, reject) => {

                        cloudinary.uploader.upload_stream(

                            {
                                folder:
                                    "products"
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

                        ).end(
                            req.files.image[0].buffer
                        );

                    }
                );

            image =
                result.secure_url;

        }

        // Gallery Images

        if (req.files?.gallery) {

            gallery = [];

            for (
                const file
                of req.files.gallery
            ) {

                const result =
                    await new Promise(
                        (resolve, reject) => {

                            cloudinary.uploader.upload_stream(

                                {
                                    folder:
                                        "products/gallery"
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

                            ).end(
                                file.buffer
                            );

                        }
                    );

                gallery.push(
                    result.secure_url
                );

            }

        }

        const updatedProduct =
            await Product.findByIdAndUpdate(

                req.params.id,

                {

                    ...req.body,

                    image,

                    gallery,

                    variants:
                        req.body.variants
                            ? JSON.parse(
                                req.body.variants
                            )
                            : product.variants

                },

                {
                    new: true
                }

            );

        return res.status(200).json({

            success: true,

            message:
                "Product updated successfully",

            data:
                updatedProduct

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
// DELETE PRODUCT
// ======================================

exports.deleteProduct = async (req, res) => {

    try {

        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }

        product.isDeleted = true;

        product.status = "Inactive";

        await product.save();

        return res.status(200).json({

            success: true,

            message:
                "Product deleted successfully"

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

// ==============================
// getProductVariants
// ==============================

exports.getProductVariants = async (req, res) => {

    try {

        const { productId } = req.params;


        const product = await Product.findById(productId)
            .select("variants");


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        return res.status(200).json({
            success: true,
            data: product.variants
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ======================================
// GET PRODUCTS BY RAW MATERIAL
// ======================================

exports.getProductsByRawMaterial = async (req, res) => {

    try {

        const { rawMaterialId } = req.params;

        const products = await Product.find({

            rawMaterial: rawMaterialId,

            isDeleted: false

        })
            .select("productName productCode variants");

        return res.status(200).json({

            success: true,

            count: products.length,

            data: products

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};