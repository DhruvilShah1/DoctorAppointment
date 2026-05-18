let io;

export const initSocket = (socketIo) => {
  io = socketIo;

  console.log("✅ Socket.IO initialized successfully");
  console.log("Socket ID / Instance ready:", !!io);
};

export const getIO = () => {
  if (!io) {
    console.error("❌ getIO() called but Socket.IO is NOT initialized");
    throw new Error("Socket not initialized");
  }

  console.log("📡 Socket.IO instance accessed successfully");

  return io;
};