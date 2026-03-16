const mongoose = require("mongoose");

const doctorModel = mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    doctorId: {
      type: String,
      unique: true,
      default: () => "DOC" + Math.floor(1000 + Math.random() * 9000),
    },
    email: {
      type: String,
      unique: true,
    },
    phonenumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    officeNumber: {
      type: String,
      trim: true,
    },
    specialty: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    workingHours: {
      type: String,
      trim: true,
    },
    qualifications: {
      type: String,
      trim: true,
    },
    languages: {
      type: String,
      trim: true,
    },
    consultationFee: {
      type: String,
      trim: true,
    },
    hospitalName: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: "doctor",
    },
    exp: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorModel);
