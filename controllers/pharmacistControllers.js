const appointmentModel = require("../models/appointment-model");
const drugModel = require("../models/drug-model");
const invoiceModel = require("../models/invoice-model");
const sendEmail = require("../utils/sendEmail");
const { generateInvoicePDF } = require("../utils/pdfGenerator");

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

    if (emailId) {
      const emailSubject = `Invoice ${invoiceNumber} - City General Hospital Pharmacy`;
      const emailText = `
Dear ${patientName},

Thank you for visiting City General Hospital. Please find the details of your recent pharmacy purchase below:

Invoice Details:
-------------------
Invoice Number: ${invoiceNumber}
Total Amount: ₹${totalAmount}

For your records, we have attached the full PDF invoice to this email, which contains a detailed breakdown of the medicines and charges.

If you have any questions, please contact our pharmacy department or call our reception.

Regards,
City General Hospital Pharmacy
123 Health Ave, Medical City, MC 56789
      `.trim();

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color: #0f172a; color: #ffffff; padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Pharmacy Invoice</h1>
                <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.8; font-weight: 500;">City General Hospital</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="font-size: 18px; margin-bottom: 24px;">Dear <strong>${patientName}</strong>,</p>
                <p style="margin-bottom: 24px; font-size: 16px;">Thank you for visiting City General Hospital. Your pharmacy invoice was generated successfully. Please find the summary below:</p>

                <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 30px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Invoice Number</span>
                        <strong style="font-size: 16px; color: #0f172a;">${invoiceNumber}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <span style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Total Amount</span>
                        <strong style="font-size: 24px; color: #137fec;">₹${totalAmount}</strong>
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 16px; margin-bottom: 24px;">For your records, we have attached the <strong>full PDF invoice</strong> to this email, which contains a detailed breakdown of the medicines and charges.</p>

                <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 30px; text-align: center;">
                  <p style="font-size: 14px; color: #64748b; margin: 0;">Kind Regards,</p>
                  <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 8px 0 0;">The Pharmacy Team</p>
                  <p style="font-size: 14px; color: #64748b; margin: 0;">City General Hospital</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0 0 10px;">City General Hospital Pharmacy · 123 Health Ave · Medical City, MC 56789</p>
                <p style="margin: 0;">This is an automated notification. If you have questions, please <a href="#" style="color: #6366f1; text-decoration: none;">contact support</a>.</p>
              </td>
            </tr>
          </table>
        </div>
      `;

      // Generate PDF buffer
      const pdfBuffer = generateInvoicePDF(newInvoice);
      
      const attachments = [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ];

      await sendEmail(emailId, emailSubject, emailText, attachments, emailHtml);
    }

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("error during createInvoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the invoice",
      error: error.message,
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
