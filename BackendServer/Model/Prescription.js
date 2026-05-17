import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  strength: { type: String },
  days: { type: Number },
  medicineChecker: { type: Boolean, default: false },

  


  timing: {
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },

    night: { type: Boolean, default: false },
  },
});

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      unique: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: { type: String, default: "" },
    slot: { type: String, default: "" },

    instructions: { type: String, default: "" },

    medicines: [medicineSchema],

    signature: {
      type: String,
      default: null,
    },

    qrCode: {
      type: String,
      default: null,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "invalid"],
      default: "pending",
    },

    pdfUrl : {
 type: String,
      default: null,
    } , 

    verifiedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "issued"],
      default: "issued",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);