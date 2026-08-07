import BASE_URL from "../config/api.js";
import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileText,
  UserRound,
  CheckCircle2,
  Stethoscope,
  Search,
  Activity,
} from "lucide-react";
import { useAuth } from "../../AuthProvider";

const UserRecord = () => {
  const [records, setRecords] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [Prescption , setPrescption]= useState(null)
  const [search, setSearch] = useState("");


  const fetchFinishedAppointment = async () => {
    try {
      setLoading(true);

      const refreshRes = await fetch(`${BASE_URL}/api/refresh-token`, {
          method: "POST",
          credentials: "include",
        }
      );

      const refreshData = await refreshRes.json();

      if (!refreshRes.ok) {
        throw new Error("Session expired");
      }

      const token = refreshData.newAccessToken;

      const res = await fetch(`${BASE_URL}/api/finishAppointment`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();


      if (data.success) {
        setRecords(data.appointments || []);
        setPrescption(data.prescriptionId)
        
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinishedAppointment();
  }, []);


  const filteredRecords = records.filter((record) =>
    record?.doctorId?.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between gap-6">
          
          <div>
            <h1 className="text-4xl font-bold text-white">
              My Medical Records
            </h1>
            <p className="text-teal-100 mt-2">
              All your completed consultations in one place
            </p>
          </div>

          {/* SEARCH */}
          <div className="bg-white flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg w-full lg:w-[320px]">
            <Search className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor..."
              className="w-full outline-none"
            />
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-6xl mx-auto p-6">

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-3xl p-6 shadow">
            <FileText className="text-teal-600" />
            <h2 className="text-3xl font-bold mt-3">
              {records.length}
            </h2>
            <p className="text-gray-500">Total Records</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow">
            <CheckCircle2 className="text-green-600" />
            <h2 className="text-3xl font-bold mt-3">
              {records.length}
            </h2>
            <p className="text-gray-500">Completed</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow">
            <Activity className="text-cyan-600" />
            <h2 className="text-2xl font-bold mt-3 text-cyan-600">
              Active
            </h2>
            <p className="text-gray-500">Health Status</p>
          </div>
        </div>


        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow">
            <FileText size={50} className="mx-auto text-gray-400" />
            <h2 className="text-2xl font-bold mt-4">
              No Records Found
            </h2>
          </div>
        ) : (
          // RECORD CARDS
          <div className="grid lg:grid-cols-2 gap-6">

            {filteredRecords.map((appointment, i) => (

              <div
                key={i}
                className="bg-white rounded-3xl p-6 shadow hover:shadow-xl transition"
              >

                {/* DOCTOR */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center">
                    <Stethoscope className="text-teal-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-lg">
                      Dr. {appointment?.doctorId?.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Completed Consultation
                    </p>
                  </div>
                </div>

                {/* INFO */}
                <div className="grid grid-cols-2 gap-4">

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <CalendarDays className="text-gray-500" />
                    <p className="text-sm text-gray-500 mt-2">
                      Date
                    </p>
                    <p className="font-bold">
                      {new Date(appointment.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <Clock3 className="text-gray-500" />
                    <p className="text-sm text-gray-500 mt-2">
                      Slot
                    </p>
                    <p className="font-bold">
                      {appointment?.slots?.[0]?.start}
                    </p>
                  </div>
                </div>

                {/* PATIENT LIST */}
              {/* PATIENT LIST */}
<div className="mt-5 space-y-4">
  <div className="flex items-center gap-2 mb-2">
    <UserRound className="text-teal-600" />
    <h3 className="font-bold text-lg">
      Patients
    </h3>
  </div>

  {appointment?.slots?.[0]?.patientList?.map((p, i) => {
    const isMe =
      user?.id === p?.patientId?._id;

    const canShowPrescription =
      isMe &&
      p?.status === "done" &&
      Prescption;

    return (
      <div
        key={i}
        className={`rounded-2xl border p-4 flex flex-col gap-4 transition-all ${
          isMe
            ? "bg-teal-50 border-teal-200 shadow-sm"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        {/* TOP SECTION */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          
          {/* USER INFO */}
          <div>
            <p className="font-semibold text-gray-800 text-base sm:text-lg">
              {p?.patientId?.name}
            </p>

            <p className="text-sm text-gray-500">
              Queue #{p?.queueNumber}
            </p>
          </div>

          {/* STATUS */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-4 py-1 rounded-full text-xs font-semibold capitalize ${
                p.status === "done"
                  ? "bg-green-100 text-green-700"
                  : p.status === "called"
                  ? "bg-blue-100 text-blue-700"
                  : p.status === "notcome"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {p.status}
            </span>

            {isMe && (
              <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                YOU
              </span>
            )}
          </div>
        </div>
        {isMe && (
          <>
            {p?.status === "done" ? (
              canShowPrescription ? (
                <div className="bg-white border-2 border-dashed border-teal-300 rounded-2xl p-4">
                  
                  <p className="font-semibold text-gray-700 mb-3">
                    Prescription Available
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={`${Prescption}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-semibold transition-all"
                    >
                      View Medicines
                    </a>

                    <a
                      href={`${Prescption}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center border border-teal-600 text-teal-600 hover:bg-teal-50 py-3 px-4 rounded-xl font-semibold transition-all"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 text-sm">
                  No prescription found for this appointment.
                </div>
              )
            ) : p?.status === "notcome" ? (
              /* MISSED APPOINTMENT MESSAGE */
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                You missed this appointment.  
                No prescription available.
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  })}
</div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRecord;