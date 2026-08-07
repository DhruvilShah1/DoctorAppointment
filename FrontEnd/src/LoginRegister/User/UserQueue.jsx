import BASE_URL from "../../config/api";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";

import {
  Users,
  Clock3,
  Activity,
  CheckCircle2,
  BellRing,
  UserRound,
  Sparkles,
} from "lucide-react";
import { socket } from "../../socket/FrontendSocketConnection";

const UserQueue = ({
  queueList,
  showList,
  currentNumber,
  currentQueueNumber,
  data,
  totalPatient,
  completedpatient,
}) => {
  const { user } = useAuth();

  const [NewData , setData] = useState(null);

  const [time, setTime] = useState("");

  const [me, setMe] = useState(null);


   const TodayAppointment = async () => {
    
          try {
        const refreshRes = await fetch(
          `${BASE_URL}/api/refresh-token`,
          {
            method: "POST",
            credentials: "include",
          }
        );
    
        const refreshData = await refreshRes.json();
    
        if (!refreshRes.ok) {
          throw new Error("Session expired, please login again");
        }
    
        const newToken = refreshData.newAccessToken;
    
    
         const res = await fetch(`${BASE_URL}/api/today/appointment`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${newToken}`, 
          },
        });
    
        const data = await res.json();

        if(data.success){
          setData(data.data)
        }
        
    
    
    
    
  

    
     
      }catch(err){
        console.log(err);        
      }
    
        
      }


  useEffect(() => {

    TodayAppointment();
    const updateClock = () => {
      const now = new Date();

      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const userId = user?.id || user?._id;

    if (!data?.patients || !userId) return;

    const found = data.patients.find(
      (s) => s?.patientId?._id === userId
    );

    setMe(found || null);
  }, [data, user]);

  const progress =
    totalPatient > 0
      ? (
          (completedpatient / totalPatient) *
          100
        ).toFixed(0)
      : 0;

  const today = new Date().toLocaleDateString();

  const isNext =
    me?.queueNumber ===
    currentQueueNumber + 1;

  const currentPatient = queueList.find(
    (p) => p.status === "called"
  );


  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}

      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row items-center justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Live Queue System
            </h1>

            <p className="text-teal-100 mt-2">
              Real-time patient queue tracking
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 text-white">
            <p className="text-sm text-teal-100">
              Today
            </p>

            <h2 className="text-xl font-bold">
              {today}
            </h2>

            <p className="mt-1 text-teal-100">
              {time}
            </p>
          </div>
        </div>
      </div>

      {/* WAITING SCREEN */}

      {!showList ? (
     <>
         {!NewData ? (
      /* ❌ NO APPOINTMENT STATE */
      <div className="flex items-center justify-center h-[80vh] px-6">
        <div className="bg-white rounded-[35px] shadow-xl p-10 text-center max-w-md w-full">

          <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Clock3 size={50} className="text-gray-400" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mt-6">
            No Appointment Found
          </h2>

          <p className="text-gray-500 mt-2">
            You have not booked any appointment for today.
          </p>

          <button className="mt-6 px-5 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition">
            Book Appointment
          </button>

        </div>
      </div>
    ) : (
      /* ✅ YOUR EXISTING UI */
      <div className="flex items-center justify-center h-[80vh] px-6">
        <div className="bg-white rounded-[35px] shadow-xl p-10 text-center max-w-xl w-full">

          {/* ICON */}
          <div className="w-28 h-28 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
            <Clock3 size={55} className="text-yellow-500 animate-pulse" />
          </div>

          {/* TITLE */}
          <h2 className="text-3xl font-bold text-gray-800 mt-6">
            Waiting For Doctor
          </h2>

          <p className="text-gray-500 mt-2">
            Queue has not started yet
          </p>

          {/* DETAILS */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-5 text-left space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-gray-700">
                {new Date(NewData?.date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Doctor</span>
              <span className="font-semibold text-gray-700">
                {NewData?.doctor?.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Slot Time</span>
              <span className="font-semibold text-teal-600">
                {NewData?.slot?.slotStart}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Your Token</span>
              <span className="font-bold text-gray-900">
                #{NewData?.slot?.queueNumber}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700 font-medium">
                {NewData?.slot?.status}
              </span>
            </div>
          </div>

          {/* ANIMATION */}
          <div className="mt-8 flex justify-center gap-2">
            <span className="w-3 h-3 bg-teal-500 rounded-full animate-bounce"></span>
            <span className="w-3 h-3 bg-teal-500 rounded-full animate-bounce delay-100"></span>
            <span className="w-3 h-3 bg-teal-500 rounded-full animate-bounce delay-200"></span>
          </div>
        </div>
      </div>
    )}
</>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          {/* TOP STATS */}

          <div className="grid md:grid-cols-4 gap-5 mb-6">
            {/* MY TOKEN */}

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500">
                    Your Token
                  </p>

                  <h2 className="text-5xl font-bold text-teal-600 mt-2">
                    {me?.queueNumber || "-"}
                  </h2>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
                  <UserRound className="text-teal-600" />
                </div>
              </div>
            </div>

            {/* NOW SERVING */}

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500">
                    Now Serving
                  </p>

                  <h2 className="text-5xl font-bold text-green-600 mt-2">
                    #{currentQueueNumber || 0}
                  </h2>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <BellRing className="text-green-600" />
                </div>
              </div>
            </div>

            {/* TOTAL */}

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500">
                    Total Patients
                  </p>

                  <h2 className="text-5xl font-bold text-cyan-600 mt-2">
                    {totalPatient}
                  </h2>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center">
                  <Users className="text-cyan-600" />
                </div>
              </div>
            </div>

            {/* STATUS */}

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500">
                    Your Status
                  </p>

                  <h2 className="text-2xl font-bold capitalize mt-3 text-orange-500">
                    {me?.status || "waiting"}
                  </h2>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Activity className="text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          {/* YOU ARE NEXT */}

          {isNext && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-6 shadow-xl mb-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">
                  You Are Next
                </h2>

                <p className="mt-2 text-yellow-100">
                  Please stay ready for your turn
                </p>
              </div>

              <Sparkles
                size={60}
                className="animate-pulse"
              />
            </div>
          )}

          {/* MAIN CONTENT */}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* QUEUE LIST */}

            <div className="lg:col-span-2 bg-white rounded-[35px] shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
                <h2 className="text-3xl font-bold">
                  Queue List
                </h2>

                <p className="text-teal-100 mt-1">
                  Live patient queue updates
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[700px] overflow-y-auto">
                {queueList.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    No Patients In Queue
                  </div>
                ) : (
                  queueList.map((p, i) => {
                    const isCurrent =
                      p.status === "called";

                    const isMe =
                      p.patientId?._id ===
                      (user?.id || user?._id);

                    return (
                      <div
                        key={i}
                        className={`rounded-3xl p-5 border-2 transition-all duration-300 ${
                          isCurrent
                            ? "bg-green-50 border-green-400 shadow-lg scale-[1.01]"
                            : isMe
                            ? "bg-teal-50 border-teal-400"
                            : "bg-slate-50 border-transparent"
                        } ${
                          p.status === "done"
                            ? "opacity-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                                isCurrent
                                  ? "bg-green-500 text-white"
                                  : isMe
                                  ? "bg-teal-500 text-white"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {p.queueNumber}
                            </div>

                            <div>
                              <h3 className="text-xl font-bold text-gray-800">
                                {p.patientId?.name ||
                                  "Patient"}
                              </h3>

                              <p className="text-sm text-gray-500 mt-1">
                                Queue Position #
                                {p.queueNumber}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                p.status === "called"
                                  ? "bg-green-100 text-green-600"
                                  : p.status === "done"
                                  ? "bg-blue-100 text-blue-600"
                                  : p.status ===
                                    "skipped"
                                  ? "bg-red-100 text-red-600"
                                  : p.status ===
                                    "notcome"
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {p.status}
                            </span>

                            {isMe && (
                              <p className="text-teal-600 text-sm font-semibold mt-2">
                                You
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL */}

            <div className="space-y-6">
              {/* CURRENT PATIENT */}

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-[35px] p-8 shadow-2xl">
                <p className="text-green-100">
                  Now Serving
                </p>

                <h2 className="text-7xl font-bold mt-4">
                  #{currentQueueNumber || 0}
                </h2>

                <div className="mt-6">
                  <p className="text-green-100">
                    Current Patient
                  </p>

                  <h3 className="text-2xl font-bold mt-2">
                    {currentPatient?.patientId
                      ?.name || "Waiting"}
                  </h3>
                </div>
              </div>

              {/* PROGRESS */}

              <div className="bg-white rounded-[35px] p-8 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Queue Progress
                  </h2>

                  <CheckCircle2 className="text-teal-600" />
                </div>

                <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-4 text-sm text-gray-500">
                  <span>
                    Completed:{" "}
                    {completedpatient}
                  </span>

                  <span>{progress}%</span>
                </div>
              </div>

              {/* MY INFO */}

              <div className="bg-white rounded-[35px] p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  My Queue Details
                </h2>

                <div className="space-y-5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Name
                    </span>

                    <span className="font-semibold">
                      {me?.patientId?.name ||
                        "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Queue Number
                    </span>

                    <span className="font-semibold text-teal-600">
                      #{me?.queueNumber || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Status
                    </span>

                    <span className="font-semibold capitalize">
                      {me?.status || "waiting"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Patients Left
                    </span>

                    <span className="font-semibold text-orange-500">
                      {me?.queueNumber
                        ? me.queueNumber -
                          currentQueueNumber -
                          1
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserQueue;