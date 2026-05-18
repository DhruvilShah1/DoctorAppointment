import { Server } from "socket.io";

let io = null;

export const initIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  console.log("✅ Socket initialized");
};

export const getIO = () => {
  return io;
};