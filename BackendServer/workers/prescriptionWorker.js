import { Worker } from "bullmq";

import redis from "../Config/redis.js";
import Prescription from "../Model/Prescription.js";
import generatePrescriptionTemplate from '../Service/prescriptionTemplate.js'
import generatePrescriptionPDF from '../Service/pdfService.js'
import { uploadSignature, uploadPdf } from "../Config/uploadthing.js";


const worker = new Worker(

    "prescription",

    async (job) => {

        console.log("\n==============================");

        console.log("🚀 Prescription Job Started");

        console.log("Job ID:", job.id);

        console.log("Job Name:", job.name);

        console.log(
            "Prescription ID:",
            job.data.prescriptionId
        );

        console.log("==============================");


        const {
            prescriptionId
        } = job.data;


        // =========================================
        // STEP 1 — Get Prescription From MySQL
        // =========================================

        const prescription =
            await Prescription.findOne({

                where: {
                    prescriptionId
                }

            });


        if (!prescription) {

            throw new Error(
                `Prescription ${prescriptionId} not found`
            );

        }


        console.log(
            "✅ Prescription found:",
            prescription.prescriptionId
        );


        // =========================================
        // STEP 2 — Get Prescription Data
        // =========================================

        const {

            patientId,

            doctorId,

            medicines,

            instructions,

            signature,

            date,

            slot,

            qrCode

        } = prescription;


        console.log("Patient ID:", patientId);

        console.log("Doctor ID:", doctorId);

        console.log("Medicines:", medicines);

        console.log("Signature:", signature);

        console.log("QR Code available:", !!qrCode);


        // =========================================
        // STEP 3 — Generate HTML
        // =========================================

        const html =
            generatePrescriptionTemplate({

                prescriptionId,

                doctorName:
                    "Doctor",

                patientName:
                    "Patient",

                instructions,

                date,

                slot,

                medicines:
                    medicines || [],

                signatureUrl:
                    signature,

                qrCode

            });


        console.log(
            "✅ HTML generated"
        );


        // =========================================
        // STEP 4 — Generate PDF
        // =========================================

        const pdfBuffer =
            await generatePrescriptionPDF(
                html
            );


        console.log(
            "✅ PDF generated"
        );


        // =========================================
        // STEP 5 — Upload PDF
        // =========================================

        const pdfUrl =
            await uploadPdf(

                pdfBuffer,

                `${prescriptionId}.pdf`

            );


        console.log(
            "✅ PDF uploaded:",
            pdfUrl
        );


        // =========================================
        // STEP 6 — Update MySQL
        // =========================================

        await prescription.update({

            pdfUrl,

            status:
                "issued"

        });


        console.log(
            "✅ Prescription updated"
        );


        console.log(
            `🎉 Job ${job.id} completed`
        );


        // =========================================
        // STEP 7 — Return Result
        // =========================================

        return {

            success: true,

            prescriptionId,

            pdfUrl

        };

    },

    {

        connection: redis,

        // One PDF at a time
        concurrency: 1,

    }

);


// ============================================
// Worker Completed
// ============================================

worker.on(
    "completed",
    (job, result) => {

        console.log(
            `🎉 Job ${job.id} completed`
        );

        console.log(
            "Result:",
            result
        );

    }
);


// ============================================
// Worker Failed
// ============================================

worker.on(
    "failed",
    async (job, error) => {

        console.error(
            `❌ Job ${job?.id} failed`
        );

        console.error(
            "Error:",
            error.message
        );

    }
);



worker.on(
    "error",
    (error) => {

        console.error(
            "❌ Worker error:",
            error.message
        );

    }
);


console.log(
    "👷 Prescription Worker Started"
);

export default worker;