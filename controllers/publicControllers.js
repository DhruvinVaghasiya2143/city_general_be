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

    if (req.query.date) {
      const selectedDate = new Date(req.query.date);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);

      query.date = {
        $gte: selectedDate,
        $lt: nextDay,
      };
    } else if (filter === "today") {
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
      schedule: doctor.schedule, // ✅ NEW
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

        const emailSubject = `Appointment Confirmation - City General Hospital`;
        const emailText = `
Dear ${firstName} ${lastName},

Your appointment at City General Hospital has been confirmed.

Appointment Details:
-------------------
Doctor: Dr. ${appointmentDetails.doctorName}
Specialty: ${appointmentDetails.doctorSpecialty}
Date: ${new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Time: ${new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}

Please find your appointment confirmation details attached as a PDF. Please bring this with you (either printed or on your phone) when you visit the hospital.

If you have any questions, please contact us at support@citygeneralhospital.com or call our reception.

Regards,
City General Hospital Team
123 Health Ave, Medical City, MC 56789
        `.trim();

        const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color: #0f172a; color: #ffffff; padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Appointment Confirmed</h1>
                <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.8; font-weight: 500;">City General Hospital</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="font-size: 18px; margin-bottom: 24px;">Dear <strong>${firstName} ${lastName}</strong>,</p>
                <p style="margin-bottom: 24px; font-size: 16px;">Thank you for choosing City General Hospital. Your appointment has been scheduled successfully. Here are the details for your upcoming visit:</p>

                <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 30px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Chosen Specialist</span>
                        <strong style="font-size: 18px; color: #0f172a;">Dr. ${appointmentDetails.doctorName}</strong><br/>
                        <span style="font-size: 14px; color: #64748b;">${appointmentDetails.doctorSpecialty}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <div style="display: inline-block; width: 48%; min-width: 200px;">
                          <span style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Date</span>
                          <strong style="font-size: 16px; color: #0f172a;">${new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>
                        </div>
                        <div style="display: inline-block; width: 48%; min-width: 150px;">
                          <span style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Time</span>
                          <strong style="font-size: 16px; color: #0f172a;">${new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</strong>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 16px; margin-bottom: 24px;">We have attached a <strong>downloadable PDF confirmation</strong> to this email for your records. Please bring this with you (either printed or on your phone) when you visit the hospital.</p>

                <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 30px; text-align: center;">
                  <p style="font-size: 14px; color: #64748b; margin: 0;">We look forward to seeing you.</p>
                  <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 8px 0 0;">City General Hospital Team</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0 0 10px;">City General Hospital · 123 Health Ave · Medical City, MC 56789</p>
                <p style="margin: 0;">This is an automated confirmation of your session booking. If you did not make this request, please <a href="#" style="color: #6366f1; text-decoration: none;">contact support</a> immediately.</p>
              </td>
            </tr>
          </table>
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
      const emailText = `
Dear ${firstName},

Thank you for reaching out to City General Hospital. We have successfully received your message and appreciate you taking the time to contact us.

Inquiry Details:
-------------------
Department: ${department}
Status: Under Review

Our team will review your inquiry and get back to you as soon as possible. If your request is urgent, please feel free to contact us directly using the details provided on our website.

We look forward to assisting you.

Best regards,
City General Hospital Team
123 Health Ave, Medical City, MC 56789
      `.trim();

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color: #0f172a; color: #ffffff; padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Message Received</h1>
                <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.8; font-weight: 500;">City General Hospital</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="font-size: 18px; margin-bottom: 24px;">Dear <strong>${firstName}</strong>,</p>
                <p style="margin-bottom: 24px; font-size: 16px;">Thank you for reaching out to us. We have successfully received your message and appreciate you taking the time to contact us.</p>

                <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 30px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Department</span>
                        <strong style="font-size: 16px; color: #0f172a;">${department}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <span style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Status</span>
                        <strong style="font-size: 16px; color: #10b981;">Under Review</strong>
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 16px; margin-bottom: 24px;">Our team will review your inquiry and get back to you as soon as possible. If your request is urgent, please feel free to contact us directly using the details provided on our website.</p>

                <p style="font-size: 16px; margin-bottom: 24px;">We look forward to assisting you.</p>

                <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 30px; text-align: center;">
                  <p style="font-size: 14px; color: #64748b; margin: 0;">Warm regards,</p>
                  <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 8px 0 0;">City General Hospital</p>
                  <p style="font-size: 14px; color: #64748b; margin: 0;">Support Team</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0 0 10px;">City General Hospital · 123 Health Ave · Medical City, MC 56789</p>
                <p style="margin: 0;">This is an automated confirmation of your inquiry via our website. If you have questions, please <a href="#" style="color: #6366f1; text-decoration: none;">contact support</a>.</p>
              </td>
            </tr>
          </table>
        </div>
      `;

      await sendEmail(email, emailSubject, emailText, [], emailHtml);
    } catch (emailError) {
      console.error("Error sending contact confirmation email:", emailError);
      // We don't fail the request if and only if the email fails.
    }

    res
      .status(201)
      .json({ message: "Inquiry submitted successfully", inquiry: newInquiry });
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
