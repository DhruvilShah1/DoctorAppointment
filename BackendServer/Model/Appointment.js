import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    queueNumber: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending" , "waiting" , "called" , "current", "done", "skipped", "notcome" , 'next' ],
      default: "pending",
    },

    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true, 
    },

       currentPatientIndex : {
      type : Number  , 
      default : 0
    } ,


       isQueueStarted : {
      type : Boolean  , 
      default : false
    } , 


    isCompleted: {
      type: Boolean,
      default: false,
    },

    patientList: {
      type: [patientSchema],
      default: [],
    },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
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

 

     isCompleted : {
      type : Boolean  , 
      default : false
    } ,


  

  startedAt: {
    type  : Date , 
    default : null 
  },
  endedAt: {
     type  : Date , 
    default : null 
  },


    slots: {
      type: [slotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export default mongoose.model("Appointment", appointmentSchema);