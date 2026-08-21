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

                throw new Error(
                    error.message || "Failed to send email"
                );
            }


            /*
            |--------------------------------------------------------------------------
            | 6. EMAIL SUCCESS
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

/*
|--------------------------------------------------------------------------
| COMPLETED EVENT
|--------------------------------------------------------------------------
*/

EmailWorker.on(
    "completed",
    async (job, result) => {

        try {

            await QueueJobs.findOneAndUpdate(
                {
                    jobId: String(job.id),
                },
                {
                    $set: {

                        status: "completed",

                        result: result,
                        attemptsMade: job.attemptsMade,
                        completedAt: new Date(),

                        lastError: null,

                        errorStack: null,
                    },
                }
            );

        } catch (error) {}
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


        } catch (error) {}
    }
);


/*
|--------------------------------------------------------------------------
| WORKER ERROR
|--------------------------------------------------------------------------
*/

EmailWorker.on(
    "error",
    (err) => {}
);


/*
|--------------------------------------------------------------------------
| STALLED JOB
|--------------------------------------------------------------------------
*/

EmailWorker.on(
    "stalled",
    (jobId) => {}
);


export default EmailWorker;