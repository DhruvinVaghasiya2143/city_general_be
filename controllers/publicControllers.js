const doctorModel = require("../models/doctor-model");
const getDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find();
    const formattedDoctors = doctors.map((doctor) => {
      return {
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        exp: doctor.exp,
        location: doctor.location,
        id: doctor.doctorId,
        email: doctor.email,
        officeNumber: doctor.officeNumber,
        specialty: doctor.specialty,
        department: doctor.department,
        workingHours: doctor.workingHours,
        credentials: doctor.credentials,
      };
    });
    res.status(200).json(formattedDoctors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctors" });
  }
};

const getDoctorsById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctors = await doctorModel.find({ doctorId: id });
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctors" });
  }
};

module.exports = {
  getDoctors,
  getDoctorsById,
};
