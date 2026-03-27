const doctorModel = require("../models/doctor-model");
const appointmentModel = require("../models/appointment-model");
const usersModel = require("../models/user-model");
const passwordUtils = require("../utils/password-utils");
const serviceModel = require("../models/service-model");

// ✅ Get appointments by doctor
// ✅ Get appointments by doctor
const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || "today";
    const skip = (page - 1) * limit;

    const query = { doctorId };

    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query.date = {
        $gte: today,
        $lt: tomorrow,
      };
    }

    const totalItems = await appointmentModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const appointments = await appointmentModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "firstName lastName email phone");

    console.log("appointments", appointments);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointmentsCount = await appointmentModel.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
    });

    const completedTodayCount = await appointmentModel.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: "completed",
    });

    res.status(200).json({
      data: appointments,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
      stats: {
        todayAppointmentsCount,
        completedTodayCount,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

// ✅ Get doctor list
// ✅ Get doctor list
const getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const specialty = req.query.specialty; // ✅ New Filter
    const skip = (page - 1) * limit;

    const query = {};
    if (specialty) {
      query.specialty = specialty;
    }

    const totalItems = await doctorModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const doctors = await doctorModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email phone");

    const formattedDoctors = doctors.map((doctor) => ({
      firstName: doctor.userId?.firstName,
      lastName: doctor.userId?.lastName,
      email: doctor.userId?.email,
      phone: doctor.userId?.phone,
      specialty: doctor.specialty, // ✅ FIXED
      exp: doctor.exp, // ✅ FIXED
      location: doctor.location, // ✅ FIXED
      id: doctor.userId?._id,
    }));

    res.status(200).json({
      data: formattedDoctors,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching doctors" });
  }
};

// ✅ Get doctor by userId (FIXED)
const getDoctorsById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await doctorModel
      .findOne({ userId: id }) // ✅ FIXED
      .populate("userId", "firstName lastName email phone");

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor" });
  }
};

// ✅ Create appointment (Improved)
const createAppointment = async (req, res) => {
  try {
    const { date, concern, firstName, lastName, email, phone, doctorId } =
      req.body;

    // 🔥 Check if patient already exists (VERY IMPORTANT)
    let patient = await usersModel.findOne({ email });

    if (!patient) {
      const hashedPassword = await passwordUtils.generateHashedPassword(
        phone || "Default@123",
      );

      patient = new usersModel({
        firstName,
        lastName,
        email,
        role: "patient",
        phone,
        password: hashedPassword,
      });

      await patient.save();
    }

    const appointment = new appointmentModel({
      patientId: patient._id,
      date,
      concern,
      doctorId,
    });

    await appointment.save();

    res.status(201).json({ message: "Appointment created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating appointment" });
  }
};

// ✅ Get doctor details
const getDoctorDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const doctor = await doctorModel
      .findOne({ userId: userId })
      .populate("userId", "firstName lastName email phone");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor details" });
  }
};

// ✅ Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await appointmentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res
      .status(200)
      .json({ message: "Status updated successfully", appointment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

// ✅ Get all services for the Services page
const getServices = async (req, res) => {
  try {
    const services = await serviceModel.find().sort({ createdAt: 1 });
    res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Error fetching services" });
  }
};

module.exports = {
  getDoctors,
  getDoctorsById,
  createAppointment,
  getAppointmentsByDoctorId,
  getDoctorDetailsByUserId,
  updateAppointmentStatus,
  getServices,
};
