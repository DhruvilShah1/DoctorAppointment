import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import './Auth/google.js'
import router from "../BackendServer/Routes/api.js";
import { initSocket } from "./socket/socket.js";
import { connectDB } from "../BackendServer/Config/Connection.js";
import redis from "./Config/redis.js";
import  startPrescriptionSubscriber  from "./Service/prescriptionSubscriber.js";



const app = express();
const server = http.createServer(app);
app.use(session({
  secret: 'MyKEY',
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser());
app.set("trust proxy", 1);

connectDB();



const allowedOrigins =
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [
        "http://localhost:5173",
        "https://doctor-appointment-kohl-phi.vercel.app",
        "https://doctorappointment-lj0a.onrender.com",
      ];

app.use(
  cors({
    origin:
      allowedOrigins,
    credentials: true,
  })
);

app.use(
  "/uploads",
  express.static("uploads")
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const io =
  new Server(server, {
    cors: {
      origin:
        allowedOrigins,

      methods: [
        "GET",
        "POST",
      ],

      credentials:
        true,
    },

    transports: [
      "websocket",
      "polling",
    ],
  });

initSocket(io);
startPrescriptionSubscriber(io);

io.on("connection", (socket) => {

  socket.on("PersonalAppointment", (userId) => {
    socket.join(userId);
  });

  socket.on(
    "patient:join",
    ({ doctorId, date, slot }) => {
      const roomId =
        `${doctorId}_${date}_${slot}`;

      socket.join(roomId);
       
    }
  );

  socket.on(
    "doctor:join",
    ({ doctorId, date, slot }) => {
      const roomId =
        `${doctorId}_${date}_${slot}`;

      io.to(roomId).emit(
        "queue:started",
        {
          date,
          slot,
          message:
            "Doctor has started the queue",
        }
      );

      io.to(roomId).emit(
        "queue:status:updated",
        {
          date,
          slot,
          message: "Queue Updated",
        }
      );

      io.to(roomId).emit(
        "queue:status:finished",
        {
          message: `${slot} is Finished`,
          date,
          slot,
        }
      );
    }
  );

});

server.listen(5000, () => {
  console.log(
    "Server running on port 5000"
  );
});

