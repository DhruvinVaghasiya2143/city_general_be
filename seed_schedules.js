const mongoose = require("mongoose");
const dotenv = require("dotenv");
const doctorModel = require("./models/doctor-model");

dotenv.config();

const seedSchedules = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to database for schedule seeding.");

    const doctors = await doctorModel.find();
    console.log(`Found ${doctors.length} doctors to update.`);

    const defaultSchedule = [
      { startTime: "09:00", endTime: "09:30" },
      { startTime: "09:30", endTime: "10:00" },
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "10:30", endTime: "11:00" },
      { startTime: "11:00", endTime: "11:30" },
      { startTime: "11:30", endTime: "12:00" },
      { startTime: "13:00", endTime: "13:30" },
      { startTime: "13:30", endTime: "14:00" },
      { startTime: "14:00", endTime: "14:30" },
      { startTime: "14:30", endTime: "15:00" },
      { startTime: "15:00", endTime: "15:30" },
      { startTime: "15:30", endTime: "16:00" },
      { startTime: "16:00", endTime: "16:30" },
      { startTime: "16:30", endTime: "17:00" },
      { startTime: "17:00", endTime: "17:30" },
      { startTime: "17:30", endTime: "18:00" },
      { startTime: "18:00", endTime: "18:30" },
      { startTime: "18:30", endTime: "19:00" },
      { startTime: "19:00", endTime: "19:30" },
      { startTime: "19:30", endTime: "20:00" },
    ];

    for (const doctor of doctors) {
      doctor.schedule = defaultSchedule;
      await doctor.save();
    }

    console.log("Schedules seeded successfully for all doctors.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding schedules:", error);
    process.exit(1);
  }
};

seedSchedules();
