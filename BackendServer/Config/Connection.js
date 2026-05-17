import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/Doctor_Appointment");
    
    console.log("MongoDB Connected 🚀");
  } catch (error) {
    console.error("Connection Error:", error.message);
  }
};

