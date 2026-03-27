const express = require("express");
const router = express.Router();
const {
  getAllAppointments,
} = require("../controllers/receptionistControllers");
const {
  markAsCompleted,
} = require("../controllers/doctorControllers");

router.get("/appointments", getAllAppointments);
router.put("/appointments/:id/complete", markAsCompleted);
module.exports = router;
