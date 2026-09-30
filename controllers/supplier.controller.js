const Supplier = require("../models/supplier");



exports.createSupplier = async (req, res) => {

    try {

        const {

            supplierName,
            supplierCode,
            supplierType,
            contactPerson,
            mobileNumber,
            alternateMobileNumber,
            email,
            address,
            city,
            state,
            pincode,
            gstNumber,
            panNumber,
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode,
            paymentTerms,
            creditDays,
            openingBalance

        } = req.body;

        const supplierExists = await Supplier.findOne({
            supplierCode
        });

        if (supplierExists) {

            return res.status(400).json({
                success: false,
                message: "Supplier Code already exists."
            });

        }

        const supplier = await Supplier.create(req.body);

        res.status(201).json({

            success: true,
            message: "Supplier created successfully.",
            data: supplier

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


// get all

exports.getAllSuppliers = async (req, res) => {

    try {

        const suppliers = await Supplier.find({

            isDeleted: false

        }).sort({

            createdAt: -1

        });

        res.json({

            success: true,

            count: suppliers.length,

            data: suppliers

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// get by id

exports.getSupplierById = async (req, res) => {

    try {

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier || supplier.isDeleted) {

            return res.status(404).json({

                success: false,

                message: "Supplier not found."

            });

        }

        res.json({

            success: true,

            data: supplier

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// Update Supplier

exports.updateSupplier = async (req, res) => {

    try {

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {

            return res.status(404).json({

                success: false,

                message: "Supplier not found."

            });

        }

        Object.assign(supplier, req.body);

        await supplier.save();

        res.json({

            success: true,

            message: "Supplier updated successfully.",

            data: supplier

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// Delete Supplier (Soft Delete)
exports.deleteSupplier = async (req, res) => {

    try {

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {

            return res.status(404).json({

                success: false,

                message: "Supplier not found."

            });

        }

        supplier.isDeleted = true;

        await supplier.save();

        res.json({

            success: true,

            message: "Supplier deleted successfully."

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};