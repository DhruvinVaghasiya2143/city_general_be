const express = require("express");
const router = express.Router();
const {
  getAppointmentsByDoctorId,
  createAppointment,
  updateAppointmentStatus,
} = require("../controllers/publicControllers");
router.get("/appointments/:doctorId", getAppointmentsByDoctorId);
router.post("/create", createAppointment);
router.patch("/status/:id", updateAppointmentStatus);
module.exports = router;
