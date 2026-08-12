import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();


if(!process.env.REDIS_URL ) {
    throw new Error("REDIS_URL is missing");
}

const redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

redis.on("connect", () => {
    console.log("✅ Redis connected");
});

redis.on("ready", () => {
    console.log("✅ Redis ready");
});

redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
});

export default redis;