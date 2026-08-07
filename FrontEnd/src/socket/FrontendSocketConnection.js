import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKETIO_URL || "http://localhost:5000";

export const socket = io(URL, { withCredentials: true });