const RawMaterial = require("../models/raw-material");
const StockReceive = require("../models/stock-receive");
// ======================================
// CREATE RAW MATERIAL
// ======================================

exports.createRawMaterial = async (req, res) => {

    try {

        const {

            rawMaterialName,
            rawMaterialCode,
            brand,
            category,
            hsnCode,
            gstPercentage,
            unit,
            description,
            status

        } = req.body;

        // ==========================
        // Validation
        // ==========================

        if (!rawMaterialName) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Name is required."

            });

        }

        if (!rawMaterialCode) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Code is required."

            });

        }

        if (!brand) {

            return res.status(400).json({

                success: false,

                message: "Please select Brand."

            });

        }

        if (!category) {

            return res.status(400).json({

                success: false,

                message: "Please select Category."

            });

        }

        // ==========================
        // Duplicate Name
        // ==========================

        const nameExists = await RawMaterial.findOne({

            rawMaterialName: rawMaterialName.trim(),

            isDeleted: false

        });

        if (nameExists) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Name already exists."

            });

        }

        // ==========================
        // Duplicate Code
        // ==========================

        const codeExists = await RawMaterial.findOne({

            rawMaterialCode: rawMaterialCode.trim().toUpperCase(),

            isDeleted: false

        });

        if (codeExists) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Code already exists."

            });

        }

        // ==========================
        // Create
        // ==========================

        const rawMaterial = await RawMaterial.create({

            rawMaterialName,

            rawMaterialCode: rawMaterialCode.toUpperCase(),

            brand,

            category,

            hsnCode,

            gstPercentage,

            unit,

            description,

            status

        });

        // ==========================
        // Populate
        // ==========================

        const response = await RawMaterial.findById(rawMaterial._id)

            .populate("brand", "brandName brandCode")

            .populate("category", "categoryName categoryCode");

        return res.status(201).json({

            success: true,

            message: "Raw Material Created Successfully.",

            data: response

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// GET ALL RAW MATERIALS
// ======================================

exports.getAllRawMaterials = async (req, res) => {

    try {

        const {

            search = "",

            status,

            page = 1,

            limit = 10

        } = req.query;

        const query = {

            isDeleted: false

        };

        // ==========================
        // Search
        // ==========================

        if (search) {

            query.$or = [

                {
                    rawMaterialName: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    rawMaterialCode: {
                        $regex: search,
                        $options: "i"
                    }
                }

            ];

        }

        // ==========================
        // Status Filter
        // ==========================

        if (status) {

            query.status = status;

        }

        const skip =

            (Number(page) - 1) * Number(limit);

        // ==========================
        // Data
        // ==========================

        const rawMaterials = await RawMaterial.find(query)

            .populate(

                "brand",

                "brandName brandCode"

            )

            .populate(

                "category",

                "categoryName categoryCode"

            )

            .sort({

                createdAt: -1

            })

            .skip(skip)

            .limit(Number(limit));

        const totalRecords =

            await RawMaterial.countDocuments(query);

        return res.status(200).json({

            success: true,

            count: rawMaterials.length,

            totalRecords,

            currentPage: Number(page),

            totalPages: Math.ceil(

                totalRecords / Number(limit)

            ),

            data: rawMaterials

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// GET RAW MATERIAL BY ID
// ======================================

exports.getRawMaterialById = async (req, res) => {

    try {

        const { id } = req.params;

        const rawMaterial = await RawMaterial.findOne({

            _id: id,

            isDeleted: false

        })

            .populate(

                "brand",

                "brandName brandCode"

            )

            .populate(

                "category",

                "categoryName categoryCode"

            );

        if (!rawMaterial) {

            return res.status(404).json({

                success: false,

                message: "Raw Material not found."

            });

        }

        return res.status(200).json({

            success: true,

            data: rawMaterial

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// UPDATE RAW MATERIAL
// ======================================

exports.updateRawMaterial = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            rawMaterialName,
            rawMaterialCode,
            brand,
            category,
            hsnCode,
            gstPercentage,
            unit,
            description,
            status

        } = req.body;

        // ==========================
        // Check Raw Material
        // ==========================

        const rawMaterial = await RawMaterial.findOne({

            _id: id,

            isDeleted: false

        });

        if (!rawMaterial) {

            return res.status(404).json({

                success: false,

                message: "Raw Material not found."

            });

        }

        // ==========================
        // Validation
        // ==========================

        if (!rawMaterialName) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Name is required."

            });

        }

        if (!rawMaterialCode) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Code is required."

            });

        }

        if (!brand) {

            return res.status(400).json({

                success: false,

                message: "Please select Brand."

            });

        }

        if (!category) {

            return res.status(400).json({

                success: false,

                message: "Please select Category."

            });

        }

        // ==========================
        // Duplicate Name
        // ==========================

        const duplicateName = await RawMaterial.findOne({

            _id: { $ne: id },

            rawMaterialName: rawMaterialName.trim(),

            isDeleted: false

        });

        if (duplicateName) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Name already exists."

            });

        }

        // ==========================
        // Duplicate Code
        // ==========================
        const code = rawMaterialCode.trim().toUpperCase();

        console.log("Update ID :", id);

        console.log("Code :", code);

        const duplicateCode = await RawMaterial.findOne({

            _id: { $ne: id },

            rawMaterialCode: rawMaterialCode.trim().toUpperCase(),

            isDeleted: false

        });
        console.log("Duplicate Record :", duplicateCode);

        if (duplicateCode) {

            return res.status(400).json({

                success: false,

                message: "Raw Material Code already exists."

            });

        }

        // ==========================
        // Update
        // ==========================

        rawMaterial.rawMaterialName = rawMaterialName;

        rawMaterial.rawMaterialCode = rawMaterialCode.toUpperCase();

        rawMaterial.brand = brand;

        rawMaterial.category = category;

        rawMaterial.hsnCode = hsnCode;

        rawMaterial.gstPercentage = gstPercentage;

        rawMaterial.unit = unit;

        rawMaterial.description = description;

        rawMaterial.status = status;

        await rawMaterial.save();

        // ==========================
        // Populate Response
        // ==========================

        const response = await RawMaterial.findById(id)

            .populate(

                "brand",

                "brandName brandCode"

            )

            .populate(

                "category",

                "categoryName categoryCode"

            );

        return res.status(200).json({

            success: true,

            message: "Raw Material Updated Successfully.",

            data: response

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// DELETE RAW MATERIAL (SOFT DELETE)
// ======================================

exports.deleteRawMaterial = async (req, res) => {

    try {

        const { id } = req.params;

        const rawMaterial = await RawMaterial.findOne({

            _id: id,

            isDeleted: false

        });

        if (!rawMaterial) {

            return res.status(404).json({

                success: false,

                message: "Raw Material not found."

            });

        }

        // ==========================
        // Soft Delete
        // ==========================

        rawMaterial.isDeleted = true;

        await rawMaterial.save();

        return res.status(200).json({

            success: true,

            message: "Raw Material Deleted Successfully."

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ======================================
// GET RAW MATERIAL DROPDOWN
// ======================================

exports.getRawMaterialDropdown = async (req, res) => {

    try {

        const rawMaterials = await RawMaterial.find({

            isDeleted: false,

            status: "Active"

        })

            .select(

                "rawMaterialName rawMaterialCode unit"

            )

            .sort({

                rawMaterialName: 1

            });

        return res.status(200).json({

            success: true,

            count: rawMaterials.length,

            data: rawMaterials

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// ==========================================
// Get Raw Materials By Warehouse
// ==========================================

exports.getRawMaterialStockByWarehouse = async (req, res) => {

    try {

        const { warehouseId } = req.params;

        // ==========================================
        // GET STOCK RECEIVES
        // ==========================================

        const stockReceives = await StockReceive.find({

            warehouse: warehouseId,

            status: {
                $ne: "Completed"
            }

        })
            .populate(
                "supplier",
                "supplierName supplierCode"
            )
            .populate(
                "items.rawMaterial",
                "rawMaterialName rawMaterialCode unit"
            )
            .sort({
                receivedDate: -1
            });


        // ==========================================
        // STOCK LIST
        // ==========================================

        const stockList = [];


        // ==========================================
        // PROCESS STOCK
        // ==========================================

        stockReceives.forEach(stockReceive => {

            stockReceive.items.forEach(item => {

                // ----------------------------------
                // Skip invalid / fully consumed stock
                // ----------------------------------

                if (!item.rawMaterial) return;

                if (item.availableWeightKg <= 0) return;


                stockList.push({

                    stockReceiveId: stockReceive._id,

                    receiveNo: stockReceive.receiveNo,

                    receivedDate: stockReceive.receivedDate,

                    supplier: stockReceive.supplier
                        ? stockReceive.supplier.supplierName
                        : "",

                    rawMaterialId: item.rawMaterial._id,

                    rawMaterialName:
                        item.rawMaterial.rawMaterialName,

                    rawMaterialCode:
                        item.rawMaterial.rawMaterialCode,

                    unit:
                        item.rawMaterial.unit,

                    batchNo: item.batchNo,

                    noOfBags: item.noOfBags,

                    bagWeightKg: item.bagWeightKg,

                    totalWeightKg: item.totalWeightKg,

                    availableWeightKg:
                        item.availableWeightKg,

                    usedWeightKg:
                        item.totalWeightKg -
                        item.availableWeightKg,

                    rate: item.rate,

                    amount: item.amount

                });

            });

        });


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.json({

            success: true,

            data: stockList

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};