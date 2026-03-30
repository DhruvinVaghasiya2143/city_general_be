const express = require("express");
const router = express.Router();

const {
  getDoctorDetailsByUserId,
  updateAppointmentStatus,
  getCompletedAppointments,
} = require("../controllers/doctorControllers");
router.get("/details/:userId", getDoctorDetailsByUserId);
router.patch("/appointment-status/:id", updateAppointmentStatus);
router.get("/prescriptions", getCompletedAppointments);
module.exports = router;
