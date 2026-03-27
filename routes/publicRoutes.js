const express = require("express");
const publicController = require("../controllers/publicControllers");

const router = express.Router();

router
  .get("/doctors", publicController.getDoctors)
  .get("/doctors/:id", publicController.getDoctorsById)
  .get("/services", publicController.getServices)
  .post("/appointment", publicController.createAppointment);

module.exports = router;
