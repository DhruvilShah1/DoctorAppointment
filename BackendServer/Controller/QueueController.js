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
        })
        .lean();

      const patientIds = queueJobs
        .map((job) => job.patientId)
        .filter(Boolean);

      const patients = await Users
        .find({
          _id: { $in: patientIds },
        })
        .select("name email");

      const patientMap = new Map(
        patients.map((patient) => [
          patient._id.toString(),
          patient,
        ])
      );

      const jobs = queueJobs.map((job) => ({
        ...job,

        patient: job.patientId
          ? patientMap.get(job.patientId.toString())
          : null,
      }));

      return res.status(200).json({
        success: true,
        count: jobs.length,
        jobs,
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