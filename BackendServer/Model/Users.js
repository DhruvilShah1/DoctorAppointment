import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
  },
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true   
  },
  password: {
    type: String,
  }
,
  role: {
  type: String,
  enum: ["user", "admin", "doctor" , "shopper"],
  default: "user",
}
  , 
  checked: {
    type: Boolean,
    required: true ,
    default : false
  }
}, {
  timestamps: true 
});

export default mongoose.model("User", userSchema);