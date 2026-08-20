import { Worker } from "bullmq";
import redis from "../Config/redis.js";

import Prescription from "../Model/Prescription.js";

import QrCodeSection from "../createPrescription/QrCodeSection.js";

import generatePrescriptionHtml from "../createPrescription/prescriptionPdfTemplate.js";

import generatePrescriptionPdf from "../createPrescription/prescriptionPdfGenration.js";

import { uploadPdf } from "../Config/uploadthing.js";
import { connectDB } from "../Config/Connection.js";
import QueueJobs from "../Model/QueueJobs.js";
import EmailQueue from "../Queue/EmailQueue.js";
import User from "../../../../../../OAuth/server/Model/User.js";
import EmailWorker from "./EmailWorker.js";

connectDB()

const publishPrescriptionProgress = async ({
  prescriptionId,
  doctorId,
  patientId,
  patientName,
  step,
  date,
  slot,

  status,
  message,
  progress,
}) => {

  const data = {
    prescriptionId,
    doctorId,
    patientId,
    patientName,
    step,
    status,
    date,
    slot,

    message,
    progress,
    timestamp: new Date().toISOString(),
  };

  await redis.publish(
    `prescription:${prescriptionId}`,
    JSON.stringify(data)
  );

  console.log("📡 Published:", data);
};


const prescriptionWorker = new Worker(
  "prescriptionQueue",

  async (job) => {
    const {
      prescriptionId,
      patientId,
      doctorId,
      medicines,
      doctorName,
      patientName,
      instructions,
      date,
      slot,
      signatureUrl,
    } = job.data;

    console.log("🚀 prescriptionWorker started for job:", job.id);

    try {

      console.log("🔳 Generating QR Code...");

      const qrCode = await QrCodeSection(prescriptionId);

      await publishPrescriptionProgress({
        prescriptionId,
        doctorId,
        patientId,
        patientName,
        date,
        slot,

        step: 1,
        status: "success",
        message: "QR Code generated",
        progress: 30,
      });

      await QueueJobs.findOneAndUpdate(
        {
          jobId: job.id,
        },
        {
          status: "active",
          attemptsMade: job.attemptsMade,
          startedAt: new Date(),
        }
      );




      // =====================================
      // 2. Generate HTML
      // =====================================


      const htmlTemplate = generatePrescriptionHtml({
        prescriptionId,

        doctorName,

        patientName,

        date,

        slot,

        instructions,

        parsedMedicines: medicines,

        signatureUrl,

        qrCode,
      });


      // =====================================
      // 3. Generate PDF
      // =====================================


      const pdfBuffer = await generatePrescriptionPdf(htmlTemplate);

      await publishPrescriptionProgress({
        prescriptionId,
        doctorId,
        patientId,
        patientName,
        step: 2,
        date,
        slot,

        status: "success",
        message: "PDF Generated",
        progress: 60,
      });


      // =====================================
      // 4. Upload PDF
      // =====================================


      const pdfUrl = await uploadPdf(pdfBuffer, `${prescriptionId}.pdf`);

      await publishPrescriptionProgress({
        prescriptionId,
        doctorId,
        patientId,
        patientName,
        step: 3,
        date,
        slot,

        status: "success",
        message: "PDF Uploaded",
        progress: 100,
      });



      // =====================================
      // 5. Update Existing Prescription
      // =====================================


      const prescription = await Prescription.findOneAndUpdate(
        {
          prescriptionId: prescriptionId,
        },

        {
          qrCode: qrCode,

          pdfUrl: pdfUrl,

          status: "issued",

          verificationStatus: "pending",
        },

        {
          new: true,
        },
      );

      // =====================================
      // 6. Check Prescription
      // =====================================

      if (!prescription) {
        throw new Error(`Prescription not found: ${prescriptionId}`);
      }

      console.log("✅ Prescription updated successfully");

      const patientEmail = User.findOne({
        _id: patientId
      }).select("email")

      await EmailQueue.add({
        prescriptionId,
        patientEmail,
        patientName,
        doctorName,
        date,
        slot,
        pdfUrl,
        instructions
      })

      return {
        success: true,

        prescriptionId,

        qrCode,

        pdfUrl,
      };
    } catch (error) {
      console.error("❌ Prescription Worker Error:");

      console.error(error);

      throw error;
    }
  },

  {
    connection: redis,

    concurrency: 2,
  },
);

// ==========================================
// Worker Completed
// ==========================================

prescriptionWorker.on("completed", async (job, result) => {
  console.log(`✅ Job ${job.id} completed`);

  await QueueJobs.findOneAndUpdate(
    {
      jobId: job.id,
    },
    {
      status: "completed",
      attemptsMade: job.attemptsMade,
      completedAt: new Date(),
      result: result,
      lastError: null,
      errorStack: null,
    }
  );

  console.log("Result:", result);
});

// ==========================================
// Worker Failed
// ==========================================

prescriptionWorker.on("failed", async (job, error) => {
  console.error(`❌ Job ${job?.id} failed`);
  const attemptsMade = job.attemptsMade;

  const maxAttempts = job.opts.attempts || 1;

  const permanentlyFailed =
    attemptsMade >= maxAttempts;

  if (!permanentlyFailed) {

    await QueueJobs.findOneAndUpdate(
      {
        jobId: job.id,
      },
      {
        status: "delayed",
        attemptsMade,
        lastError: error.message,
        errorStack: error.stack,
      }
    );
  } else {

    await QueueJobs.findOneAndUpdate(
      {
        jobId: job.id,
      },
      {
        status: "failed",
        attemptsMade,
        maxAttempts,
        lastError: error.message,
        errorStack: error.stack,
        failedAt: new Date(),
      }
    );
  }

  console.error(error);
});

// ==========================================
// Worker Error
// ==========================================

prescriptionWorker.on("error", (error) => {
  console.error("❌ Worker error:", error);
});

console.log("👷 Prescription Worker is running...");
