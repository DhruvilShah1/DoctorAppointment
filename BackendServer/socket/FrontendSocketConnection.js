import { io } from "socket.io-client";

export const socket = io("https://doctorappointment-1-co0d.onrender.com", {
  withCredentials: true,
});