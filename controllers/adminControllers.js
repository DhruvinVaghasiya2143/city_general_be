const doctorModel = require("../models/doctor-model");
const User = require("../models/user-model");
const serviceModel = require("../models/service-model");
const passwordUtils = require("../utils/password-utils");

const addStaff = async (req, res) => {
  console.log("--- Add Staff Start ---");
  try {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      // Doctor specific fields
      officeNumber,
      specialty,
      exp,
      location,
      department,
      workingHours,
      qualifications,
      languages,
      consultationFee,
      hospitalName,
      bio,
    } = req.body;

    // Check for mandatory data
    const mandatoryFields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "role",
      "phone",
    ];
    const missingFields = mandatoryFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      console.warn("Validation Failed: Missing fields", missingFields);
      return res.status(400).json({
        success: false,
        message: `Validation Failed: Missing required data (${missingFields.join(", ")})`,
      });
    }

    console.log("Checking for existing user with email:", email);
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
      console.log("User found with ID:", user._id);
      if (role.toLowerCase() === "doctor") {
        const existingDoctor = await doctorModel.findOne({ userId: user._id });
        if (existingDoctor) {
          return res.status(400).json({
            success: false,
            message: "Conflict: A doctor profile already exists for this email",
          });
        }
      }
      user.role = role.toLowerCase();
      await user.save();
    } else {
      console.log("Creating brand new user...");
      isNewUser = true;
      const hashedPassword =
        await passwordUtils.generateHashedPassword(password);
      user = new User({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: role.toLowerCase(),
      });
      await user.save();
    }

    // Only create doctor profile if role is doctor
    if (role.toLowerCase() === "doctor") {
      console.log("Creating doctor profile...");
      const newDoctor = new doctorModel({
        userId: user._id,
        phone,
        officeNumber,
        specialty,
        exp,
        location,
        department,
        workingHours,
        qualifications,
        languages,
        consultationFee,
        hospitalName,
        bio,
      });
      await newDoctor.save();
    }

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully`,
      data: { id: user._id },
    });
  } catch (error) {
    console.error("--- Add Staff Error ---");
    res.status(500).json({
      success: false,
      message: "Server error during staff creation",
      error: error.message,
    });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};
const getDashboardStats = async (req, res) => {
  try {
    const doctorCount = await doctorModel.countDocuments();
    const patientCount = await User.countDocuments({ role: "patient" });
    const adminCount = await User.countDocuments({ role: "admin" });
    res.status(200).json({ doctorCount, patientCount, adminCount });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};
const getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;

    const doctors = await doctorModel
      .find()
      .populate("userId")
      .skip(skip)
      .limit(limit);

    const total = await doctorModel.countDocuments();

    res.status(200).json({
      users: doctors,
      total,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Error fetching doctors" });
  }
};
 
const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;

    const patients = await User.find({ role: "patient" })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: "patient" });

    res.status(200).json({
      users: patients,
      total,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Error fetching patients" });
  }
};

const getAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;

    const admins = await User.find({ role: "admin" }).skip(skip).limit(limit);

    const total = await User.countDocuments({ role: "admin" });

    res.status(200).json({
      users: admins,
      total,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Error fetching admins" });
  }
};

const addService = async (req, res) => {
  try {
    const { name, description, imageUrl, icon } = req.body;

    if (!name || !description || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, description, or imageUrl",
      });
    }

    const existingService = await serviceModel.findOne({ name });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists",
      });
    }

    const newService = new serviceModel({
      name,
      description,
      imageUrl,
      icon: icon || "MedicalServicesIcon", // Default icon if none provided
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: "Service added successfully",
      service: newService,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({
      success: false,
      message: "Server error during service creation",
      error: error.message,
    });
  }
};

module.exports = {
  addStaff,
  getAllUsers,
  getDashboardStats,
  getPatients,
  getAdmins,
  getDoctors,
  addService,
};
