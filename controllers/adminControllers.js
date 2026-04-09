const doctorModel = require("../models/doctor-model");
const User = require("../models/user-model");
const serviceModel = require("../models/service-model");
const passwordUtils = require("../utils/password-utils");
const { put } = require("@vercel/blob");



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
    const pharmacistCount = await User.countDocuments({ role: "pharmacist" });
    const receptionistCount = await User.countDocuments({ role: "receptionist" });
    res.status(200).json({ doctorCount, patientCount, adminCount, pharmacistCount, receptionistCount });
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

const getPharmacists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;

    const pharmacists = await User.find({ role: "pharmacist" }).skip(skip).limit(limit);

    const total = await User.countDocuments({ role: "pharmacist" });

    res.status(200).json({
      users: pharmacists,
      total,
    });
  } catch (error) {
    console.error("Error fetching pharmacists:", error);
    res.status(500).json({ message: "Error fetching pharmacists" });
  }
};

const getReceptionists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;

    const receptionists = await User.find({ role: "receptionist" }).skip(skip).limit(limit);

    const total = await User.countDocuments({ role: "receptionist" });

    res.status(200).json({
      users: receptionists,
      total,
    });
  } catch (error) {
    console.error("Error fetching receptionists:", error);
    res.status(500).json({ message: "Error fetching receptionists" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, email, phone },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Attempt to also clean up doctor model if it's a doctor
    if (deletedUser.role === 'doctor') {
        await doctorModel.findOneAndDelete({ userId: id });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


const addService = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    let { imageUrl } = req.body;

    // Handle file upload if present
    if (req.file) {
      const blob = await put(req.file.originalname, req.file.buffer, {
        access: "public",
        contentType: req.file.mimetype,
        addRandomSuffix: true,
      });
      imageUrl = blob.url;
    }

    if (!name || !description || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, description, or imageUrl (file)",
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
      icon: icon || "MedicalServicesIcon",
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

const getServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;

    const services = await serviceModel.find().skip(skip).limit(limit);
    const total = await serviceModel.countDocuments();

    res.status(200).json({
      users: services, // kept as 'users' so the frontend pagination fits perfectly
      total,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Error fetching services" });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    let { imageUrl } = req.body;

    // Handle file upload if present
    if (req.file) {
      const blob = await put(req.file.originalname, req.file.buffer, {
        access: "public",
        contentType: req.file.mimetype,
        addRandomSuffix: true,
      });
      imageUrl = blob.url;
    }

    const updatedService = await serviceModel.findByIdAndUpdate(
      id,
      { name, description, imageUrl, icon },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedService = await serviceModel.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  addStaff,
  getAllUsers,
  getDashboardStats,
  getPatients,
  getAdmins,
  getPharmacists,
  getReceptionists,
  getDoctors,
  addService,
  getServices,
  updateService,
  deleteService,
  updateUser,
  deleteUser,
};
