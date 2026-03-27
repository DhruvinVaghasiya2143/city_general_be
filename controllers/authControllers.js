const User = require("../models/user-model");
const passwordUtils = require("../utils/password-utils");

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone } = req.body;

    const isUserMendatoryDataMissing =
      !firstName || !lastName || !email || !password || !role || !phone;

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
      phone,
      password: hashedPassword,
      role,
    });

    await userToCreate.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email, role: role.toLowerCase() });
    console.log("user", user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await passwordUtils.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.log("error", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createUser,
  loginUser,
};
