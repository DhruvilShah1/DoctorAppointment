
import redis from "../Config/redis.js";

const prescriptionSubscriber = redis.duplicate();

export const startPrescriptionSubscriber = async (io) => {

    if (!prescriptionSubscriber.isOpen) {
        await prescriptionSubscriber.connect();
    }

    await prescriptionSubscriber.pSubscribe(
        "prescription:*",
        (message, channel) => {

            console.log("📡 Redis message received");
            console.log("Channel:", channel);
            console.log("Message:", message);

            const data = JSON.parse(message);

            const {
                doctorId,
                date,
                slot
            } = data;

            const roomId =
                `${doctorId}_${date}_${slot}`;

            io.to(roomId).emit(
                "prescription:progress",
                data
            );

            console.log(
                `📤 Prescription update sent to room: ${roomId}`
            );
        }
    );

    console.log(
        "📡 Prescription Redis subscriber started"
    );
};