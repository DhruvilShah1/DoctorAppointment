import React, { useState, useEffect } from "react";
import {
  User,
  Stethoscope,
  Pill,
  ShieldCheck,
  ClipboardList,
  BadgeCheck,
  FileText,
  CheckCircle2,
} from "lucide-react";
import QRScanner from "./QRScanner";

const PharmacyDashboard = () => {
  const [data, setData] = useState(null);
  const [checkedMedicine, setCheckedMedicine] = useState([]);

  useEffect(() => {
    if (data) {
      setCheckedMedicine([]);
    }
  }, [data]);

 
  const handleCheck = (
  index
) => {
  setData((prev) => ({
    ...prev,
    medicines:
      prev.medicines.map(
        (med, i) =>
          i === index
            ? {
                ...med,
                medicineChecker:
                  !med.medicineChecker,
              }
            : med
      ),
  }));

  
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6">

      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <ClipboardList className="text-white" />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Pharmacy Control Center
              </h1>

              <p className="text-slate-500 mt-1 text-sm">
                Smart prescription verification & medicine dispensing
              </p>
            </div>
          </div>
        </div>

        {data && (
          <div className="mt-5 lg:mt-0 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-3xl shadow-sm flex items-center gap-3">
            <BadgeCheck size={20} />
            <div>
              <p className="font-semibold text-sm">
                Prescription Verified
              </p>
              <p className="text-xs opacity-70">
                Ready for dispensing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">

        {/* LEFT PANEL */}
        <div className="xl:col-span-4">
          <div className="bg-white/70 backdrop-blur-2xl rounded-[34px] border border-white shadow-2xl p-5 sticky top-6">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                QR Scanner
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Scan QR prescription to load patient data instantly
              </p>
            </div>

            <QRScanner setData={setData} />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-8">

          <div className="bg-white/70 backdrop-blur-2xl rounded-[34px] border border-white shadow-2xl p-7 min-h-[720px]">

            {!data ? (
              <div className="h-full flex flex-col justify-center items-center text-center py-28">

                <div className="w-32 h-32 rounded-[38px] bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner mb-6">
                  <ShieldCheck
                    size={52}
                    className="text-blue-600"
                  />
                </div>

                <h2 className="text-3xl font-bold text-slate-900">
                  No Prescription Scanned
                </h2>

                <p className="text-slate-500 mt-3 max-w-lg leading-relaxed">
                  Scan a prescription QR code to instantly load
                  patient details, doctor information and
                  prescribed medicines.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-5">

                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Prescription Details
                    </h2>

                    <p className="text-slate-500 text-sm mt-1">
                      Review and verify medication list
                    </p>
                  </div>

                  <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl flex items-center gap-2 font-medium">
                    <FileText size={16} />
                    Active Prescription
                  </div>
                </div>

                {/* Patient + Doctor */}
                <div className="grid lg:grid-cols-2 gap-5 mb-7">

                  {/* Patient Card */}
                  <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[30px] p-6 shadow-xl text-white relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-3xl" />

                    <div className="relative z-10 flex justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">
                          Patient Name
                        </p>

                        <h3 className="text-2xl font-bold mt-2">
                          {data?.patientId?.name}
                        </h3>
                      </div>

                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <User size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Doctor Card */}
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[30px] p-6 shadow-xl text-white relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-3xl" />

                    <div className="relative z-10 flex justify-between">

                      <div>
                        <p className="text-indigo-100 text-sm">
                          Prescribed By
                        </p>

                        <h3 className="text-2xl font-bold mt-2">
                          Dr. {data?.doctorId?.name}
                        </h3>

                        {data?.signature && (
                          <div className="mt-5 bg-white/10 border border-white/20 rounded-2xl p-3 w-fit">
                            <p className="text-xs text-indigo-100 mb-2">
                              Doctor Signature
                            </p>

                            <img
                              src={data.signature}
                              alt="Doctor Signature"
                              className="h-14 object-contain rounded-lg bg-white p-1"
                            />
                          </div>
                        )}
                      </div>

                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Stethoscope size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medicines */}
                <div>

                  <div className="flex items-center justify-between mb-5">

                    <div className="flex items-center gap-3">

                      <div className="bg-purple-100 p-3 rounded-2xl">
                        <Pill className="text-purple-600" />
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          Prescribed Medicines
                        </h3>

                        <p className="text-sm text-slate-500">
                          Mark medicines after dispensing
                        </p>
                      </div>
                    </div>

                    <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                      {data?.medicines?.length || 0} Medicines
                    </span>
                  </div>

                  {/* Medicine Cards */}
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">

                    {data?.medicines?.map(
  (med, i) => {
    const checked =
      med.medicineChecker;

    return (
      <div
        key={i}
        className={`rounded-[28px] p-5 border transition-all duration-300 ${
          checked
            ? "bg-green-50 border-green-300 shadow-md"
            : "bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-white hover:shadow-lg"
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">
              {med.name}
            </h4>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
              <span>
                Strength:
                {" "}
                {
                  med.strength
                }
              </span>

              <span>
                Days:
                {" "}
                {med.days}
              </span>
            </div>

            {/* Timing */}
            <div className="flex flex-wrap gap-2 mt-4">
              {med?.timing
                ?.morning && (
                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                  Morning
                </span>
              )}

              {med?.timing
                ?.afternoon && (
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                  Afternoon
                </span>
              )}

              {med?.timing
                ?.night && (
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                  Night
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() =>
              handleCheck(i)
            }
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              checked
                ? "bg-green-600 text-white shadow-lg scale-105"
                : "bg-slate-200 text-slate-500 hover:bg-blue-100 hover:text-blue-600"
            }`}
          >
            <CheckCircle2
              size={22}
            />
          </button>
        </div>
      </div>
    );
  }
)}
                  </div>
                </div>

                {/* Action Button */}
                <button className="mt-8 w-full h-16 rounded-[24px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-xl hover:scale-[1.01] hover:shadow-2xl transition-all duration-300">
                  Verify & Dispense Medicines
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;