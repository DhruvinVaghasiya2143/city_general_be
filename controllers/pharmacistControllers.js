const appointmentModel = require("../models/appointment-model");
const drugModel = require("../models/drug-model");
const invoiceModel = require("../models/invoice-model");

const addDrug = async (req, res) => {
  try {
    const {
      name,
      content,
      category,
      manufacturerCompany,
      stock,

      price,
      expiryDate,
      pharmacistId,
    } = req.body;

    if (
      !name ||
      !content ||
      !category ||
      !manufacturerCompany ||
      !stock ||
      !price ||
      !expiryDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required drug information",
      });
    }

    const drugToCreate = new drugModel({
      name,
      content,
      category,
      manufacturerCompany,
      stock,

      price,
      expiryDate,
      pharmacistId,
    });

    await drugToCreate.save();

    return res.status(201).json({
      success: true,
      message: "Drug added successfully",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while adding the drug",
    });
  }
};

const getDrugs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await drugModel.countDocuments();
    const drugs = await drugModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      data: drugs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching drugs",
    });
  }
};

const createInvoice = async (req, res) => {
  try {
    const {
      patientName,
      mobileNumber,
      emailId,
      pharmacistId,
      items,
      totalAmount,
    } = req.body;

    if (
      !patientName ||
      !mobileNumber ||
      !pharmacistId ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required invoice information",
      });
    }

    // Generate unique invoice number: INV-TIMESTAMP-RANDOM
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newInvoice = new invoiceModel({
      invoiceNumber,
      patientName,
      mobileNumber,
      emailId,
      pharmacistId,
      items,
      totalAmount,
    });

    await newInvoice.save();

    // Decrement drug inventory
    for (const item of items) {
      await drugModel.findByIdAndUpdate(item.drugId, {
        $inc: { stock: -item.quantity },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: newInvoice,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the invoice",
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await invoiceModel.countDocuments();
    const invoices = await invoiceModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching invoices",
    });
  }
};

const updateDrug = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      content,
      category,
      manufacturerCompany,
      stock,
      price,
      expiryDate,
    } = req.body;

    const updatedDrug = await drugModel.findByIdAndUpdate(
      id,
      {
        name,
        content,
        category,
        manufacturerCompany,
        stock,
        price,
        expiryDate,
      },
      { new: true },
    );

    if (!updatedDrug) {
      return res.status(404).json({
        success: false,
        message: "Drug not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drug updated successfully",
      data: updatedDrug,
    });
  } catch (error) {
    console.error("Error updating drug:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the drug",
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const totalMedicines = await drugModel.countDocuments();
    const outOfStock = await drugModel.countDocuments({ stock: { $lte: 10 } });

    const monthlyInvoices = await invoiceModel.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalMonthlyRevenue =
      monthlyInvoices.length > 0 ? monthlyInvoices[0].totalRevenue : 0;
    const completedInvoices = await invoiceModel.countDocuments();

    return res.status(200).json({
      success: true,
      stats: {
        totalMedicines,
        outOfStock,
        totalMonthlyRevenue,
        completedInvoices,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching dashboard stats",
    });
  }
};

const deleteDrug = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDrug = await drugModel.findByIdAndDelete(id);

    if (!deletedDrug) {
      return res.status(404).json({
        success: false,
        message: "Drug not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drug deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting drug:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the drug",
    });
  }
};

module.exports = {
  addDrug,
  getDrugs,
  updateDrug,
  deleteDrug,
  createInvoice,
  getInvoices,
  getDashboardStats,
};
