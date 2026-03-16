const express = require("express");
const adminControllers = require("../controllers/adminControllers");

const router = express.Router();

router.post("/add-doctor", adminControllers.addDoctor);

module.exports = router;
