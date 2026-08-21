import { Worker } from "bullmq";
import redis from "../Config/redis.js";
import dotenv from "dotenv";
import EmailPrescriptionTemplate from "../Template/EmailPrescptionTemplate.js";
import nodemailer from "nodemailer";

dotenv.config();

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("❌ SMTP_USER or SMTP_PASS is missing");
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
});

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ SMTP connection failed:", error);
    } else {
        console.log("✅ Gmail SMTP connection is ready");
    }
});

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

        console.log("Email Recevied");
        

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

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: patientEmail,
                subject,
                html,

                attachments: [
                    {
                        filename: "prescription.pdf",
                        path: pdfUrl,
                    },
                ],
            };

            const info = await transporter.sendMail(mailOptions);

            console.log(
                `✅ Email sent to ${patientEmail}`,
                info.messageId
            );

            return {
                success: true,
                email: patientEmail,
                messageId: info.messageId,
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

export default EmailWorker;