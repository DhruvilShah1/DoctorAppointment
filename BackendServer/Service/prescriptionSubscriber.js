import redis from "../Config/redis.js";

const prescriptionSubscriber =
    redis.duplicate();


const startPrescriptionSubscriber = async (io) => {

    console.log(
        "🚀 Starting prescription Redis subscriber..."
    );


    await prescriptionSubscriber.psubscribe(
        "prescription:*"
    );


    console.log(
        "📡 Redis subscribed to: prescription:*"
    );


    prescriptionSubscriber.on(
        "pmessage",
        (pattern, channel, message) => {

            console.log("");
            console.log(
                "===================================="
            );

            console.log(
                "📡 Redis message received"
            );

            console.log(
                "📌 Pattern:",
                pattern
            );

            console.log(
                "📢 Channel:",
                channel
            );

            console.log(
                "💬 Message:",
                message
            );


            try {

                /*
                 * Channel:
                 *
                 * prescription:123
                 *
                 * 123 = prescriptionId
                 */

                const [, prescriptionId] =
                    channel.split(":");


                console.log(
                    "💊 Prescription ID:",
                    prescriptionId
                );


                const data =
                    JSON.parse(message);


                console.log(
                    "📦 Parsed prescription data:",
                    data
                );


                const doctorId =
                    data.doctorId;


                if (!doctorId) {

                    console.log(
                        "❌ doctorId missing from Redis data"
                    );

                    return;
                }


                const roomId =
                    String(doctorId);


                console.log(
                    "🏠 Target Socket.IO room:",
                    roomId
                );


                io.to(roomId).emit(
                    "prescription:progress",
                    {
                        prescriptionId,
                        ...data
                    }
                );


                console.log(
                    "📤 Prescription progress emitted"
                );

                console.log(
                    "👨‍⚕️ Sent to doctor:",
                    doctorId
                );


            } catch (error) {

                console.error(
                    "❌ Redis message processing error:",
                    error
                );

            }


            console.log(
                "===================================="
            );
            console.log("");

        }
    );

};


export default startPrescriptionSubscriber;