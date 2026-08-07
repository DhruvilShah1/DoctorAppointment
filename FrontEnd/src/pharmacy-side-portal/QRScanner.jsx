import React, { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, ScanLine, XCircle } from "lucide-react";
import { toast } from "react-toastify";

const QRScanner = ({ setData }) => {
  const scannerRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);

  const startScanner = async () => {
    setShowScanner(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            try {
              let prescriptionData;
              try {
                prescriptionData = JSON.parse(decodedText);
              } catch (err) {
                toast.error("Invalid QR Format");
                return;
              }

              if (!prescriptionData?.token) {
                toast.error("Invalid QR Token");
                return;
              }
              const res = await fetch(
                `${env.VITE_BACKEND_URL}/api/verify/prescription`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token: prescriptionData.token,
                  }),
                }
              );

              const result = await res.json();

              if (result.success) {
                toast.success("Prescription Verified");
                setData(result.data);
              } else {
                toast.error(result.message || "Verification Failed");
              }

              await html5QrCode.stop();
              await html5QrCode.clear();
              setShowScanner(false);
            } catch (error) {
              toast.error("Scanning Error");
              setShowScanner(false);
            }
          },
          () => {}
        );
      } catch (err) {
        toast.error("Camera Error");
        setShowScanner(false);
      }
    }, 200);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        toast.error("Error stopping scanner");}
    }
    setShowScanner(false);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border p-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-50 p-3 rounded-xl">
            <Camera className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-800">
              Prescription Scanner
            </h2>
            <p className="text-xs text-gray-500">
              Scan QR to verify prescription instantly
            </p>
          </div>
        </div>

        {/* Scanner Box */}
        <div className="bg-gray-900 rounded-2xl p-4 relative overflow-hidden">

          {!showScanner && (
            <div className="text-center py-10">
              <ScanLine className="text-gray-300 mx-auto mb-3" size={32} />
              <p className="text-gray-200 text-sm font-medium">
                Ready to Scan Prescription
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Point camera at QR code
              </p>
            </div>
          )}

          {showScanner && (
            <div className="relative w-full h-[260px]">
              <div
                id="reader"
                className="w-full h-full rounded-xl overflow-hidden"
              />

              <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-xl pointer-events-none animate-pulse" />

              <button
                onClick={stopScanner}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <XCircle size={18} />
              </button>
            </div>
          )}

          {!showScanner && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={startScanner}
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm"
              >
                Activate Camera
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;