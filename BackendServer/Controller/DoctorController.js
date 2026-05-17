import DoctorProfile from "../Model/DoctorProfile.js";
import Users from "../Model/Users.js";

const DoctorController = {
  createProfile: async (req, res) => {
    try {
      const userId = req.user.id; 
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== "doctor") {
        return res.status(403).json({
          message: "Only doctors can create profile",
        });
      }

      const {
        name,
        email,
        phone,
        title,
        experience,
        bio,
        address,
        specialties,
      } = req.body;

      if (
        !name ||
        !email ||
        !phone ||
        !title ||
        !experience ||
        !bio ||
        !address ||
        !specialties ||
        specialties.length === 0
      ) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      let profile = await DoctorProfile.findOne({ doctorId: userId });

      if (profile) {
        profile = await DoctorProfile.findOneAndUpdate(
          { doctorId: userId },
          {
            name,
            email,
            phone,
            title,
            experience,
            bio,
            address,
            specialties,
          },
          { new: true }
        );

        return res.status(200).json({
          message: "Profile updated successfully",
          profile,
        });
      }

      const newProfile = await DoctorProfile.create({
        doctorId: userId,
        name,
        email,
        phone,
        title,
        experience,
        bio,
        address,
        specialties,
      });

      return res.status(201).json({
        message: "Profile created successfully",
        profile: newProfile,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },

  getMyProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const profile = await DoctorProfile.findOne({
        doctorId: userId,
      }).populate("doctorId", "name email");

      if (!profile) {
        return res.status(404).json({
          message: "Profile not found",
        });
      }

      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },


 getDoctorProfile: async (req, res) => {
  try {

    // Get doctorId from params
    const { doctorId } = req.params;

    // Check doctorId
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // Find doctor profile
   const doctor = await DoctorProfile.findOne({
  doctorId,
}).populate("doctorId", "name email");

    // If doctor not found
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Doctor profile fetched successfully",
      doctor,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
};

export default DoctorController;