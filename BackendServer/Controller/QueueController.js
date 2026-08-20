import QueueJobs from "../Model/QueueJobs.js";
import Users from "../Model/Users.js";

const QueueController = {
  getPrescriptionQueue: async (req, res) => {

    try {

      const doctorId = req.user.id;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, parseInt(req.query.limit) || 5);
      const skip = (page - 1) * limit;

      const [queueJobs, total] = await Promise.all([
        QueueJobs.find({ userId: doctorId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        QueueJobs.countDocuments({ userId: doctorId }),
      ]);

      return res.status(200).json({
        success: true,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        jobs: queueJobs,
      });


    } catch (error) {

      console.error(
        "❌ Get Prescription Queue Error:",
        error
      );


      return res.status(500).json({
        success: false,

        message: "Failed to get prescription queue",

        error: error.message,
      });

    }
  },
};

export default QueueController;