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
import Users from "../Model/Users.js";
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

    try {

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
        { jobId: job.id },
        {
          status: "active",
          attemptsMade: job.attemptsMade,
          startedAt: new Date(),
        }
      );

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

      const prescription = await Prescription.findOneAndUpdate(
        { prescriptionId: prescriptionId },
        {
          qrCode: qrCode,
          pdfUrl: pdfUrl,
          status: "issued",
          verificationStatus: "pending",
        },
        { new: true },
      );

      if (!prescription) {
        throw new Error(`Prescription not found: ${prescriptionId}`);
      }

      const patientUser = await Users.findOne({ _id: patientId }).select("email");
      const patientEmail = patientUser?.email;

      await EmailQueue.add("send-prescription-email", {
        prescriptionId,
        doctorId,
        patientId,
        patientEmail,
        patientName,
        doctorName,
        date,
        slot,
        pdfUrl,
        instructions,
      });

      return {
        success: true,
        prescriptionId,
        qrCode,
        pdfUrl,
      };
    } catch (error) {
      throw error;
    }
  },

  {
    connection: redis,
    concurrency: 2,
  },
);

prescriptionWorker.on("completed", async (job, result) => {
  await QueueJobs.findOneAndUpdate(
    { jobId: job.id },
    {
      status: "completed",
      attemptsMade: job.attemptsMade,
      completedAt: new Date(),
      result: result,
      lastError: null,
      errorStack: null,
    }
  );
});

prescriptionWorker.on("failed", async (job, error) => {
  const attemptsMade = job.attemptsMade;
  const maxAttempts = job.opts.attempts || 1;
  const permanentlyFailed = attemptsMade >= maxAttempts;

  if (!permanentlyFailed) {
    await QueueJobs.findOneAndUpdate(
      { jobId: job.id },
      {
        status: "delayed",
        attemptsMade,
        lastError: error.message,
        errorStack: error.stack,
      }
    );
  } else {
    await QueueJobs.findOneAndUpdate(
      { jobId: job.id },
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
});

prescriptionWorker.on("error", () => {});
