const appointmentModel = require("../models/appointment-model");
const doctorModel = require("../models/doctor-model");
const sendEmail = require("../utils/sendEmail");
const { generateCancellationPDF } = require("../utils/pdfGenerator");
const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointments = await appointmentModel.find({ doctorId }).populate({
      path: "patientId",
      select: "firstName lastName email phone",
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments" });
  }
};
const markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentModel.findByIdAndUpdate(
      id,
      { status: "completed" },
      { new: true },
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({
      message: "Appointment marked as completed",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking appointment as completed" });
  }
};

const getDoctorDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const doctor = await doctorModel
      .findOne({ userId: userId })
      .populate("userId");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor details" });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, prescription } = req.body;

    if (!["pending", "completed", "cancelled"].includes(status)) {
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

    res.status(200).json({
      message: `Appointment marked as ${status}`,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating appointment status" });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentModel
      .findByIdAndUpdate(id, { status: "cancelled" }, { new: true })
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "firstName lastName");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // --- Send Cancellation Email if Patient Email exists ---
    if (appointment.patientId?.email) {
      try {
        const pdfBuffer = generateCancellationPDF(appointment);
        const patientName = `${appointment.patientId.firstName} ${appointment.patientId.lastName}`;

        const emailSubject = `Appointment Cancelled - City General Hospital`;
        const emailText = `Dear ${patientName},\n\nYour appointment at City General Hospital has been cancelled.\n\nDate: ${new Date(appointment.date).toLocaleDateString()}\nDoctor: Dr. ${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}\n\nPlease find the cancellation record attached.\n\nRegards,\nCity General Hospital`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #dc2626; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Appointment Cancelled</h1>
              <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">City General Hospital</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px;">Dear <strong>${patientName}</strong>,</p>
              <p>This email is to confirm that your appointment at City General Hospital has been <strong>cancelled</strong>.</p>
              
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fee2e2; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0;"><strong>Reason:</strong> ${appointment.concern || "N/A"}</p>
              </div>
              
              <p>We have attached a <strong>cancellation record</strong> to this email for your reference.</p>
              <p>If you would like to reschedule, please visit our website or contact our reception desk.</p>
              
              <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
                <p style="font-size: 14px; color: #64748b; margin: 0;">Sincerely,</p>
                <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 5px 0 0;">City General Hospital Team</p>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              This is an automated message. Please do not reply directly to this email.
            </div>
          </div>
        `;

        await sendEmail(
          appointment.patientId.email,
          emailSubject,
          emailText,
          [
            {
              filename: `Cancellation_Record_${id.toString().slice(-6)}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
          emailHtml,
        );
        console.log(`Cancellation email sent to ${appointment.patientId.email}`);
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError);
      }
    }

    res.status(200).json({
      message: "Appointment marked as cancelled",
      appointment,
    });
  } catch (error) {
    console.error("Error in cancelAppointment:", error);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
};

const getCompletedAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await appointmentModel.countDocuments({
      status: "completed",
      prescription: { $nin: ["", null] },
    });

    const appointments = await appointmentModel
      .find({ status: "completed", prescription: { $nin: ["", null] } })
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "firstName lastName")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching completed appointments" });
  }
};

module.exports = {
  getAppointmentsByDoctorId,
  getDoctorDetailsByUserId,
  updateAppointmentStatus,
  markAsCompleted,
  cancelAppointment,
  getCompletedAppointments,
};
