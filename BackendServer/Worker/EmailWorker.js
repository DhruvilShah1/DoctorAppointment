import { Worker } from "bullmq";
import redis from "../Config/redis.js";
import dotenv from "dotenv";
import EmailPrescriptionTemplate from "../Template/EmailPrescptionTemplate.js";
import { Resend } from "resend";
import QueueJobs from "../Model/QueueJobs.js";

dotenv.config();

if (!process.env.RESEND_API_KEY) {
    throw new Error("❌ RESEND_API_KEY is missing");
}

if (!process.env.EMAIL_FROM) {
    throw new Error("❌ EMAIL_FROM is missing");
}

const resend = new Resend(process.env.RESEND_API_KEY);


/*
|--------------------------------------------------------------------------
| EMAIL WORKER
|--------------------------------------------------------------------------
*/

const EmailWorker = new Worker(
    "emailQueue",

    async (job) => {

        const {
            prescriptionId,
            patientEmail,
            patientId,
            doctorId,
            patientName,
            doctorName,
            date,
            slot,
            pdfUrl,
            instructions,
        } = job.data;


        console.log("\n========================================");
        console.log("📧 EMAIL JOB STARTED");
        console.log("========================================");

        console.log("📋 Job ID:", job.id);
        console.log("👤 Patient:", patientName);
        console.log("📩 Email:", patientEmail);
        console.log("🧾 Prescription ID:", prescriptionId);
        console.log("🔄 Attempt:", job.attemptsMade);


        /*
        |--------------------------------------------------------------------------
        | 1. CREATE / UPDATE QUEUE JOB AS PROCESSING
        |--------------------------------------------------------------------------
        */

        let queueJob;

        try {

            queueJob = await QueueJobs.create({
    jobId: String(job.id),

    userId: doctorId,

    queueName: "emailQueue",

    jobType: "generate-email",

    referenceType: "email",

    referenceId: prescriptionId,

    status: "processing",

    attemptsMade: job.attemptsMade,

    maxAttempts: job.opts.attempts || 3,

    retryCount: Math.max(0, job.attemptsMade - 1),

    payload: {
        patientId,
        email: patientEmail,
        date,
        slot,
    },

    startedAt: new Date(),

    lastError: null,

    errorStack: null,
});


            /*
            |--------------------------------------------------------------------------
            | 2. CREATE EMAIL SUBJECT
            |--------------------------------------------------------------------------
            */

            const subject =
                `Your Prescription is Ready - Dr. ${doctorName}`;


            /*
            |--------------------------------------------------------------------------
            | 3. CREATE EMAIL HTML
            |--------------------------------------------------------------------------
            */

            const html = EmailPrescriptionTemplate(
                patientName,
                doctorName,
                date,
                slot,
                instructions
            );


            /*
            |--------------------------------------------------------------------------
            | 4. SEND EMAIL
            |--------------------------------------------------------------------------
            */

            console.log("📤 Sending email...");


            const {
                data,
                error,
            } = await resend.emails.send({

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


            /*
            |--------------------------------------------------------------------------
            | 5. RESEND ERROR
            |--------------------------------------------------------------------------
            */

            if (error) {

                console.error(
                    "❌ Resend Error:",
                    error
                );

                throw new Error(
                    error.message || "Failed to send email"
                );
            }


            /*
            |--------------------------------------------------------------------------
            | 6. EMAIL SUCCESS
            |--------------------------------------------------------------------------
            */

            console.log(
                `✅ Email successfully sent to ${patientEmail}`
            );

            console.log(
                "📨 Resend Email ID:",
                data?.id
            );


            /*
            |--------------------------------------------------------------------------
            | 7. UPDATE QUEUE JOB -> COMPLETED
            |--------------------------------------------------------------------------
            */

            await QueueJobs.findOneAndUpdate(
                {
                    jobId: String(job.id),
                },
                {
                    $set: {

                        status: "completed",

                        attemptsMade: job.attemptsMade,

                        retryCount: Math.max(
                            0,
                            job.attemptsMade - 1
                        ),

                        result: {
                            success: true,

                            email: patientEmail,

                            messageId: data?.id,

                            prescriptionId,
                        },

                        completedAt: new Date(),

                        lastError: null,

                        errorStack: null,
                    },
                }
            );


            /*
            |--------------------------------------------------------------------------
            | 8. RETURN RESULT TO BULLMQ
            |--------------------------------------------------------------------------
            */

            return {

                success: true,

                email: patientEmail,

                messageId: data?.id,

                prescriptionId,
            };


        } catch (err) {

            /*
            |--------------------------------------------------------------------------
            | EMAIL FAILED
            |--------------------------------------------------------------------------
            */

            console.error(
                "❌ Error sending email:",
                err
            );


            /*
            |--------------------------------------------------------------------------
            | UPDATE QUEUE JOB -> FAILED / RETRYING
            |--------------------------------------------------------------------------
            */

            const maxAttempts =
                job.opts.attempts || 3;

            const attemptsMade =
                job.attemptsMade;

            const isLastAttempt =
                attemptsMade >= maxAttempts;


            await QueueJobs.findOneAndUpdate(
                {
                    jobId: String(job.id),
                },
                {
                    $set: {

                        status: isLastAttempt
                            ? "failed"
                            : "retrying",

                        attemptsMade,

                        maxAttempts,

                        retryCount: Math.max(
                            0,
                            attemptsMade - 1
                        ),

                        lastError:
                            err?.message ||
                            "Unknown email error",

                        errorStack:
                            err?.stack ||
                            null,

                        ...(isLastAttempt
                            ? {
                                completedAt: new Date(),
                            }
                            : {}),
                    },
                }
            );


            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            | Throwing the error tells BullMQ:
            |
            | "This job failed."
            |
            | BullMQ can then retry the job automatically.
            */

            throw err;
        }
    },

    {
        connection: redis,

        concurrency: 2,
    }
);


/*
|--------------------------------------------------------------------------
| WORKER STARTED
|--------------------------------------------------------------------------
*/

console.log("📧 Email Worker is running...");


/*
|--------------------------------------------------------------------------
| COMPLETED EVENT
|--------------------------------------------------------------------------
*/

EmailWorker.on(
    "completed",
    async (job, result) => {

        console.log("\n========================================");
        console.log("✅ EMAIL JOB COMPLETED");
        console.log("========================================");

        console.log("📋 Job ID:", job.id);

        console.log(
            "📩 Email:",
            job.data?.patientEmail
        );

        console.log(
            "🧾 Prescription:",
            job.data?.prescriptionId
        );

        console.log(
            "📨 Message ID:",
            result?.messageId
        );


        /*
        |--------------------------------------------------------------------------
        | SAFETY UPDATE
        |--------------------------------------------------------------------------
        */

        try {

            await QueueJobs.findOneAndUpdate(
                {
                    jobId: String(job.id),
                },
                {
                    $set: {

                        status: "completed",

                        result: result,

                        completedAt: new Date(),

                        lastError: null,

                        errorStack: null,
                    },
                }
            );

        } catch (error) {

            console.error(
                "❌ Failed to update completed QueueJob:",
                error
            );
        }
    }
);


/*
|--------------------------------------------------------------------------
| FAILED EVENT
|--------------------------------------------------------------------------
*/

EmailWorker.on(
    "failed",
    async (job, err) => {

        console.log("\n========================================");
        console.log("❌ EMAIL JOB FAILED");
        console.log("========================================");

        console.log(
            "📋 Job ID:",
            job?.id
        );

        console.log(
            "📩 Email:",
            job?.data?.patientEmail
        );

        console.log(
            "🔄 Attempt:",
            job?.attemptsMade
        );

        console.log(
            "❌ Error:",
            err?.message
        );


        if (!job) {
            return;
        }


        try {

            const maxAttempts =
                job.opts.attempts || 3;

            const isLastAttempt =
                job.attemptsMade >= maxAttempts;


            await QueueJobs.findOneAndUpdate(
                {
                    jobId: String(job.id),
                },
                {
                    $set: {

                        status: isLastAttempt
                            ? "failed"
                            : "retrying",

                        attemptsMade:
                            job.attemptsMade,

                        maxAttempts,

                        retryCount: Math.max(
                            0,
                            job.attemptsMade - 1
                        ),

                        lastError:
                            err?.message ||
                            "Email job failed",

                        errorStack:
                            err?.stack ||
                            null,

                        ...(isLastAttempt
                            ? {
                                completedAt: new Date(),
                            }
                            : {}),
                    },
                }
            );


        } catch (error) {

            console.error(
                "❌ Failed to update failed QueueJob:",
                error
            );
        }
    }
);


/*
|--------------------------------------------------------------------------
| WORKER ERROR
|--------------------------------------------------------------------------
*/

EmailWorker.on(
    "error",
    (err) => {

        console.error(
            "❌ Email Worker Error:",
            err
        );
    }
);


/*
|--------------------------------------------------------------------------
| STALLED JOB
|--------------------------------------------------------------------------
*/

EmailWorker.on(
    "stalled",
    (jobId) => {

        console.warn(
            `⚠️ Email job ${jobId} stalled`
        );
    }
);


export default EmailWorker;