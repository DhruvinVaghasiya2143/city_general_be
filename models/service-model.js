const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String, // Icon name or identifier
      required: true,
    },
    imageUrl: {
      type: String, // URL for department image
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Service", serviceSchema);
