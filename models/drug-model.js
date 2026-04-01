const mongoose = require("mongoose");

const drugSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },
    manufacturerCompany: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    pharmacistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Optional: Store the pharmacist who added the drug
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Drug", drugSchema);
