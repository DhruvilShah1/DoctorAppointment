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

            removeOnComplete: { count: 0 },

            removeOnFail: { count: 10 },
        },
    }
);

export default EmailQueue;