import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = "mongodb://dhruvilshah3383_db_user:dhruvil_d_s_p@ac-xce6ln3-shard-00-00.mc0gtil.mongodb.net:27017,ac-xce6ln3-shard-00-01.mc0gtil.mongodb.net:27017,ac-xce6ln3-shard-00-02.mc0gtil.mongodb.net:27017/?ssl=true&replicaSet=atlas-12fmcb-shard-0&authSource=admin&appName=Cluster0";

  if (!uri) {
    console.error("❌ MONGODB_URL is not defined");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};