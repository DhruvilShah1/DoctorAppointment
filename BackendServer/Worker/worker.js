import { Worker } from "bullmq";
import redis from "../Config/redis.js";

import Prescription from "../Model/Prescription.js";

import QrCodeSection from "../createPrescription/QrCodeSection.js";

import generatePrescriptionHtml from "../createPrescription/prescriptionPdfTemplate.js";

import generatePrescriptionPdf from "../createPrescription/prescriptionPdfGenration.js";

import { uploadPdf } from "../Config/uploadthing.js";
import { connectDB } from "../Config/Connection.js";


connectDB()

const publishPrescriptionProgress = async ({
    prescriptionId,
    doctorId,
    patientId,
    step,
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
          patientName ,
          step: 1,
          status: "success",
          message: "QR Code generated",
          progress: 30,
        });



      // =====================================
      // 2. Generate HTML
      // =====================================

      console.log("📝 Generating prescription HTML...");

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

      console.log("📄 Generating PDF...");

      const pdfBuffer = await generatePrescriptionPdf(htmlTemplate);
      
      await publishPrescriptionProgress({
          prescriptionId,
          doctorId,
          patientId,
          patientName,
          step: 2,
          status: "success",
          message: "PDF Generated",
          progress: 60,
        });


      // =====================================
      // 4. Upload PDF
      // =====================================

      console.log("📤 Uploading PDF...");

      const pdfUrl = await uploadPdf(pdfBuffer, `${prescriptionId}.pdf`);

      await publishPrescriptionProgress({
          prescriptionId,
          doctorId,
          patientId,
          patientName,
          step: 3,
          status: "success",
          message: "PDF Uploaded",
          progress: 100,
        });

      

      // =====================================
      // 5. Update Existing Prescription
      // =====================================

      console.log("💾 Updating prescription...");

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

prescriptionWorker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed`);

  console.log("Result:", result);   
});

// ==========================================
// Worker Failed
// ==========================================

prescriptionWorker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed`);

  console.error(error);
});

// ==========================================
// Worker Error
// ==========================================

prescriptionWorker.on("error", (error) => {
  console.error("❌ Worker error:", error);
});

console.log("👷 Prescription Worker is running...");
