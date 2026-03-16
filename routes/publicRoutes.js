const express = require("express");
const publicController = require("../controllers/publicControllers");

const router = express.Router();
router.get("/doctors", publicController.getDoctors);
router.get("/doctors/:id", publicController.getDoctorsById);
module.exports = router;
