import BASE_URL from "../../config/api";
import React, { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Save, Printer, Sparkles } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

export default function PrescriptionPopup({
  isOpen = true,
  onClose = () => {},
  date , slot , 
  patientData = {},
  doctorData = {},
  updatePatientStatus , 
}) {
  const signatureRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    instructions: "",
  });

  const [medicines, setMedicines] = useState([
    { name: "", strength: "", days: "", 
      timing : {
morning: false, afternoon: false, night: false
      }
       },
  ]);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addMedicine = () =>
    setMedicines([
      ...medicines,
      { name: "", strength: "", days: "",
        timing : {
morning: false, afternoon: false, night: false 
        }
        },
    ]);

  const updateMedicine = (i, key, value) => {
    const copy = [...medicines];
    copy[i][key] = value;
    setMedicines(copy);
  };

  const removeMedicine = (i) =>
    setMedicines(medicines.filter((_, idx) => idx !== i));

  const clearSignature = () => signatureRef.current?.clear();

 
 const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};


const handleSave = async () => {
  try {
    setLoading(true);

    let signatureFile = null;

    // Signature convert to file
    if (
      signatureRef.current &&
      !signatureRef.current.isEmpty()
    ) {
      const base64 =
        signatureRef.current.toDataURL("image/png");

      signatureFile = dataURLtoFile(
        base64,
        "signature.png"
      );
    }

    const formData = new FormData();

    // Safe data append
    formData.append(
      "doctorId",
      doctorData?.id || ""
    );

    formData.append(
      "doctorName",
      doctorData?.name || ""
    );

    formData.append(
      "patientName",
      patientData?.patientId?.name || ""
    );

    formData.append(
      "patientId",
      patientData?.patientId?._id || ""
    );

    formData.append(
      "instructions",
      form.instructions || ""
    );

    formData.append(
      "medicines",
      JSON.stringify(medicines || [])
    );

    formData.append(
      "date",
      date || ""
    );

    formData.append(
      "slot",
      slot?.start || slot || ""
    );

    // Signature field name MUST match multer
    if (signatureFile) {
      formData.append(
        "signature",
        signatureFile
      );
    }

    // DEBUG: check formData values
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    // refresh token
    const refreshRes = await fetch(
      `${BASE_URL}/api/refresh-token`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const refreshData =
      await refreshRes.json();

    if (!refreshData.newAccessToken) {
      throw new Error("Token refresh failed");
    }

    // create prescription
    const res = await fetch(
      `${BASE_URL}/api/create/prescription`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshData.newAccessToken}`,
        },
        body: formData,
      }
    );

    const result = await res.json();

    console.log("RESULT:", result);

    if (!res.ok) {
      throw new Error(
        result.message || "Something went wrong"
      );
    }

    if (result.success) {
      updatePatientStatus("done");

      alert("Prescription Saved");

      onClose();
    }
  } catch (err) {
    console.error(
      "Prescription Save Error:",
      err
    );

    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">

      <div className="w-full max-w-5xl h-[92vh] bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} /> Prescription Builder
            </h2>
            <p className="text-xs text-slate-500">Dr. {doctorData?.name || "Doctor"}</p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-red-100 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 grid grid-cols-12 gap-6">

          {/* LEFT PANEL */}
          <div className="col-span-12 lg:col-span-4 space-y-5">

            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h3 className="text-sm font-semibold mb-3">Patient</h3>
              <div className="space-y-3">
               <h1>{patientData?.patientId.name}</h1>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h3 className="text-sm font-semibold mb-3">Instructions</h3>
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                rows={5}
                className="input resize-none"
              />
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-12 lg:col-span-8 space-y-5">

            {/* MEDICINES */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border">

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Medicines</h3>
                <button
                  onClick={addMedicine}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-900 text-white hover:opacity-90"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="space-y-3">
               <div className="space-y-4">
  {medicines.map((m, i) => (
    <div
      key={i}
      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition"
    >
      {/* TOP */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-700">
          Medicine {i + 1}
        </h3>

        {medicines.length > 1 && (
          <button
            onClick={() => removeMedicine(i)}
            className="w-10 h-10 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* INPUTS */}
      <div className="grid md:grid-cols-3 gap-3">

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Medicine Name
          </label>

          <input
            className="input"
            placeholder="Paracetamol"
            value={m.name}
            onChange={(e) =>
              updateMedicine(i, "name", e.target.value)
            }
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Strength
          </label>

          <input
            className="input"
            placeholder="500mg"
            value={m.strength}
            onChange={(e) =>
              updateMedicine(i, "strength", e.target.value)
            }
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Days
          </label>

          <input
            type="number"
            className="input"
            placeholder="7"
            value={m.days}
            onChange={(e) =>
              updateMedicine(i, "days", e.target.value)
            }
          />
        </div>
      </div>

      {/* TIMING */}
      <div className="mt-5">
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Medicine Timing
        </h4>

        <div className="grid grid-cols-3 gap-3">

          {[
            {
              key: "morning",
              label: "Morning",
              icon: "🌞",
            },
            {
              key: "afternoon",
              label: "Afternoon",
              icon: "☀️",
            },
            {
              key: "night",
              label: "Night",
              icon: "🌙",
            },
          ].map((time) => (
            <button
              key={time.key}
              type="button"
              onClick={() => {
                const copy = [...medicines];

                copy[i].timing[time.key] =
                  !copy[i].timing[time.key];

                setMedicines(copy);
              }}
              className={`
                rounded-2xl border p-4 transition-all text-center
                ${
                  m.timing[time.key]
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                    : "bg-slate-50 border-slate-200 hover:border-indigo-300"
                }
              `}
            >
              <div className="text-2xl mb-1">
                {time.icon}
              </div>

              <p className="font-medium text-sm">
                {time.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  ))}
</div>
              </div>
            </div>

            {/* SIGNATURE */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h3 className="text-sm font-semibold mb-3">Signature</h3>
              <div className="border rounded-xl overflow-hidden bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  canvasProps={{ className: "w-full h-[140px]" }}
                />
              </div>

              <button
                onClick={clearSignature}
                className="text-xs text-red-500 mt-2"
              >Clear</button>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
          <button onClick={onClose} className="btn">Cancel</button>
<button
  onClick={handleSave}
  disabled={loading}
  className="btn primary flex items-center gap-2"
>
  {loading ? (
    <>
      <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
      Saving...
    </>
  ) : (
    <>
      <Save size={14} /> Save
    </>
  )}
</button>          <button onClick={handlePrint} className="btn success"><Printer size={14}/> Print</button>
        </div>

      </div>

      <style>{`
        .input{
          width:100%;
          padding:10px 12px;
          font-size:13px;
          border:1px solid #e5e7eb;
          border-radius:12px;
          outline:none;
          background:white;
          transition:0.2s;
        }
        .input:focus{
          border-color:#6366f1;
          box-shadow:0 0 0 3px rgba(99,102,241,0.15);
        }
        .btn{
          padding:8px 14px;
          font-size:13px;
          border-radius:10px;
          background:#f1f5f9;
        }
        .btn.primary{background:#4f46e5;color:white;}
        .btn.success{background:#16a34a;color:white;}
      `}</style>

    </div>
  );
}
