import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

import router from "../BackendServer/Routes/api.js";
import { initSocket } from "./socket/socket.js";
import { connectDB } from "../BackendServer/Config/Connection.js";

const app = express();
const server = http.createServer(app);

app.use(cookieParser());
app.set("trust proxy", 1);

connectDB();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:5173",
      "https://doctorappointment-lj0a.onrender.com",
    ];

// Express CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

pp.use(
  "/uploads",
  express.static("uploads")
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// IMPORTANT
initSocket(io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("PersonalAppointment", (userId) => {
    socket.join(userId);
    console.log("Personal Appointment:", userId);
  });

  socket.on(
    "patient:join",
    ({ doctorId, date, slot }) => {
      const roomId =
        `${doctorId}_${date}_${slot}`;

      socket.join(roomId);

      console.log(
        "✅ Patient joined:",
        roomId
      );
    }
  );

  socket.on(
    "doctor:join",
    ({ doctorId, date, slot }) => {
      const roomId =
        `${doctorId}_${date}_${slot}`;

      console.log(
        "Queue start emit to:",
        roomId
      );

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

  socket.on("disconnect", () => {
    console.log(
      "Disconnected:",
      socket.id
    );
  });
});

server.listen(5000, () => {
  console.log(
    "Server running on port 5000"
  );
});