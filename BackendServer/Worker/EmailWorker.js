import { Worker } from "bullmq";
import redis from "../Config/redis.js";
import dotenv from "dotenv";
import EmailPrescriptionTemplate from "../Template/EmailPrescptionTemplate.js";
import { Resend } from "resend";

dotenv.config();

if (!process.env.RESEND_API_KEY) {
    throw new Error("❌ RESEND_API_KEY is missing");
}

if (!process.env.EMAIL_FROM) {
    throw new Error("❌ EMAIL_FROM is missing");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const EmailWorker = new Worker(
    "emailQueue",

    async (job) => {
        const {
            prescriptionId,
            patientEmail,
            patientName,
            doctorName,
            date,
            slot,
            pdfUrl,
            instructions,
        } = job.data;

        console.log("📧 Email Received");
        console.log("📋 Job ID:", job.id);
        console.log("👤 Patient:", patientName);
        console.log("📩 Email:", patientEmail);

        try {
            const subject =
                `Your Prescription is Ready - Dr. ${doctorName}`;

            const html = EmailPrescriptionTemplate(
                patientName,
                doctorName,
                date,
                slot,
                instructions
            );

            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM,

                to: [patientEmail],

                subject,

                html,

                attachments: pdfUrl
                    ? [
                          {
                              path: pdfUrl,
                              filename: "prescription.pdf",
                          },
                      ]
                    : [],
            });

            if (error) {
                console.error(
                    "❌ Resend Error:",
                    error
                );

                throw new Error(error.message);
            }

            console.log(
                `✅ Email sent to ${patientEmail}`
            );

            console.log(
                "📨 Resend Email ID:",
                data?.id
            );

            return {
                success: true,
                email: patientEmail,
                messageId: data?.id,
                prescriptionId,
            };

        } catch (err) {
            console.error(
                "❌ Error sending email:",
                err
            );

            throw err;
        }
    },

    {
        connection: redis,
        concurrency: 2,
    }
);

console.log("📧 Email Worker is running...");

EmailWorker.on("completed", (job) => {
    console.log(
        `✅ Email job ${job.id} completed`
    );
});

EmailWorker.on("failed", (job, err) => {
    console.error(
        `❌ Email job ${job?.id} failed:`,
        err.message
    );
});

EmailWorker.on("error", (err) => {
    console.error(
        "❌ Email Worker Error:",
        err
    );
});

export default EmailWorker;