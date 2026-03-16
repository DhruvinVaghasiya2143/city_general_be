const doctorModel = require("../models/doctor-model");

const addDoctor = async (req, res) => {
  try {
    console.log(req.body);

    const {
      fullName,
      email,
      phonenumber,
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
      role,
    } = req.body;

    await doctorModel.create({
      fullName,
      email,
      phonenumber,
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
      role,
    });
    res.status(201).json({ message: "Doctor created successfully" });
  } catch (error) {
    console.error("Error creating doctor:", error);
    res
      .status(500)
      .json({ message: "Error creating doctor", error: error.message });
  }
};

module.exports = {
  addDoctor,
};
