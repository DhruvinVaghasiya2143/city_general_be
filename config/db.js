const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.info("Database connected successfully🎉.");
  } catch (error) {
    console.error("Database connection failed❌.", error);
    process.exit(1);
  }
};

module.exports = connectDB;
