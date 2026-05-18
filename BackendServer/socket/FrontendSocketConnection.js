import { io } from "socket.io-client";

export const socket = io("https://doctorappointment-lj0a.onrender.com", {
  withCredentials: true,
});