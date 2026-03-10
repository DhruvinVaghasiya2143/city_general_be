const User = require("../models/user-model");
const passwordUtils = require("../utils/password-utils");

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const isUserMendatoryDataMissing =
      !firstName || !lastName || !email || !password || !role;

    if (isUserMendatoryDataMissing) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    const hashedPassword = await passwordUtils.generateHashedPassword(password);

    const userToCreate = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    await userToCreate.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createUser,
};
