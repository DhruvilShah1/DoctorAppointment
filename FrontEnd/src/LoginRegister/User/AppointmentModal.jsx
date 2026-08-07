import React from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
const VITE_BACKEND_URL = import.meta.VITE_BACKEND_URL;

const typeStyles = {
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    border: "border-green-300",
  },
  error: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-300",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-300",
  },
};

const AppointmentModal = ({ open, onClose, type = "info", title, message, actionText, onAction }) => {
  if (!open) return null;

  const config = typeStyles[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X />
        </button>

        {/* ICON */}
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${config.bg}`}>
          <Icon className={config.color} size={30} />
        </div>

        {/* TITLE */}
        <h2 className="text-center text-xl font-bold mt-4">
          {title}
        </h2>

        {/* MESSAGE */}
        <p className="text-center text-gray-500 mt-2">
          {message}
        </p>

        {/* ACTION */}
        {actionText && (
          <button
            onClick={onAction}
            className={`w-full mt-6 py-2 rounded-xl font-semibold text-white ${
              type === "success"
                ? "bg-green-600 hover:bg-green-700"
                : type === "error"
                ? "bg-red-600 hover:bg-red-700"
                : type === "warning"
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;