const express = require("express");
const router = express.Router();

const {
  getDoctorDetailsByUserId,
  updateAppointmentStatus,
} = require("../controllers/doctorControllers");
router.get("/details/:userId", getDoctorDetailsByUserId);
router.patch("/appointment-status/:id", updateAppointmentStatus);
module.exports = router;
