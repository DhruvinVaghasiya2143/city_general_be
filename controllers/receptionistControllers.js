const appointmentModel = require("../models/appointment-model");

const getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || "today";
    const skip = (page - 1) * limit;

    const query = {};

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointmentsCount = await appointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    const completedTodayCount = await appointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: "completed",
    });

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
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

module.exports = {
  getAllAppointments,
};
