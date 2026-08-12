import {Queue} from 'bullmq'
import redis from "../Config/redis.js";

const prescriptionQueue = new Queue(
    "prescription",
    {
        connection: redis
    }
);

export default prescriptionQueue;