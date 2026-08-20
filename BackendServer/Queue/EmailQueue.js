import redis from "../Config/redis.js";
import { Queue } from "bullmq";

const EmailQueue = new Queue(
    "emailQueue",
    {
        connection: redis,

        defaultJobOptions: {
            attempts: 3,

            backoff: {
                type: "exponential",
                delay: 1000,
            },

            removeOnComplete: true,

            removeOnFail: false,
        },
    }
);

export default EmailQueue;