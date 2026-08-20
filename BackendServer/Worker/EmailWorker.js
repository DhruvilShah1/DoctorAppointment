import { Worker } from "bullmq";
import redis from "../Config/redis.js";
import dotenv from "dotenv";
import EmailPrescriptionTemplate from "../Template/EmailPrescptionTemplate.js";
import nodemailer from "nodemailer";
dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
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
        instructions

     } = job.data;

        try {

            const subject = `Your Prescription is Ready - Dr. ${doctorName}`;
            const html =
                EmailPrescriptionTemplate(
                    patientName,
                    doctorName,
                    date,
                    slot,
                    instructions
                );

            const mailOptions = {
                from: process.env.SMTP_USER,
                to : patientEmail,
                subject,
                html,

                attachments: [
                    {
                        filename: "prescription.pdf",
                        path: pdfUrl,
                    },
                ],
            };

            await transporter.sendMail(
                mailOptions
            );

            console.log(
                `✅ Email sent to ${patientEmail}`
            );

            return {
                success: true,
                email: patientEmail,
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

console.log("Email Stated Working Here ");


export default EmailWorker;