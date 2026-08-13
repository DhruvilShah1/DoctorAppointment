import { Worker } from "bullmq";
import redis from "../Config/redis.js";

import Prescription from "../Model/Prescription.js";

import QrCodeSection from "../createPrescription/QrCodeSection.js";

import generatePrescriptionHtml from "../createPrescription/prescriptionPdfTemplate.js";

import generatePrescriptionPdf from "../createPrescription/prescriptionPdfGenration.js";

import { uploadPdf } from "../Config/uploadthing.js";

const prescriptionWorker = new Worker(
  "generate-prescription",

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

      console.log("✅ QR Code generated");

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

      console.log("✅ HTML generated");

      // =====================================
      // 3. Generate PDF
      // =====================================

      console.log("📄 Generating PDF...");

      const pdfBuffer = await generatePrescriptionPdf(htmlTemplate);

      console.log("✅ PDF generated");

      // =====================================
      // 4. Upload PDF
      // =====================================

      console.log("📤 Uploading PDF...");

      const pdfUrl = await uploadPdf(pdfBuffer, `${prescriptionId}.pdf`);

      console.log("✅ PDF uploaded:", pdfUrl);

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

      console.log("QR Code:", prescription.qrCode);

      console.log("PDF URL:", prescription.pdfUrl);

      // =====================================
      // 7. Return Worker Result
      // =====================================

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
