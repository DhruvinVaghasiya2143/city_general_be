const mongoose = require("mongoose");

const doctorModel = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
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
    exp: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    schedule: [
      {
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["completed", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorModel);
