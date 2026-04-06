const express = require("express");
const publicController = require("../controllers/publicControllers");

const router = express.Router();

router
  .get("/doctors", publicController.getDoctors)
  .get("/doctors/:id", publicController.getDoctorsById)
  .get("/services", publicController.getServices)
  .get(
    "/appointments-by-doctor/:doctorId",
    publicController.getAppointmentsByDoctorId,
  )
  .post("/appointment", publicController.createAppointment)
  .post("/contact", publicController.submitContactInquiry);

module.exports = router;
