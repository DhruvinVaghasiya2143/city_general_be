const express = require("express");
const adminControllers = require("../controllers/adminControllers");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post("/add-staff", adminControllers.addStaff);
router.get("/stats", adminControllers.getDashboardStats);
router.get("/doctors", adminControllers.getDoctors);
router.get("/patients", adminControllers.getPatients);
router.get("/admins", adminControllers.getAdmins);
router.get("/pharmacists", adminControllers.getPharmacists);
router.get("/receptionists", adminControllers.getReceptionists);
router.get("/services", adminControllers.getServices);
router.post("/services", upload.single("serviceImage"), adminControllers.addService);
router.put("/services/:id", upload.single("serviceImage"), adminControllers.updateService);
router.delete("/services/:id", adminControllers.deleteService);
router.put("/users/:id", adminControllers.updateUser);
router.delete("/users/:id", adminControllers.deleteUser);

module.exports = router;
