const express = require("express");
const adminControllers = require("../controllers/adminControllers");

const router = express.Router();

router.post("/add-staff", adminControllers.addStaff);
router.get("/stats", adminControllers.getDashboardStats);
router.get("/doctors", adminControllers.getDoctors);
router.get("/patients", adminControllers.getPatients);
router.get("/admins", adminControllers.getAdmins);
router.get("/services", adminControllers.getServices);
router.post("/services", adminControllers.addService);
router.put("/services/:id", adminControllers.updateService);
router.delete("/services/:id", adminControllers.deleteService);

module.exports = router;
