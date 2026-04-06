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

    let appointments;
    if (filter === "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      appointments = await appointmentModel.aggregate([
        { $match: query },
        { $sort: { date: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "patientId",
            foreignField: "_id",
            as: "patientId",
          },
        },
        { $unwind: { path: "$patientId", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctorId",
          },
        },
        { $unwind: { path: "$doctorId", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            date: 1,
            concern: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            "patientId.firstName": 1,
            "patientId.lastName": 1,
            "patientId.email": 1,
            "patientId.phone": 1,
            "patientId._id": 1,
            "doctorId.firstName": 1,
            "doctorId.lastName": 1,
            "doctorId.email": 1,
            "doctorId.phone": 1,
            "doctorId._id": 1,
          },
        },
      ]);
    } else {
      appointments = await appointmentModel
        .find(query)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .populate("patientId", "firstName lastName email phone")
        .populate("doctorId", "firstName lastName email phone");
    }

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
