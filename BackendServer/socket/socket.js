let io;

export const initSocket = (socketIo) => {
  io = socketIo;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }

  return io;
};