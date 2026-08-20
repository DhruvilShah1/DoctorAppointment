import QueueJobs from "../Model/QueueJobs.js";
import Users from "../Model/Users.js";

const QueueController = {
  getPrescriptionQueue: async (req, res) => {

    try {

      const doctorId = req.user.id;


      const queueJobs = await QueueJobs
        .find({
          userId: doctorId,
        })
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,

        count: queueJobs.length,

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