import mongoose from "mongoose";

const breakSchema = new mongoose.Schema(
  {
    start: String,
    end: String,
  },
  { _id: false }
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    isOff: {
      type: Boolean,
      default: false,
    },

    start: String, 
    end: String,  

    slotDuration: {
      type: Array,
    },

    maxPerSlot: {
      type: Number,
      default: 1,
    },

    breaks: [breakSchema],
  },
  { timestamps: true }
);

doctorScheduleSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export default mongoose.model("DoctorSchedule", doctorScheduleSchema);