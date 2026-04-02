const express = require("express");
const router = express.Router();
const {
  getAllAppointments,
} = require("../controllers/receptionistControllers");
const {
  markAsCompleted,
  cancelAppointment,
} = require("../controllers/doctorControllers");

router.get("/appointments", getAllAppointments);
router.put("/appointments/:id/complete", markAsCompleted);
router.put("/appointments/:id/cancel", cancelAppointment);
module.exports = router;
