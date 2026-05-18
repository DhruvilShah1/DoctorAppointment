let io;

export const initIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }

  return io;
};