import BASE_URL from "../config/api.js";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket/FrontendSocketConnection";
import { toast } from "react-toastify";

const UserAppointmentShow = () => {
  const { user } = useAuth();

  localStorage.setItem("test", "hello");

  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([]);
  const [accesstoken, setaccesstoken] = useState();
const [slotQueueData, setslotQueueData] = useState({});
  const [appointments  , setappointments ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doctorPage, setDoctorPage] = useState(1);

const [doctorPagination, setDoctorPagination] = useState({
  currentPage: 1,
  limit: 5,
  totalSchedules: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const DOCTORS_PER_PAGE = 2;
const [currentPage, setCurrentPage] = useState(1);

const [pagination, setPagination] = useState(null);
  
const fetchDoctors = async (
  page = doctorPage,
  limit = DOCTORS_PER_PAGE
) => {
  try {
    const res = await fetch(
      `${BASE_URL}/api/get/all?page=${page}&limit=${limit}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch doctors");
    }

    console.log("Doctors API:", data);

    setDoctors(data.data || []);

    // IMPORTANT
    setDoctorPagination(
      data.pagination || {
        currentPage: page,
        limit,
        totalSchedules: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    );

  } catch (err) {
    console.error("Fetch doctors error:", err);

    toast.error("Failed to fetch doctors");
  } finally {
    setLoading(false);
  }
};






const reconnectToRoom = () => {
  const savedRoom = localStorage.getItem("roomId");
  const savedData = JSON.parse(localStorage.getItem("appointment"));

  if (!savedRoom || !savedData) return;

  socket.emit("patient:join", {
    doctorId: savedData.doctorId,
    date: savedData.date,
    slot: savedData.slot,
    patientId: user?.id,
  });

};

useEffect(() => {
  fetchAppointment(currentPage);
}, [currentPage]);

  const [upcomingAppointments, SetupcomingAppointments] = useState([]);

  const fetchAppointment = async (page = 1) => {
  try {
    const refreshRes = await fetch(`${BASE_URL}/api/refresh-token`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!refreshRes.ok) {
      toast.error("Refresh token failed");
      return;
    }

    const refreshData = await refreshRes.json();
    const newToken = refreshData.newAccessToken;

    if (!newToken) {
      toast.error("No access token returned");
      return;
    }

    const res = await fetch(
      `${BASE_URL}/api/take/appointments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
      }
    );

    const data = await res.json();
    console.log(data);

    SetupcomingAppointments(data.data || []);

    const appointment = data?.data?.[0];

    if (!appointment) return;

    socket.emit("patient:join", {
      doctorId: appointment.doctorId,
      date: appointment.date.split("T")[0],
      slot: appointment.slotStart,
      patientId: user.id,
    });

    const formattedDate = appointment?.date?.split("T")[0];
    const roomId = `${appointment?.doctorId}_${formattedDate}_${appointment?.slotStart}`;

    localStorage.setItem("roomId", roomId);
    localStorage.setItem(
      "appointment",
      JSON.stringify({
        doctorId: appointment?.doctorId,
        date: formattedDate,
        slot: appointment?.slotStart,
      })
    );

  } catch (err) {
    toast.error("Failed to fetch appointments", err.message);
  }
};

   
useEffect(() => {
  if (!user) return;

   if (user?.id) {
          socket.emit("PersonalAppointment", user.id); 
        }
      
        socket.on('appointmentBooking', () => {
          fetchAppointment(currentPage);
        })

  socket.on("connect", () => {
    reconnectToRoom();
  });

  reconnectToRoom();

  return () => {
    socket.off("connect");
  };
}, [user]);

const bookSlot = async () => {
  if (!selectedSlot) {
    alert("Select a slot first");
    return;
  }

  setBooking(true);

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

    setaccesstoken(newToken);


    const res = await fetch(`${BASE_URL}/api/add/patient`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newToken}`,
      },
      body: JSON.stringify(selectedSlot),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    toast.success(` Booked! Queue No: ${data.queueNumber}`);

    setSelectedSlot(null);
    fetchDoctors();
  } catch (err) {
    toast.error(err.message || "Booking failed");
  } finally {
    setBooking(false);
  }
};


const changeQueue = async (doctorId, startSlot, date) => {
  try {
    const res = await fetch(`${BASE_URL}/api/take/queue/number`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctorId,
        startSlot,
        date,
      }),
    });

    const data = await res.json();

    // Save queue number only for this doctor
    setslotQueueData((prev) => ({
      ...prev,
      [doctorId]: data.queueNumber,
    }));
  } catch (err) {
    toast.error("Failed to fetch queue");
  }
};



  useEffect(() => {
  if (user?.id) {
    socket.emit("PersonalAppointment", user.id); 
  }

 

  socket.on("DoctorSlotAdded", () => {
    fetchDoctors();
  });

  return () => {
    socket.off("DoctorSlotAdded");
  };
}, []);


  useEffect(() => {
    if (user?.id) {
      fetchDoctors();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-6 text-teal-700">
          Book Appointment
        </h1>

        {/* DOCTORS */}
<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
  {doctors.map((doc, i) => (
    <div
      key={i}
      className="group relative overflow-hidden bg-white/90 backdrop-blur rounded-3xl border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300"
    >
      {/* Top Gradient */}
      <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

      <div className="p-6">
        {/* Doctor Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${doc.doctorId?.name}`}
              className="w-16 h-16 rounded-2xl border-2 border-purple-200 shadow-md"
              alt="doctor"
            />

            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">
              Dr. {doc.doctorId?.name}
            </h2>

            <p className="text-sm text-gray-500">
              {doc.doctorId?.email}
            </p>

            <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
              Available Today
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="mt-5 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
          <span>📅</span>
          <span>{new Date(doc.date).toDateString()}</span>
        </div>

        {/* Slots */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Available Slots
          </h3>

          <div className="flex flex-wrap gap-2">
            {doc.slotDuration?.length > 0 ? (
              doc.slotDuration.map((slot, idx) => {
                const isSelected =
                  selectedSlot?.doctorId === doc.doctorId._id &&
                  selectedSlot?.date === doc.date &&
                  selectedSlot?.slotStart === slot.start;

                return (
                 <button
  key={idx}
  onClick={() => {
    setSelectedSlot({
      doctorId: doc.doctorId._id,
      patientId: user?.id,
      date: doc.date,
      slotStart: slot.start,
    });

    changeQueue(
      doc.doctorId._id,
      slot.start,
      doc.date
    );
  }}
  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
    isSelected
      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
      : "bg-white border border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50"
  }`}
>
  {slot.start} - {slot.end}
</button>
                );
              })
            ) : (
              <p className="text-red-500 text-sm">No slots available</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
         <div className="bg-indigo-50 px-3 py-2 rounded-xl">
  <p className="text-xs text-gray-500">
    Total Patients
  </p>

  <p className="font-bold text-indigo-700 text-lg">
    {slotQueueData[doc.doctorId._id] ?? 0}
  </p>
</div>

          <button
            onClick={() => navigate(`/profile/${doc.doctorId._id}`)}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium shadow-md hover:scale-105 transition"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

        {/* BOOK BUTTON */}
        <div className="mt-8">
          <button
            onClick={bookSlot}
            disabled={booking || !selectedSlot}
            className="relative w-full overflow-hidden group bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-teal-300/50 hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {booking ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Booking...
                </>
              ) : (
                <>
                  <span className="text-xl">🗓️</span>
                  Confirm Appointment
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>

        {/* APPOINTMENTS */}
        <h2 className="text-2xl font-bold mt-10 mb-4 text-teal-700">Upcoming Appointments</h2>

        <div className="grid gap-6">

  {upcomingAppointments && upcomingAppointments.length > 0 ? (

    upcomingAppointments.map((data, index) => (

      <div
        key={index}
        className="group relative overflow-hidden bg-white rounded-[30px] border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
      >

        {/* Top Gradient */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"></div>

        <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-5">

            {/* Avatar */}
            <div className="relative">

              <img
                src={`https://i.pravatar.cc/150?img=${index + 10}`}
                alt="doctor"
                className="w-20 h-20 rounded-3xl object-cover border-4 border-teal-100 shadow-lg"
              />

              {/* Online Dot */}
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white animate-pulse"></div>

            </div>

            {/* INFO */}
            <div>

              <div className="flex items-center gap-3 flex-wrap">

                <h1 className="text-2xl font-black text-gray-800">
                  {data.doctorName || "Dr. Unknown"}
                </h1>

                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                  Upcoming
                </span>

              </div>

              <p className="text-sm text-teal-600 font-semibold mt-1">
                Cardiology Specialist
              </p>

              <p className="text-gray-500 text-sm mt-2 max-w-xl leading-6">
                Dedicated healthcare specialist focused on patient
                wellness and personalized treatment solutions.
              </p>

              {/* DATE + TIME */}
              <div className="flex flex-wrap gap-3 mt-5">

                <div className="flex items-center gap-2 bg-gray-100 hover:bg-teal-50 transition px-4 py-2 rounded-2xl text-sm font-medium text-gray-700">
                  <span className="text-lg">📅</span>

                  <span>
                    {new Date(data.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 hover:bg-indigo-50 transition px-4 py-2 rounded-2xl text-sm font-medium text-gray-700">
                  <span className="text-lg">⏰</span>

                  <span>{data.slotStart}</span>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-center lg:items-end gap-4">

            {/* Queue Badge */}
            <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 text-white rounded-3xl px-8 py-5 shadow-xl text-center min-w-[150px]">
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs">✦</span>
              </div>
              <p className="text-xs uppercase tracking-[3px] opacity-80">Queue No</p>
              <h2 className="text-4xl font-black mt-1">#{data.queueNumber}</h2>
            </div>

            {/* Status Badge */}
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              data.status === "waiting" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
              data.status === "current" ? "bg-green-100 text-green-700 border border-green-200 animate-pulse" :
              data.status === "done"    ? "bg-gray-100 text-gray-500 border border-gray-200" :
              "bg-blue-100 text-blue-700 border border-blue-200"
            }`}>
              {data.status || "waiting"}
            </span>

            {/* View Queue Button */}
            <button
              onClick={() => navigate(`/queue`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border-2 border-teal-200 text-teal-600 font-semibold text-sm hover:bg-teal-50 hover:border-teal-400 hover:shadow-md transition-all duration-200"
            >
              <span>👁️</span> View Queue
            </button>

          </div>
        </div>

        <div className="absolute -bottom-16 right-0 w-40 h-40 bg-cyan-100 opacity-40 blur-3xl rounded-full"></div>

      </div>

    ))

  ) : (

    <div className="w-full bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center shadow-sm">

      <div className="text-6xl mb-4">📅</div>

      <h2 className="text-2xl font-bold text-gray-700">
        No Upcoming Appointments
      </h2>

      <p className="text-gray-500 mt-2">
        You don’t have any scheduled appointments right now.
      </p>

    </div>

  )}

</div>

      {/* =====================================
    DOCTOR PAGINATION
===================================== */}

{doctorPagination &&
  doctorPagination.totalPages > 1 && (
    <div className="col-span-full mt-4 flex flex-col items-center gap-4">

      {/* PAGE INFO */}
      <p className="text-sm text-gray-400 font-medium">
        Page{" "}

        <span className="text-purple-600 font-bold">
          {doctorPagination.currentPage}
        </span>

        {" "}of{" "}

        <span className="text-purple-600 font-bold">
          {doctorPagination.totalPages}
        </span>

        {" "}&middot;{" "}

        <span>
          {doctorPagination.totalSchedules}
        </span>

        {" "}total schedules
      </p>

      {/* BUTTONS */}
      <div className="flex items-center gap-2">

        {/* PREVIOUS */}
        <button
          onClick={() => {
            if (doctorPagination.hasPreviousPage) {
              setDoctorPage((page) => page - 1);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }
          }}
          disabled={
            !doctorPagination.hasPreviousPage
          }
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm bg-white border-2 border-gray-200 text-gray-600 shadow-sm hover:border-purple-400 hover:text-purple-600 hover:shadow-md active:scale-95 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>

          Previous
        </button>

        {/* PAGE NUMBERS */}
        <div className="flex items-center gap-1">

          {Array.from(
            {
              length: doctorPagination.totalPages,
            },
            (_, i) => i + 1
          ).map((page) => (
            <button
              key={page}
              onClick={() => {
                setDoctorPage(page);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                page === doctorPage
                  ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg scale-110"
                  : "bg-white border-2 border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:shadow-md"
              }`}
            >
              {page}
            </button>
          ))}

        </div>

        {/* NEXT */}
        <button
          onClick={() => {
            if (doctorPagination.hasNextPage) {
              setDoctorPage((page) => page + 1);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }
          }}
          disabled={
            !doctorPagination.hasNextPage
          }
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm bg-white border-2 border-gray-200 text-gray-600 shadow-sm hover:border-purple-400 hover:text-purple-600 hover:shadow-md active:scale-95 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          Next

          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

      </div>
    </div>
  )}

      </div>
    </div>
  );
};

export default UserAppointmentShow;