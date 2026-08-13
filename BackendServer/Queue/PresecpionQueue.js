import redis from "../Config/redis";
import { Queue } from "bullmq";

const prescriptionQueue = new Queue("prescriptionQueue", {
    connection: redis,
});

export default prescriptionQueue;