const appointmentModel = require("../models/appointment-model");
const doctorModel = require("../models/doctor-model");
const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointments = await appointmentModel.find({ doctorId }).populate({
      path: "patientId",
      select: "firstName lastName email phone",
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments" });
  }
};
const markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentModel.findByIdAndUpdate(
      id,
      { status: "completed" },
      { new: true },
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({
      message: "Appointment marked as completed",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking appointment as completed" });
  }
};

const getDoctorDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const doctor = await doctorModel
      .findOne({ userId: userId })
      .populate("userId");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor details" });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await appointmentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: `Appointment marked as ${status}`,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating appointment status" });
  }
};

module.exports = {
  getAppointmentsByDoctorId,
  getDoctorDetailsByUserId,
  updateAppointmentStatus,
  markAsCompleted,
};
