import QueueJobs from "../Model/QueueJobs.js";
import Users from "../Model/Users.js";

const QueueController = {
  getPrescriptionQueue: async (req, res) => {

    try {

      const doctorId = req.user.id;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, parseInt(req.query.limit) || 5);
      const skip = (page - 1) * limit;

      const filter = { userId: doctorId };
      if (req.query.queueName) filter.queueName = req.query.queueName;
      if (req.query.referenceType) filter.referenceType = req.query.referenceType;

      const [queueJobs, total] = await Promise.all([
        QueueJobs.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        QueueJobs.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        jobs: queueJobs,
      });


    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid doctor id",
          error: error.message,
      })

      return res.status(500).json({
        success: false,
        message: "Failed to get prescription queue",
        error: error.message,
      });

    }
  },
};

export default QueueController;