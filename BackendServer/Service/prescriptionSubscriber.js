// Service/prescriptionSubscriber.js

import redis from "../Config/redis.js";

const prescriptionSubscriber = redis.duplicate();

export const startPrescriptionSubscriber = async (io) => {

    await prescriptionSubscriber.psubscribe(
        "prescription:*"
    );

    prescriptionSubscriber.on(
        "pmessage",
        (pattern, channel, message) => {

            console.log("📡 Redis message received");

            console.log("Channel:", channel);
            console.log("Message:", message);

            try {

                const data = JSON.parse(message);

                const {
                    doctorId,
                    date,
                    slot,
                } = data;

                const roomId =
                    `${doctorId}_${date}_${slot}`;

                console.log(
                    "🏠 Socket Room:",
                    roomId
                );

                io.to(roomId).emit(
                    "prescription:progress",
                    data
                );

                console.log(
                    "📤 Prescription update sent"
                );

            } catch (error) {

                console.error(
                    "❌ Redis message parse error:",
                    error
                );

            }
        }
    );

    console.log(
        "📡 Prescription Redis subscriber started"
    );
};