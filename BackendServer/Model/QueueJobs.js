import mongoose from "mongoose";


const queueJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    queueName: {
      type: String,
      required: true,
      index: true,
    },

    jobType: {
      type: String,
      required: true,
      index: true,
    },

    // Who owns/requested this job?
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    // What entity does this job belong to?
    referenceType: {
      type: String,
      enum: [
        "prescription",
        "email",
        "notification",
        "pdf",
        "payment",
        "report",
        "other",
      ],
      default: "other",
    },

    // ID of the related entity
    referenceId: {
      type: String,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "active",
        "delayed",
        "completed",
        "failed",
      ],
      default: "waiting",
      index: true,
    },



  
    attemptsMade: {
      type: Number,
      default: 0,
    },

    maxAttempts: {
      type: Number,
      default: 3,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
    },

    errorStack: {
      type: String,
      default: null,
    },

    startedAt: Date,
    completedAt: Date,
    failedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("queueJobSchema", queueJobSchema);