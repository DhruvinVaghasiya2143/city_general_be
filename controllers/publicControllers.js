const doctorModel = require("../models/doctor-model");
const appointmentModel = require("../models/appointment-model");
const usersModel = require("../models/user-model");
const passwordUtils = require("../utils/password-utils");
const serviceModel = require("../models/service-model");
const contactModel = require("../models/contact-model");

// ✅ Get appointments by doctor
// ✅ Get appointments by doctor
const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || "today";
    const skip = (page - 1) * limit;

    const query = {
      doctorId,
      status: { $ne: "cancelled" },
    };

    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query.date = {
        $gte: today,
        $lt: tomorrow,
      };
    }

    const totalItems = await appointmentModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const appointments = await appointmentModel
      .find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "firstName lastName email phone");

    console.log("appointments", appointments);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointmentsCount = await appointmentModel.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: { $ne: "cancelled" },
    });

    const completedTodayCount = await appointmentModel.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: "completed",
    });

    console.log("appointments", appointments);

    res.status(200).json({
      data: appointments,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
      stats: {
        todayAppointmentsCount,
        completedTodayCount,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

// ✅ Get doctor list
// ✅ Get doctor list
const getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const specialty = req.query.specialty; // ✅ New Filter
    const skip = (page - 1) * limit;

    const query = {};
    if (specialty) {
      query.specialty = specialty;
    }

    const totalItems = await doctorModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const doctors = await doctorModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email phone");

    const formattedDoctors = doctors.map((doctor) => ({
      firstName: doctor.userId?.firstName,
      lastName: doctor.userId?.lastName,
      email: doctor.userId?.email,
      phone: doctor.userId?.phone,
      specialty: doctor.specialty, // ✅ FIXED
      exp: doctor.exp, // ✅ FIXED
      location: doctor.location, // ✅ FIXED
      id: doctor.userId?._id,
    }));

    res.status(200).json({
      data: formattedDoctors,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching doctors" });
  }
};

// ✅ Get doctor by userId (FIXED)
const getDoctorsById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await doctorModel
      .findOne({ userId: id }) // ✅ FIXED
      .populate("userId", "firstName lastName email phone");

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor" });
  }
};

const sendEmail = require("../utils/sendEmail");
const { generateAppointmentPDF } = require("../utils/pdfGenerator");

// ✅ Create appointment (Improved with Email & PDF)
const createAppointment = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { date, concern, firstName, lastName, email, phone, doctorId } =
      req.body;

    const origin = req.headers.origin || req.headers.referer || "";
    const isLocal = origin.includes("localhost");

    // 🔥 Date Validation (Adjust for IST)
    const selectedDate = new Date(date);
    // Subtract 5 hours and 30 minutes (330 minutes) to convert nominal IST to real UTC
    if (!isLocal) {
      selectedDate.setMinutes(selectedDate.getMinutes() - 330);
    }

    const now = new Date();
    // Calculate end of tomorrow in IST, then convert back to UTC for comparison
    const maxDate = new Date(now.getTime());
    if (!isLocal) {
      maxDate.setMinutes(maxDate.getMinutes() + 330); // Shift to IST
    }
    maxDate.setDate(maxDate.getDate() + 1); // Move to tomorrow
    maxDate.setHours(23, 59, 59, 999); // End of the day
    if (!isLocal) {
      maxDate.setMinutes(maxDate.getMinutes() - 330); // Shift back to UTC limit
    }

    if (selectedDate < now) {
      return res
        .status(400)
        .json({ message: "Appointment time cannot be in the past" });
    }
    if (selectedDate > maxDate) {
      return res
        .status(400)
        .json({ message: "Appointments can only be booked for today or tomorrow" });
    }

    // 🔥 Check if patient already exists (Revised for optional email)
    let patient;
    if (email) {
      patient = await usersModel.findOne({ email });
    } else if (phone) {
      patient = await usersModel.findOne({ phone, role: "patient" });
    }

    if (!patient) {
      const hashedPassword = await passwordUtils.generateHashedPassword(
        phone || "Default@123",
      );

      patient = new usersModel({
        firstName,
        lastName,
        email: email || undefined,
        role: "patient",
        phone,
        password: hashedPassword,
      });

      await patient.save();
    } else {
      // ✅ Fix: Update existing patient's name if they are a patient
      if (patient.role === "patient") {
        patient.firstName = firstName;
        patient.lastName = lastName;
        await patient.save();
      }
    }

    const appointment = new appointmentModel({
      patientId: patient._id,
      date: selectedDate,
      concern,
      doctorId,
    });

    await appointment.save();

    // --- Send Confirmation Email with PDF ---
    if (email) {
      try {
        // Fetch Doctor details for the email/PDF
        const doctorUser = await usersModel.findById(doctorId);
        const doctorProfile = await doctorModel.findOne({ userId: doctorId });

        const appointmentDetails = {
          patientName: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          date: date,
          concern: concern,
          doctorName: doctorUser
            ? `${doctorUser.firstName} ${doctorUser.lastName}`
            : "Specialist",
          doctorSpecialty: doctorProfile?.specialty || "General Medicine",
        };

        const pdfBuffer = generateAppointmentPDF(appointmentDetails);

        const emailSubject = `Appointment Confirmed - City General Hospital`;
        const emailText = `Dear ${firstName},\n\nYour appointment at City General Hospital has been confirmed.\n\nDate: ${new Date(date).toLocaleDateString()}\nDoctor: Dr. ${appointmentDetails.doctorName}\n\nPlease find your appointment details attached as a PDF.\n\nRegards,\nCity General Hospital`;

        const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #137fec; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Appointment Confirmed</h1>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">City General Hospital</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Dear <strong>${firstName} ${lastName}</strong>,</p>
            <p>Thank you for choosing City General Hospital. Your appointment has been scheduled successfully.</p>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${appointmentDetails.doctorName}</p>
              <p style="margin: 5px 0;"><strong>Specialty:</strong> ${appointmentDetails.doctorSpecialty}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
            </div>

            <p>We have attached a <strong>downloadable PDF confirmation</strong> to this email for your records. Please bring this with you (either printed or on your phone) when you visit the hospital.</p>

            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
              <p style="font-size: 14px; color: #64748b; margin: 0;">We look forward to seeing you.</p>
              <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 5px 0 0;">City General Hospital Team</p>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            This is an automated message. Please do not reply directly to this email.
          </div>
        </div>
      `;

        await sendEmail(
          email,
          emailSubject,
          emailText,
          [
            {
              filename: "Appointment_Confirmation.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
          emailHtml,
        );
      } catch (emailError) {
        console.error("Error sending appointment email:", emailError);
        // We don't fail the request if email fails, but we log it
      }
    }

    res.status(201).json({ message: "Appointment created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating appointment" });
  }
};

// ✅ Get doctor details
const getDoctorDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const doctor = await doctorModel
      .findOne({ userId: userId })
      .populate("userId", "firstName lastName email phone");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor details" });
  }
};

// ✅ Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, prescription } = req.body;

    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { status };
    if (prescription !== undefined) {
      updateData.prescription = prescription;
    }

    const appointment = await appointmentModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res
      .status(200)
      .json({ message: "Status updated successfully", appointment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

// ✅ Get all services for the Services page
const getServices = async (req, res) => {
  try {
    const services = await serviceModel.find().sort({ createdAt: 1 });
    res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Error fetching services" });
  }
};

// ✅ Handle Contact Us Inquiries
const submitContactInquiry = async (req, res) => {
  try {
    const { firstName, lastName, email, department, message } = req.body;

    if (!firstName || !lastName || !email || !department || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newInquiry = new contactModel({
      firstName,
      lastName,
      email,
      department,
      message,
    });

    await newInquiry.save();

    // --- Send Confirmation Email to the User ---
    try {
      const emailSubject = `We've received your message - City General Hospital`;
      const emailText = `Dear ${firstName},\n\nThank you for reaching out to us. We have successfully received your message and appreciate you taking the time to contact us.\n\nOur team will review your inquiry and get back to you as soon as possible. If your request is urgent, please feel free to contact us directly using the details provided on our website.\n\nWe look forward to assisting you.\n\nBest regards,\nCity General Hospital\nSupport Team`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #137fec; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Message Received</h1>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">City General Hospital</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Dear <strong>${firstName}</strong>,</p>
            <p>Thank you for reaching out to us. We have successfully received your message and appreciate you taking the time to contact us.</p>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Department:</strong> ${department}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Under Review</p>
            </div>

            <p>Our team will review your inquiry and get back to you as soon as possible. If your request is urgent, please feel free to contact us directly using the details provided on our website.</p>

            <p>We look forward to assisting you.</p>

            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
              <p style="font-size: 14px; color: #64748b; margin: 0;">Warm regards,</p>
              <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 5px 0 0;">City General Hospital</p>
              <p style="font-size: 14px; color: #64748b; margin: 0;">Support Team</p>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            This is an automated confirmation of your inquiry via our website.
          </div>
        </div>
      `;

      await sendEmail(email, emailSubject, emailText, [], emailHtml);
    } catch (emailError) {
      console.error("Error sending contact confirmation email:", emailError);
      // We don't fail the request if and only if the email fails.
    }

    res.status(201).json({ message: "Inquiry submitted successfully", inquiry: newInquiry });
  } catch (error) {
    console.error("Error submitting contact inquiry:", error);
    res.status(500).json({ message: "Error submitting inquiry" });
  }
};

module.exports = {
  getDoctors,
  getDoctorsById,
  createAppointment,
  getAppointmentsByDoctorId,
  getDoctorDetailsByUserId,
  updateAppointmentStatus,
  getServices,
  submitContactInquiry,
};
