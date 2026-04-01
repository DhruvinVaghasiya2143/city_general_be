const express = require("express");
const router = express.Router();
const {
  addDrug,
  getDrugs,
  createInvoice,
  getInvoices,
  updateDrug,
  deleteDrug,
  getDashboardStats,
} = require("../controllers/pharmacistControllers");
const {
  getCompletedAppointments,
} = require("../controllers/doctorControllers");

router.get("/prescriptions", getCompletedAppointments);
router.post("/add-drug", addDrug);
router.put("/update-drug/:id", updateDrug);
router.delete("/delete-drug/:id", deleteDrug);
router.get("/drugs", getDrugs);
router.post("/invoices", createInvoice);
router.get("/invoices", getInvoices);
router.get("/stats", getDashboardStats);

module.exports = router;
