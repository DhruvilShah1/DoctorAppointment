import BASE_URL from "../../config/api";
import { getToken } from "../../config/token";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../AuthProvider";
import { toast } from "react-toastify";

import {
  CalendarDays,
  Users,
  Activity,
  Clock3,
  PhoneCall,
  CheckCircle2,
  SkipForward,
  XCircle,
  ArrowRight,
  BadgeCheck,
  Stethoscope,
} from "lucide-react";
import PrescriptionPopup from "./PrescriptionPopup";

const socket = io(import.meta.env.APP_URL);

const ScheduleDoctor = () => {
  const { user } = useAuth();

  const [slots, setSlots] = useState([]);
  const [patients, setPatients] = useState([]);

  const [pendingPatients, setPendingPatients] = useState([]);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [queueStarted, setQueueStarted] = useState(false);

  const [currentPatient, setCurrentPatient] = useState(null);

  const [totalPatients, setTotalPatients] = useState(0);

  const [loadingSlots, setLoadingSlots] = useState(false);

  const [error, setError] = useState("");

  const [callDone, setCallDone] = useState(false);

  const today = new Date().toISOString().split("T")[0];


  const authFetch = async (url, options = {}) => {

        const res = await fetch(`${BASE_URL}/api/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
      const data = await res.json();
      const token = data.newAccessToken || data.accessToken;

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  const loadTodayData = async () => {
    try {
      setLoadingSlots(true);
      const token = await getToken();

      const [totalRes, slotRes] = await Promise.all([
        fetch(`${BASE_URL}/api/total/patient/day`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: today,
          }),
        }),

        fetch(`${BASE_URL}/api/get/slots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: today,
          }),
        }),
      ]);

      const totalData = await totalRes.json();

      const slotData = await slotRes.json();

      setSlots(slotData?.slots || []);

      setTotalPatients(totalData?.totalPatients || 0);

    } catch (err) {
      console.error(err);

      setError("Failed to load slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadTodayData();
  }, []);


  const loadPatients = async (slot) => {
    try {
      const res = await authFetch(`${BASE_URL}/api/take/patient`,
        {
          method: "POST",
          body: JSON.stringify({
            date: today,
            slot,
          }),
        }
      );

      const data = await res.json();

      const list = data?.patients || [];

      setPatients(list);

      setPendingPatients(list);

      setCurrentPatient(null);

      setCallDone(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);

    setQueueStarted(false);

    setPatients([]);

    setPendingPatients([]);

    setCurrentPatient(null);

    setCallDone(false);

    loadPatients(slot.start);
  };


  const startQueue = async () => {
    if (!selectedSlot) {
      toast.error("Please select slot first");
      return;
    }

  if (patients.length === 0) {
    toast.error("No patients in this slot");
    return;
  }


    

    try {
      const res = await authFetch(
        `${BASE_URL}/api/start/queue`,
        {
          method: "POST",
          body: JSON.stringify({
            date: today,
            slot: selectedSlot.start,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      setQueueStarted(true);

      socket.emit("doctor:join", {
        doctorId: user.id,
        date: today,
        slot: selectedSlot.start,
      });

      if (pendingPatients.length > 0) {
        setCurrentPatient(pendingPatients[0]);
      }

      toast.success("Queue Started");
    } catch (err) {
      setError(err.message);
    }
  };

  const moveNext = (type = "") => {
    let updatedPending = [...pendingPatients];
    updatedPending.shift();

    if (
      type === "skipped" ||
      type === "next"
    ) {
      updatedPending.push(currentPatient);
    }

    // UPDATE STATE
    setPendingPatients(updatedPending);

    // NEXT PATIENT
    if (updatedPending.length > 0) {
      setCurrentPatient(updatedPending[0]);

      setCallDone(false);

      return;
    }

    // ALL COMPLETED
    setCurrentPatient({
      completed: true,
    });

    setCallDone(false);

    toast.info(
      "All patients completed. Click Finish Slot."
    );
  };

  const updatePatientStatus = async (status) => {
    if (!currentPatient) return;

    try {
      const res = await authFetch(
        `${BASE_URL}/api/update/patient/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            date: today,
            slot: selectedSlot.start,
            patientId: currentPatient.patientId._id,
            status,
          }),
        }
      );

      const data = await res.json();

      toast.success(data.message);

      // UPDATE PATIENT STATUS
      setPatients((prev) =>
        prev.map((p) =>
          p.patientId._id === currentPatient.patientId._id
            ? {
                ...p,
                status,
              }
            : p
        )
      );

      // ONLY CALL

      if (status === "called") {
        setCallDone(true);
        return;
      }

      // SKIPPED

      if (status === "skipped") {
        moveNext("skipped");
        return;
      }

      // NEXT

      if (status === "next") {
        moveNext("next");
        return;
      }

      // DONE / NOTCOME

      moveNext();
    } catch (err) {
      setError(err.message);
    }
  };

  // ================= FINISH SLOT =================

  const finishSlot = async () => {
    try {
      const res = await authFetch(
        `${BASE_URL}/api/finsh/slot`,
        {
          method: "POST",
          body: JSON.stringify({
            date: today,
            slot: selectedSlot.start,
          }),
        }
      );

      const data = await res.json();

      toast.success(data.message);

      setQueueStarted(false);

      setCurrentPatient(null);

      setPendingPatients([]);

      setCallDone(false);

      loadTodayData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const [showPopup, setShowPopup] =
  useState(false);

const [selectedPatient, setSelectedPatient] =
  useState(null);

  // ================= SKIPPED LIST =================

  const skippedPatients = patients.filter(
    (p) =>
      p.status === "skipped" ||
      p.status === "next"
  );

  // ================= UI =================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}

      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Doctor Queue Dashboard
            </h1>

            <p className="text-teal-100 mt-2">
              Manage patient flow efficiently
            </p>
          </div>

          <button
            onClick={startQueue}
            disabled={queueStarted}
            className={`px-6 py-3 rounded-2xl font-semibold text-white shadow-lg transition ${
              queueStarted
                ? "bg-green-600 cursor-not-allowed"
                : "bg-black/20 hover:bg-black/30"
            }`}
          >
            {queueStarted
              ? "Queue Running"
              : "Start Queue"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* STATS */}

        <div className="grid md:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">
                  Total Patients
                </p>

                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  {totalPatients}
                </h2>
              </div>

              <Users
                className="text-teal-600"
                size={40}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">
                  Queue Status
                </p>

                <h2 className="text-2xl font-bold mt-2">
                  {queueStarted ? (
                    <span className="text-green-600">
                      Active
                    </span>
                  ) : (
                    <span className="text-red-500">
                      Inactive
                    </span>
                  )}
                </h2>
              </div>

              <Activity
                className={`${
                  queueStarted
                    ? "text-green-500"
                    : "text-red-500"
                }`}
                size={40}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">
                  Current Slot
                </p>

                <h2 className="text-2xl font-bold mt-2 text-gray-800">
                  {selectedSlot?.start || "--"}
                </h2>
              </div>

              <Clock3
                className="text-cyan-600"
                size={40}
              />
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT */}

          <div className="lg:col-span-2 space-y-6">
            {/* SLOT SECTION */}

            <div className="bg-white rounded-3xl shadow p-6">
              <div className="flex items-center gap-2 mb-5">
                <CalendarDays className="text-teal-600" />

                <h2 className="text-2xl font-bold text-gray-800">
                  Today Slots
                </h2>
              </div>

              {loadingSlots ? (
                <div className="text-center py-10">
                  Loading slots...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        handleSlotSelect(slot)
                      }
                      className={`p-4 rounded-2xl border transition font-semibold ${
                        selectedSlot?.start === slot.start
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white hover:bg-teal-50"
                      }`}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CURRENT PATIENT */}

            {queueStarted &&
              currentPatient &&
              !currentPatient.completed && (
                <div className="bg-white rounded-3xl shadow overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white">
                    <div className="flex items-center gap-3">
                      <Stethoscope size={30} />

                      <div>
                        <h2 className="text-2xl font-bold">
                          Current Patient
                        </h2>

                        <p className="text-teal-100">
                          Queue Processing
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="text-center">
                      <div className="w-28 h-28 bg-teal-100 rounded-full flex items-center justify-center mx-auto text-4xl font-bold text-teal-700">
                        {currentPatient.patientId?.name?.charAt(
                          0
                        )}
                      </div>

                      <h2 className="text-3xl font-bold text-gray-800 mt-5">
                        {currentPatient.patientId?.name}
                      </h2>

                      <p className="text-gray-500 mt-2">
                        Queue Number #
                        {currentPatient.queueNumber}
                      </p>
                    </div>

                    {/* BUTTONS */}

                    <div className="grid md:grid-cols-2 gap-4 mt-8">
                      <button
                        onClick={() =>
                          updatePatientStatus("called")
                        }
                        className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold"
                      >
                        <PhoneCall />
                        Call Patient
                      </button>

                      <button
                        onClick={() =>
                          updatePatientStatus("skipped")
                        }
                        className="bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold"
                      >
                        <SkipForward />
                        Skip
                      </button>

                      {callDone && (
                        <>
                          <button
                             onClick={() => {
    setShowPopup(true);
  }}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold"
                          >
                            <CheckCircle2 />
                            Finished and Add Medicine
                          </button>

                          <button
                            onClick={() =>
                              updatePatientStatus(
                                "notcome"
                              )
                            }
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold"
                          >
                            <XCircle />
                            Not Come
                          </button>
                        </>
                      )}

                      <button
                        onClick={() =>
                          updatePatientStatus("next")
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold md:col-span-2"
                      >
                        <ArrowRight />
                        Next Patient
                      </button>
                    </div>
                  </div>
                </div>
              )}


  <PrescriptionPopup
  isOpen={showPopup}
  onClose={() => setShowPopup(false)}
  date = {today}
  patientData={currentPatient}
  slot = {selectedSlot}
  doctorData ={user}
    updatePatientStatus={updatePatientStatus}
/>

            {/* ALL COMPLETE */}

            {queueStarted &&
              currentPatient?.completed && (
                <div className="bg-white rounded-3xl shadow p-10 text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2
                      className="text-green-600"
                      size={50}
                    />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800 mt-6">
                    All Patients Completed
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Queue completed for this slot
                  </p>

                  <button
                    onClick={finishSlot}
                    className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-semibold"
                  >
                    Finish Slot
                  </button>
                </div>
              )}

            {/* PATIENT LIST */}

            <div className="bg-white rounded-3xl shadow p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users className="text-cyan-600" />

                <h2 className="text-2xl font-bold text-gray-800">
                  Patient Queue
                </h2>
              </div>

              <div className="space-y-4">
                {patients.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No Patients Found
                  </div>
                ) : (
                  patients.map((p, i) => (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
                          {p.patientId?.name?.charAt(0)}
                        </div>

                        <div>
                          <h3 className="font-bold text-gray-800">
                            {p.patientId?.name}
                          </h3>

                          <p className="text-sm text-gray-500">
                            Queue #{p.queueNumber}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          p.status === "done"
                            ? "bg-green-100 text-green-600"
                            : p.status === "called"
                            ? "bg-blue-100 text-blue-600"
                            : p.status === "skipped"
                            ? "bg-red-100 text-red-600"
                            : p.status === "next"
                            ? "bg-yellow-100 text-yellow-700"
                            : p.status === "notcome"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-6">
            {/* ACTIVE SLOT */}

            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-3xl p-6 shadow-xl">
              <p className="text-teal-100">
                Active Slot
              </p>

              <h2 className="text-5xl font-bold mt-3">
                {selectedSlot?.start || "--"}
              </h2>

              <p className="mt-4 text-teal-100">
                Selected consultation timing
              </p>
            </div>

            {/* SKIPPED */}

            <div className="bg-white rounded-3xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <SkipForward className="text-red-500" />

                <h2 className="text-xl font-bold">
                  Re-Queue Patients
                </h2>
              </div>

              {skippedPatients.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  No skipped/next patients
                </div>
              ) : (
                <div className="space-y-3">
                  {skippedPatients.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-red-50 p-3 rounded-2xl"
                    >
                      <div>
                        <p className="font-semibold">
                          {p.patientId?.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          Queue #{p.queueNumber}
                        </p>
                      </div>

                      <BadgeCheck className="text-red-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUMMARY */}

            <div className="bg-white rounded-3xl shadow p-6">
              <h2 className="text-xl font-bold mb-5">
                Queue Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Total Patients
                  </span>

                  <span className="font-bold">
                    {patients.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Pending
                  </span>

                  <span className="font-bold text-yellow-600">
                    {pendingPatients.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Re-Queue
                  </span>

                  <span className="font-bold text-red-600">
                    {skippedPatients.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Queue Status
                  </span>

                  <span
                    className={`font-bold ${
                      queueStarted
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {queueStarted
                      ? "Running"
                      : "Stopped"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDoctor;