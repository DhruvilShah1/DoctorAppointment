import BASE_URL from "../config/api.js";
import React, { useEffect, useState } from "react";
import socket from "../../socket/FrontendSocketConnection";
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
  FileText,
  X,
  Loader2,
  CircleCheck,
  Eye,
  ClipboardCheck,
} from "lucide-react";

import PrescriptionPopup from "./PrescriptionPopup";


const ScheduleDoctor = () => {

  const { user } = useAuth();

  const [slots, setSlots] = useState([]);

  const [patients, setPatients] = useState([]);

  const [pendingPatients, setPendingPatients] =
    useState([]);

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [queueStarted, setQueueStarted] =
    useState(false);

  const [currentPatient, setCurrentPatient] =
    useState(null);

  const [totalPatients, setTotalPatients] =
    useState(0);

  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [error, setError] = useState("");

  const [callDone, setCallDone] =
    useState(false);


  /*
  =================================================
  PRESCRIPTION PROGRESS
  =================================================

  Object structure:

  {
      patientId: {
          patientName,
          progress,
          status,
          step,
          message,
          prescriptionId,
          doctorId,
          date,
          slot
      }
  }

  */

  const [
    prescriptionProgress,
    setPrescriptionProgress
  ] = useState({});


  /*
  =================================================
  SELECTED REPORT
  =================================================
  */

  const [
    selectedProgressPatient,
    setSelectedProgressPatient
  ] = useState(null);


  /*
  =================================================
  MEDICINE POPUP
  =================================================
  */

  const [showPopup, setShowPopup] =
    useState(false);

  const [selectedPatient, setSelectedPatient] =
    useState(null);


  const today =
    new Date().toISOString().split("T")[0];


  /*
  =================================================
  AUTH FETCH
  =================================================
  */

  const authFetch = async (
    url,
    options = {}
  ) => {

    const refreshRes =
      await fetch(
        `${BASE_URL}/api/refresh-token`,
        {
          method: "POST",
          credentials: "include",
        }
      );

    const refreshData =
      await refreshRes.json();

    const token =
      refreshData.newAccessToken ||
      refreshData.accessToken;


    return fetch(url, {

      ...options,

      headers: {

        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,

        ...options.headers,
      },

    });

  };


  /*
  =================================================
  SOCKET.IO
  =================================================
  */

  useEffect(() => {

    if (!user?.id) {

      console.log(
        "❌ Doctor ID not available"
      );

      return;
    }


    console.log(
      "👨‍⚕️ Joining doctor room:",
      user.id
    );


    /*
    Join personal doctor room
    */

    socket.emit(
      "personalData",
      {
        doctorId:
          String(user.id),
      }
    );


    /*
    =================================================
    PRESCRIPTION PROGRESS
    =================================================
    */

    const handlePrescriptionProgress =
      (data) => {

        console.log(
          "💊 Prescription progress received:",
          data
        );


        if (!data?.patientId) {

          console.log(
            "❌ patientId missing"
          );

          return;
        }


        const patientId =
          String(data.patientId);


        /*
        Store progress patient-wise
        */

        setPrescriptionProgress(
          (previous) => ({

            ...previous,

            [patientId]: {

              ...previous[patientId],

              ...data,

            },

          })
        );

      };


    socket.on(
      "prescription:progress",
      handlePrescriptionProgress
    );


    /*
    Cleanup
    */

    return () => {

      socket.off(
        "prescription:progress",
        handlePrescriptionProgress
      );

    };

  }, [user?.id]);


  /*
  =================================================
  LOAD TODAY DATA
  =================================================
  */

  const loadTodayData =
    async () => {

      try {

        setLoadingSlots(true);


        const refreshRes =
          await fetch(
            `${BASE_URL}/api/refresh-token`,
            {
              method: "POST",
              credentials: "include",
            }
          );


        const refreshData =
          await refreshRes.json();


        const token =
          refreshData.newAccessToken ||
          refreshData.accessToken;


        const [
          totalRes,
          slotRes
        ] = await Promise.all([

          fetch(
            `${BASE_URL}/api/total/patient/day`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                date: today,
              }),
            }
          ),


          fetch(
            `${BASE_URL}/api/get/slots`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                date: today,
              }),
            }
          ),

        ]);


        const totalData =
          await totalRes.json();


        const slotData =
          await slotRes.json();


        setSlots(
          slotData?.slots || []
        );


        setTotalPatients(
          totalData?.totalPatients || 0
        );


      } catch (err) {

        console.error(err);

        setError(
          "Failed to load slots"
        );

      } finally {

        setLoadingSlots(false);

      }

    };


  useEffect(() => {

    loadTodayData();

  }, []);


  /*
  =================================================
  LOAD PATIENTS
  =================================================
  */

  const loadPatients =
    async (slot) => {

      try {

        const res =
          await authFetch(
            `${BASE_URL}/api/take/patient`,
            {
              method: "POST",

              body: JSON.stringify({
                date: today,
                slot,
              }),
            }
          );


        const data =
          await res.json();


        const list =
          data?.patients || [];


        setPatients(list);

        setPendingPatients(list);

        setCurrentPatient(null);

        setCallDone(false);


      } catch (err) {

        console.error(err);

        setError(err.message);

      }

    };


  /*
  =================================================
  SELECT SLOT
  =================================================
  */

  const handleSlotSelect =
    (slot) => {

      setSelectedSlot(slot);

      setQueueStarted(false);

      setPatients([]);

      setPendingPatients([]);

      setCurrentPatient(null);

      setCallDone(false);


      /*
      Clear old reports
      */

      setPrescriptionProgress({});

      setSelectedProgressPatient(null);


      loadPatients(slot.start);

    };


  /*
  =================================================
  START QUEUE
  =================================================
  */

  const startQueue =
    async () => {

      if (!selectedSlot) {

        toast.error(
          "Please select slot first"
        );

        return;
      }


      if (patients.length === 0) {

        toast.error(
          "No patients in this slot"
        );

        return;
      }


      try {

        const res =
          await authFetch(
            `${BASE_URL}/api/start/queue`,
            {
              method: "POST",

              body: JSON.stringify({
                date: today,
                slot:
                  selectedSlot.start,
              }),
            }
          );


        const data =
          await res.json();


        if (!data.success) {

          toast.error(
            data.message
          );

          return;
        }


        setQueueStarted(true);


        /*
        Join queue room
        */

        socket.emit(
          "doctor:join",
          {

            doctorId:
              user.id,

            date:
              today,

            slot:
              selectedSlot.start,

          }
        );


        console.log(
          "👨‍⚕️ Doctor joined queue room"
        );


        if (
          pendingPatients.length > 0
        ) {

          setCurrentPatient(
            pendingPatients[0]
          );

        }


        toast.success(
          "Queue Started"
        );


      } catch (err) {

        setError(
          err.message
        );

      }

    };


  /*
  =================================================
  OPEN PATIENT REPORT
  =================================================
  */

  const openPatientReport =
    (patientId) => {

      const report =
        prescriptionProgress[
          String(patientId)
        ];


      if (!report) {

        toast.info(
          "No prescription progress available for this patient"
        );

        return;
      }


      setSelectedProgressPatient(
        report
      );

    };


  /*
  =================================================
  MOVE NEXT
  =================================================
  */

  const moveNext =
    (type = "") => {

      let updatedPending =
        [...pendingPatients];


      updatedPending.shift();


      if (
        type === "skipped" ||
        type === "next"
      ) {

        updatedPending.push(
          currentPatient
        );

      }


      setPendingPatients(
        updatedPending
      );


      if (
        updatedPending.length > 0
      ) {

        setCurrentPatient(
          updatedPending[0]
        );

        setCallDone(false);

        return;

      }


      setCurrentPatient({
        completed: true,
      });


      setCallDone(false);


      toast.info(
        "All patients completed. Click Finish Slot."
      );

    };


  /*
  =================================================
  UPDATE PATIENT STATUS
  =================================================
  */

  const updatePatientStatus =
    async (status) => {

      if (!currentPatient)
        return;


      try {

        const res =
          await authFetch(
            `${BASE_URL}/api/update/patient/status`,
            {

              method: "PATCH",

              body: JSON.stringify({

                date:
                  today,

                slot:
                  selectedSlot.start,

                patientId:
                  currentPatient
                    .patientId._id,

                status,

              }),

            }
          );


        const data =
          await res.json();


        toast.success(
          data.message
        );


        setPatients(
          (previous) =>

            previous.map(
              (patient) =>

                patient.patientId._id ===
                currentPatient.patientId._id

                  ? {
                      ...patient,
                      status,
                    }

                  : patient
            )
        );


        if (
          status === "called"
        ) {

          setCallDone(true);

          return;

        }


        if (
          status === "skipped"
        ) {

          moveNext("skipped");

          return;

        }


        if (
          status === "next"
        ) {

          moveNext("next");

          return;

        }


        moveNext();


      } catch (err) {

        setError(
          err.message
        );

      }

    };


  /*
  =================================================
  FINISH SLOT
  =================================================
  */

  const finishSlot =
    async () => {

      try {

        const res =
          await authFetch(
            `${BASE_URL}/api/finsh/slot`,
            {

              method: "POST",

              body: JSON.stringify({

                date:
                  today,

                slot:
                  selectedSlot.start,

              }),

            }
          );


        const data =
          await res.json();


        toast.success(
          data.message
        );


        setQueueStarted(false);

        setCurrentPatient(null);

        setPendingPatients([]);

        setCallDone(false);

        setPrescriptionProgress({});

        setSelectedProgressPatient(null);


        loadTodayData();


      } catch (err) {

        toast.error(
          err.message
        );

      }

    };


  /*
  =================================================
  SKIPPED PATIENTS
  =================================================
  */

  const skippedPatients =
    patients.filter(
      (patient) =>

        patient.status ===
          "skipped" ||

        patient.status ===
          "next"
    );


  /*
  =================================================
  RENDER
  =================================================
  */

  return (

    <div className="min-h-screen bg-slate-100">


      {/* =========================================
          HEADER
      ========================================== */}

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


      {/* =========================================
          MAIN
      ========================================== */}

      <div className="max-w-7xl mx-auto p-6">


        {/* =========================================
            STATS
        ========================================== */}

        <div className="grid md:grid-cols-3 gap-5 mb-6">


          <StatCard
            title="Total Patients"
            value={totalPatients}
            icon={
              <Users
                className="text-teal-600"
                size={40}
              />
            }
          />


          <StatCard
            title="Queue Status"
            value={
              queueStarted
                ? "Active"
                : "Inactive"
            }
            valueClass={
              queueStarted
                ? "text-green-600"
                : "text-red-500"
            }
            icon={
              <Activity
                className={
                  queueStarted
                    ? "text-green-500"
                    : "text-red-500"
                }
                size={40}
              />
            }
          />


          <StatCard
            title="Current Slot"
            value={
              selectedSlot?.start ||
              "--"
            }
            icon={
              <Clock3
                className="text-cyan-600"
                size={40}
              />
            }
          />

        </div>


        {error && (

          <div className="bg-red-100 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">

            {error}

          </div>

        )}


        <div className="grid lg:grid-cols-3 gap-6">


          {/* =======================================
              LEFT
          ======================================== */}

          <div className="lg:col-span-2 space-y-6">


            {/* =====================================
                SLOTS
            ====================================== */}

            <div className="bg-white rounded-3xl shadow p-6">

              <div className="flex items-center gap-2 mb-5">

                <CalendarDays
                  className="text-teal-600"
                />

                <h2 className="text-2xl font-bold text-gray-800">
                  Today's Slots
                </h2>

              </div>


              {loadingSlots ? (

                <div className="text-center py-10">
                  Loading slots...
                </div>

              ) : (

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  {slots.map(
                    (slot, index) => (

                      <button

                        key={index}

                        onClick={() =>
                          handleSlotSelect(
                            slot
                          )
                        }

                        className={`p-4 rounded-2xl border transition font-semibold ${
                          selectedSlot?.start ===
                          slot.start

                            ? "bg-teal-600 text-white border-teal-600"

                            : "bg-white hover:bg-teal-50"
                        }`}

                      >

                        {slot.start}

                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            {/* =====================================
                CURRENT PATIENT
            ====================================== */}

            {queueStarted &&
              currentPatient &&
              !currentPatient.completed && (

                <div className="bg-white rounded-3xl shadow overflow-hidden">


                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white">

                    <div className="flex items-center gap-3">

                      <Stethoscope
                        size={30}
                      />

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

                        {currentPatient
                          .patientId
                          ?.name
                          ?.charAt(0)}

                      </div>


                      <h2 className="text-3xl font-bold text-gray-800 mt-5">

                        {
                          currentPatient
                            .patientId
                            ?.name
                        }

                      </h2>


                      <p className="text-gray-500 mt-2">

                        Queue Number #

                        {
                          currentPatient.queueNumber
                        }

                      </p>

                    </div>


                    <div className="grid md:grid-cols-2 gap-4 mt-8">


                      <button

                        onClick={() =>
                          updatePatientStatus(
                            "called"
                          )
                        }

                        className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold"

                      >

                        <PhoneCall />

                        Call Patient

                      </button>


                      <button

                        onClick={() =>
                          updatePatientStatus(
                            "skipped"
                          )
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

                              setSelectedPatient(
                                currentPatient
                              );

                              setShowPopup(
                                true
                              );

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
                          updatePatientStatus(
                            "next"
                          )
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


            {/* =====================================
                MEDICINE POPUP
            ====================================== */}

            <PrescriptionPopup

              isOpen={showPopup}

              onClose={() =>
                setShowPopup(false)
              }

              date={today}

              patientData={
                selectedPatient ||
                currentPatient
              }

              slot={selectedSlot}

              doctorData={user}

              updatePatientStatus={
                updatePatientStatus
              }

            />


            {/* =====================================
                PATIENT QUEUE
            ====================================== */}

            <div className="bg-white rounded-3xl shadow p-6">


              <div className="flex items-center justify-between mb-6">

                <div className="flex items-center gap-2">

                  <Users
                    className="text-cyan-600"
                  />

                  <div>

                    <h2 className="text-2xl font-bold text-gray-800">
                      Patient Queue
                    </h2>

                    <p className="text-sm text-gray-500">
                      Live patient-wise prescription progress
                    </p>

                  </div>

                </div>

              </div>


              {patients.length === 0  ? (

                <div className="text-center py-10 text-gray-500">

                  No Patients Found

                </div>

              ) : (

                <div className="space-y-4">


                 {patients.map((patient, index) => {

  const patientId =
    String(patient.patientId?._id);

  const progress =
    prescriptionProgress[patientId];

  const progressValue =
    Number(progress?.progress || 0);

  const status =
    queueStarted
      ? "done"
      : progress?.status || "waiting";


  return (

    <PatientProgressRow

      key={
        patientId || index
      }

      patient={patient}

      progress={
        queueStarted
          ? {
              ...progress,
              progress: 100,
              status: "done",
              isDone: true,
              message: "Queue Completed",
            }
          : progress
      }

      progressValue={
        queueStarted
          ? 100
          : progressValue
      }

      status={
        status
      }

      onReport={() =>
        openPatientReport(
          patientId
        )
      }

    />

  );

})}

                </div>

              )}

            </div>


          </div>


          {/* =======================================
              RIGHT SIDE
          ======================================== */}

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


            {/* =====================================
                PROGRESS SUMMARY
            ====================================== */}

            <ProgressSummary
              patients={
                patients
              }
              prescriptionProgress={
                prescriptionProgress
              }
            />


            {/* =====================================
                SKIPPED
            ====================================== */}

            <div className="bg-white rounded-3xl shadow p-6">

              <div className="flex items-center gap-2 mb-4">

                <SkipForward
                  className="text-red-500"
                />

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

                  {skippedPatients.map(
                    (patient, index) => (

                      <div
                        key={index}
                        className="flex items-center justify-between bg-red-50 p-3 rounded-2xl"
                      >

                        <div>

                          <p className="font-semibold">
                            {
                              patient
                                .patientId
                                ?.name
                            }
                          </p>

                          <p className="text-xs text-gray-500">
                            Queue #
                            {
                              patient.queueNumber
                            }
                          </p>

                        </div>

                        <BadgeCheck
                          className="text-red-500"
                        />

                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            {/* SUMMARY */}

            <div className="bg-white rounded-3xl shadow p-6">

              <h2 className="text-xl font-bold mb-5">
                Queue Summary
              </h2>


              <div className="space-y-4">

                <SummaryRow
                  label="Total Patients"
                  value={
                    patients.length
                  }
                />

                <SummaryRow
                  label="Pending"
                  value={
                    pendingPatients.length
                  }
                  valueClass="text-yellow-600"
                />

                <SummaryRow
                  label="Re-Queue"
                  value={
                    skippedPatients.length
                  }
                  valueClass="text-red-600"
                />

                <SummaryRow
                  label="Queue Status"
                  value={
                    queueStarted
                      ? "Running"
                      : "Stopped"
                  }
                  valueClass={
                    queueStarted
                      ? "text-green-600"
                      : "text-red-500"
                  }
                />

              </div>

            </div>


            {queueStarted &&
              currentPatient?.completed && (

                <button

                  onClick={
                    finishSlot
                  }

                  className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-semibold"

                >

                  Finish Slot

                </button>

              )}

          </div>

        </div>

      </div>


      {/* =========================================
          PATIENT REPORT MODAL
      ========================================== */}

      {selectedProgressPatient && (

        <PatientProgressModal

          progressData={
            selectedProgressPatient
          }

          onClose={() =>
            setSelectedProgressPatient(
              null
            )
          }

        />

      )}

    </div>

  );

};


/*
=================================================
PATIENT PROGRESS ROW
=================================================
*/

const PatientProgressRow = ({
  patient,
  progress,
  progressValue,
  status,
  onReport,
}) => {

  const patientName =
    patient.patientId?.name ||
    progress?.patientName ||
    "Unknown Patient";


  const isSuccess =
    status === "success";


  const isFailed =
    status === "failed";


  return (

    <div className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition">


      <div className="flex flex-col xl:flex-row xl:items-center gap-4">


        {/* PATIENT */}

        <div className="flex items-center gap-3 xl:w-[220px]">

          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">

            {patientName
              .charAt(0)
              .toUpperCase()}

          </div>


          <div className="min-w-0">

            <h3 className="font-bold text-gray-800 truncate">

              {patientName}

            </h3>


            <p className="text-xs text-gray-500">

              Queue #
              {patient.queueNumber}

            </p>

          </div>

        </div>


        {/* PROGRESS */}

        <div className="flex-1 min-w-0">

          <div className="flex justify-between items-center mb-2">

            <span className="text-xs text-gray-500">
              Prescription
            </span>

            <span className="font-bold text-sm">

              {progressValue}%

            </span>

          </div>


          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

            <div

              className={`h-full rounded-full transition-all duration-700 ${
                isSuccess
                  ? "bg-green-500"
                  : isFailed
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}

              style={{
                width:
                  `${progressValue}%`,
              }}

            />

          </div>


          <div className="flex justify-between mt-2">

            <span className="text-xs text-gray-400">

              {progress?.message ||
                "Waiting for prescription"}

            </span>


            <span
              className={`text-xs font-semibold ${
                isSuccess
                  ? "text-green-600"
                  : isFailed
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >

              {isSuccess
                ? "Completed"
                : isFailed
                ? "Failed"
                : progress
                ? "Processing"
                : "Waiting"}

            </span>

          </div>

        </div>


        {/* REPORT */}

        <button

          onClick={onReport}

          className={`xl:w-[120px] px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
            progress
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400"
          }`}

        >

          <Eye size={18} />

          Report

        </button>

      </div>

    </div>

  );

};


/*
=================================================
PATIENT PROGRESS MODAL
=================================================
*/

const PatientProgressModal = ({
  progressData,
  onClose,
}) => {

  const progress =
    Number(
      progressData.progress || 0
    );


  const isSuccess =
    progressData.status ===
    "success";


  const isFailed =
    progressData.status ===
    "failed";


  return (

    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">


      {/* BACKDROP */}

      <div

        className="absolute inset-0 bg-black/60 backdrop-blur-sm"

        onClick={
          onClose
        }

      />


      {/* MODAL */}

      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">


        {/* HEADER */}

        <div

          className={`p-6 text-white ${
            isSuccess
              ? "bg-gradient-to-r from-green-600 to-emerald-500"
              : isFailed
              ? "bg-gradient-to-r from-red-600 to-rose-500"
              : "bg-gradient-to-r from-blue-600 to-cyan-500"
          }`}

        >

          <div className="flex items-center justify-between">


            <div className="flex items-center gap-4">


              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">

                {isSuccess ? (

                  <CircleCheck
                    size={30}
                  />

                ) : isFailed ? (

                  <XCircle
                    size={30}
                  />

                ) : (

                  <Loader2
                    size={30}
                    className="animate-spin"
                  />

                )}

              </div>


              <div>

                <h2 className="text-2xl font-bold">
                  Patient Prescription Report
                </h2>

                <p className="text-white/80 mt-1">
                  Live prescription processing details
                </p>

              </div>


            </div>


            <button

              onClick={
                onClose
              }

              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"

            >

              <X size={22} />

            </button>

          </div>

        </div>


        {/* BODY */}

        <div className="p-6">


          {/* PATIENT HEADER */}

          <div className="bg-slate-50 rounded-2xl p-5 flex items-center gap-4">


            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-bold">

              {progressData.patientName
                ?.charAt(0)
                ?.toUpperCase()}

            </div>


            <div>

              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Patient
              </p>

              <h3 className="text-2xl font-bold text-gray-800">

                {
                  progressData.patientName ||
                  "Unknown Patient"
                }

              </h3>


              <p className="text-sm text-gray-500 mt-1">

                Patient ID:
                {" "}
                {progressData.patientId}

              </p>

            </div>

          </div>


          {/* CIRCULAR PROGRESS */}

          <div className="py-8 text-center">


            <div className="relative w-44 h-44 mx-auto">


              <svg

                className="w-44 h-44 -rotate-90"

                viewBox="0 0 120 120"

              >

                <circle

                  cx="60"
                  cy="60"
                  r="50"

                  fill="none"

                  strokeWidth="9"

                  className="stroke-gray-100"

                />


                <circle

                  cx="60"
                  cy="60"
                  r="50"

                  fill="none"

                  strokeWidth="9"

                  strokeLinecap="round"

                  className={
                    isSuccess
                      ? "stroke-green-500"
                      : isFailed
                      ? "stroke-red-500"
                      : "stroke-blue-500"
                  }

                  strokeDasharray="314"

                  strokeDashoffset={
                    314 -
                    (314 * progress) /
                      100
                  }

                />

              </svg>


              <div className="absolute inset-0 flex flex-col items-center justify-center">

                <span className="text-4xl font-black text-gray-800">

                  {progress}%

                </span>


                <span className="text-xs text-gray-500">

                  Complete

                </span>

              </div>

            </div>


            <h3

              className={`text-xl font-bold mt-4 ${
                isSuccess
                  ? "text-green-600"
                  : isFailed
                  ? "text-red-600"
                  : "text-blue-600"
              }`}

            >

              {isSuccess
                ? "Prescription Completed"
                : isFailed
                ? "Prescription Failed"
                : "Prescription Processing"}

            </h3>

          </div>


          {/* STATUS */}

          <div className="grid grid-cols-3 gap-3">


            <ReportStat

              label="Progress"

              value={`${progress}%`}

            />


            <ReportStat

              label="Step"

              value={
                progressData.step ||
                "--"
              }

            />


            <ReportStat

              label="Status"

              value={
                progressData.status ||
                "waiting"
              }

            />

          </div>


          {/* DETAILS */}

          <div className="grid md:grid-cols-2 gap-3 mt-4">


            <ReportDetail

              label="Prescription ID"

              value={
                progressData.prescriptionId
              }

            />


            <ReportDetail

              label="Patient ID"

              value={
                progressData.patientId
              }

            />


            <ReportDetail

              label="Doctor ID"

              value={
                progressData.doctorId
              }

            />


            <ReportDetail

              label="Date"

              value={
                progressData.date
              }

            />


            <ReportDetail

              label="Slot"

              value={
                progressData.slot
              }

            />


            <ReportDetail

              label="Current Step"

              value={
                progressData.step
                  ? `Step ${progressData.step}`
                  : "--"
              }

            />

          </div>


          {/* MESSAGE */}

          <div className="mt-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl">


            <div className="flex gap-3">


              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">

                <FileText
                  className="text-blue-600"
                  size={20}
                />

              </div>


              <div>

                <p className="text-xs uppercase tracking-wider font-bold text-blue-600">

                  Current Message

                </p>


                <p className="text-gray-800 font-semibold mt-1">

                  {
                    progressData.message ||
                    "Waiting for update..."
                  }

                </p>

              </div>

            </div>

          </div>


          {/* CLOSE */}

          <button

            onClick={
              onClose
            }

            className="w-full mt-6 py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-semibold"

          >

            Close Report

          </button>

        </div>

      </div>

    </div>

  );

};


/*
=================================================
PROGRESS SUMMARY
=================================================
*/

const ProgressSummary = ({
  patients,
  prescriptionProgress,
}) => {

  const total =
    patients.length;


  const completed =
    patients.filter(
      (patient) =>
        prescriptionProgress[
          String(
            patient.patientId?._id
          )
        ]?.status === "success"
    ).length;


  const processing =
    patients.filter(
      (patient) => {

        const progress =
          prescriptionProgress[
            String(
              patient.patientId?._id
            )
          ];


        return (
          progress &&
          progress.status !==
            "success" &&
          progress.status !==
            "failed"
        );

      }
    ).length;


  return (

    <div className="bg-white rounded-3xl shadow p-6">


      <div className="flex items-center gap-3 mb-5">


        <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">

          <ClipboardCheck
            className="text-blue-600"
            size={22}
          />

        </div>


        <div>

          <h2 className="font-bold text-gray-800">
            Prescription Progress
          </h2>

          <p className="text-sm text-gray-500">
            Patient-wise status
          </p>

        </div>

      </div>


      <div className="space-y-4">


        <SummaryRow
          label="Total Patients"
          value={total}
        />


        <SummaryRow
          label="Completed"
          value={completed}
          valueClass="text-green-600"
        />


        <SummaryRow
          label="Processing"
          value={processing}
          valueClass="text-blue-600"
        />


      </div>


      {total > 0 && (

        <div className="mt-5">

          <div className="flex justify-between text-xs text-gray-500 mb-2">

            <span>
              Overall completion
            </span>

            <span className="font-bold">

              {Math.round(
                (completed / total) *
                  100
              )}%

            </span>

          </div>


          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">

            <div

              className="h-full bg-green-500 rounded-full transition-all duration-700"

              style={{
                width:
                  `${Math.round(
                    (completed / total) *
                      100
                  )}%`,
              }}

            />

          </div>

        </div>

      )}

    </div>

  );

};


/*
=================================================
REPORT DETAIL
=================================================
*/

const ReportDetail = ({
  label,
  value,
}) => {

  return (

    <div className="bg-gray-50 rounded-xl p-4">

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="text-sm font-semibold text-gray-800 mt-1 break-all">

        {value || "--"}

      </p>

    </div>

  );

};


/*
=================================================
REPORT STAT
=================================================
*/

const ReportStat = ({
  label,
  value,
}) => {

  return (

    <div className="bg-gray-50 rounded-2xl p-4 text-center">

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="text-lg font-bold text-gray-800 mt-1">
        {value}
      </p>

    </div>

  );

};


/*
=================================================
STAT CARD
=================================================
*/

const StatCard = ({
  title,
  value,
  icon,
  valueClass = "text-gray-800",
}) => {

  return (

    <div className="bg-white rounded-3xl p-6 shadow">

      <div className="flex justify-between items-center">


        <div>

          <p className="text-gray-500">
            {title}
          </p>

          <h2
            className={`text-3xl font-bold mt-2 ${valueClass}`}
          >

            {value}

          </h2>

        </div>


        {icon}

      </div>

    </div>

  );

};


/*
=================================================
SUMMARY ROW
=================================================
*/

const SummaryRow = ({
  label,
  value,
  valueClass = "text-gray-800",
}) => {

  return (

    <div className="flex justify-between">

      <span className="text-gray-500">
        {label}
      </span>

      <span
        className={`font-bold ${valueClass}`}
      >
        {value}
      </span>

    </div>

  );

};


export default ScheduleDoctor;