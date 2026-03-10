const mongoose = require("mongoose");

const userModel = mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
    },
    role: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userModel);
