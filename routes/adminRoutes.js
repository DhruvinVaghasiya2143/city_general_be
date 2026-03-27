const express = require("express");
const adminControllers = require("../controllers/adminControllers");

const router = express.Router();

router.post("/add-staff", adminControllers.addStaff);
router.get("/stats", adminControllers.getDashboardStats);
router.get("/doctors", adminControllers.getDoctors);
router.get("/patients", adminControllers.getPatients);
router.get("/admins", adminControllers.getAdmins);
router.post("/services", adminControllers.addService);

module.exports = router;
