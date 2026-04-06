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
        const emailText = `
Dear ${patientName},

This email is to confirm that your appointment at City General Hospital has been cancelled.

Appointment Details:
-------------------
Doctor: Dr. ${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}
Date: ${new Date(appointment.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Reason: ${appointment.concern || "N/A"}

Please find the cancellation record attached for your reference.

If you would like to reschedule, please visit our website or contact our reception desk.

Sincerely,
City General Hospital Team
123 Health Ave, Medical City, MC 56789
        `.trim();

        const emailHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: #dc2626; color: #ffffff; padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Appointment Cancelled</h1>
                  <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.8; font-weight: 500;">City General Hospital</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="font-size: 18px; margin-bottom: 24px;">Dear <strong>${patientName}</strong>,</p>
                  <p style="margin-bottom: 24px; font-size: 16px;">This email is to confirm that your appointment at City General Hospital has been <strong>cancelled</strong>.</p>
                  
                  <div style="background-color: #fef2f2; padding: 24px; border-radius: 12px; border: 1px solid #fee2e2; margin: 30px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #fee2e2;">
                          <span style="font-size: 14px; color: #b91c1c; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Doctor</span>
                          <strong style="font-size: 18px; color: #7f1d1d;">Dr. ${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <div style="display: inline-block; width: 48%; min-width: 200px;">
                            <span style="font-size: 14px; color: #b91c1c; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Date</span>
                            <strong style="font-size: 16px; color: #7f1d1d;">${new Date(appointment.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                          </div>
                          <div style="display: inline-block; width: 48%; min-width: 150px;">
                            <span style="font-size: 14px; color: #b91c1c; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Reason</span>
                            <strong style="font-size: 16px; color: #7f1d1d;">${appointment.concern || "N/A"}</strong>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="font-size: 16px; margin-bottom: 24px;">We have attached a <strong>cancellation record</strong> to this email for your reference.</p>
                  <p style="font-size: 16px; margin-bottom: 24px;">If you would like to reschedule, please visit our website or contact our reception desk.</p>
                  
                  <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 30px; text-align: center;">
                    <p style="font-size: 14px; color: #64748b; margin: 0;">Sincerely,</p>
                    <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 8px 0 0;">City General Hospital Team</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0 0 10px;">City General Hospital · 123 Health Ave · Medical City, MC 56789</p>
                  <p style="margin: 0;">This is an automated notification. If you have questions, please <a href="#" style="color: #6366f1; text-decoration: none;">contact support</a>.</p>
                </td>
              </tr>
            </table>
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
