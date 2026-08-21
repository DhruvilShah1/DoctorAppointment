import redis from "../Config/redis.js";

const prescriptionSubscriber =
    redis.duplicate();


const startPrescriptionSubscriber = async (io) => {

    await prescriptionSubscriber.psubscribe(
        "prescription:*"
    );

    prescriptionSubscriber.on(
        "pmessage",
        (pattern, channel, message) => {

            try {

                const [, prescriptionId] =
                    channel.split(":");

                const data =
                    JSON.parse(message);

                const doctorId =
                    data.doctorId;

                if (!doctorId) {
                    return;
                }

                const roomId =
                    String(doctorId);

                io.to(roomId).emit(
                    "prescription:progress",
                    {
                        prescriptionId,
                        ...data
                    }
                );

            } catch (error) {
            }

        }
    );

};


export default startPrescriptionSubscriber;