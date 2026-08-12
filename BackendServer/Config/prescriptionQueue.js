import { Queue } from "bullmq";
import redis from "../Config/redis.js";

const prescriptionQueue = new Queue("prescription", {
    connection: redis,

    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 5000
        },

        removeOnComplete: 100,
        removeOnFail: false
    }
});

export default prescriptionQueue;