const express = require("express");
const authControllers = require("../controllers/authControllers");

const router = express.Router();

router
  .post("/register", authControllers.createUser)
  .post("/login", authControllers.loginUser)
  .post("/reset-password", authControllers.resetPassword);

module.exports = router;
