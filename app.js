const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const receptionistRoutes = require("./routes/receptionistRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const pharmacistRoutes = require("./routes/pharmacistRoutes");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["https://citygeneralfe.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/pharmacist", pharmacistRoutes);

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Server is running successfully! 🚀", success: true });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.info(`Server started successfully on port ${PORT}🎉.`);
});
