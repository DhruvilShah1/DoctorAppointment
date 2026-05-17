import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    specialties: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, "At least one specialty required"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("DoctorProfile", doctorProfileSchema);