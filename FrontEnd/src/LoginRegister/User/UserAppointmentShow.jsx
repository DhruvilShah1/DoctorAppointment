import BASE_URL from "../config/api.js";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket/FrontendSocketConnection";
import { toast } from "react-toastify";

const UserAppointmentShow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ============================================
  // DOCTORS
  // ============================================

  const [doctors, setDoctors] = useState([]);

  const [doctorPage, setDoctorPage] = useState(1);

  const DOCTORS_PER_PAGE = 2;

  const [doctorPagination, setDoctorPagination] = useState({
    currentPage: 1,
    limit: DOCTORS_PER_PAGE,
    totalSchedules: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // ============================================
  // SEARCH
  // ============================================

  const [search, setSearch] = useState("");

  // ============================================
  // LOADING
  // ============================================

  const [loading, setLoading] = useState(true);

  // ============================================
  // BOOKING
  // ============================================

  const [booking, setBooking] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [accessToken, setAccessToken] = useState();

  // ============================================
  // QUEUE
  // ============================================

  const [slotQueueData, setSlotQueueData] = useState({});

  // ============================================
  // APPOINTMENTS
  // ============================================

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  // ============================================
  // FETCH DOCTORS
  // ============================================

  const fetchDoctors = async (
    page = doctorPage,
    limit = DOCTORS_PER_PAGE,
    searchValue = search
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", limit);

      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      const res = await fetch(
        `${BASE_URL}/api/get/all?${params.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch doctors");
      }

      console.log("Doctors API:", data);

      setDoctors(data.data || []);

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

      setDoctors([]);

      toast.error(err.message || "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SEARCH CHANGE
  // ============================================

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);

    // Search always starts from page 1
    setDoctorPage(1);
  };

  // ============================================
  // CLEAR SEARCH
  // ============================================

  const clearSearch = () => {
    setSearch("");
    setDoctorPage(1);
  };

  // ============================================
  // FETCH DOCTORS WHEN PAGE OR SEARCH CHANGES
  // ============================================

  useEffect(() => {
    if (!user?.id) return;

    const timer = setTimeout(() => {
      fetchDoctors(doctorPage, DOCTORS_PER_PAGE, search);
    }, 300);

    return () => clearTimeout(timer);
  }, [user, doctorPage, search]);

  // ============================================
  // RECONNECT SOCKET ROOM
  // ============================================

  const reconnectToRoom = () => {
    const savedRoom = localStorage.getItem("roomId");
    const savedAppointment = localStorage.getItem("appointment");

    if (!savedRoom || !savedAppointment || !user?.id) {
      return;
    }

    let savedData;

    try {
      savedData = JSON.parse(savedAppointment);
    } catch (error) {
      console.error("Invalid appointment data:", error);
      return;
    }

    socket.emit("patient:join", {
      doctorId: savedData.doctorId,
      date: savedData.date,
      slot: savedData.slot,
      patientId: user.id,
    });
  };

  // ============================================
  // FETCH UPCOMING APPOINTMENTS
  // ============================================

  const fetchAppointment = async (page = 1) => {
    try {
      const refreshRes = await fetch(
        `${BASE_URL}/api/refresh-token`,
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
        `${BASE_URL}/api/take/appointments?page=${page}&limit=5`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${newToken}`,
          },
        }
      );

      const data = await res.json();

      console.log("Appointments:", data);

      setUpcomingAppointments(data.data || []);

      // ========================================
      // JOIN FIRST APPOINTMENT ROOM
      // ========================================

      const appointment = data?.data?.[0];

      if (!appointment || !user?.id) {
        return;
      }

      const formattedDate = appointment.date?.split("T")[0];

      socket.emit("patient:join", {
        doctorId: appointment.doctorId,
        date: formattedDate,
        slot: appointment.slotStart,
        patientId: user.id,
      });

      const roomId = `${appointment.doctorId}_${formattedDate}_${appointment.slotStart}`;

      localStorage.setItem("roomId", roomId);

      localStorage.setItem(
        "appointment",
        JSON.stringify({
          doctorId: appointment.doctorId,
          date: formattedDate,
          slot: appointment.slotStart,
        })
      );
    } catch (err) {
      console.error(err);

      toast.error("Failed to fetch appointments");
    }
  };

  // ============================================
  // APPOINTMENT PAGE
  // ============================================

  useEffect(() => {
    fetchAppointment(currentPage);
  }, [currentPage]);

  // ============================================
  // SOCKET APPOINTMENTS
  // ============================================

  useEffect(() => {
    if (!user) return;

    if (user?.id) {
      socket.emit("PersonalAppointment", user.id);
    }

    const handleAppointmentBooking = () => {
      fetchAppointment(currentPage);
    };

    const handleConnect = () => {
      reconnectToRoom();
    };

    socket.on(
      "appointmentBooking",
      handleAppointmentBooking
    );

    socket.on("connect", handleConnect);

    reconnectToRoom();

    return () => {
      socket.off(
        "appointmentBooking",
        handleAppointmentBooking
      );

      socket.off("connect", handleConnect);
    };
  }, [user, currentPage]);

  // ============================================
  // BOOK SLOT
  // ============================================

  const bookSlot = async () => {
    if (!selectedSlot) {
      toast.warning("Please select a slot first");
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
        throw new Error(
          "Session expired, please login again"
        );
      }

      const newToken = refreshData.newAccessToken;

      setAccessToken(newToken);

      const res = await fetch(
        `${BASE_URL}/api/add/patient`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${newToken}`,
          },

          body: JSON.stringify(selectedSlot),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Booking failed"
        );
      }

      toast.success(
        `Booked! Queue No: ${data.queueNumber}`
      );

      setSelectedSlot(null);

      // Refresh doctors after booking
      fetchDoctors(
        doctorPage,
        DOCTORS_PER_PAGE,
        search
      );

      // Refresh appointments
      fetchAppointment(currentPage);
    } catch (err) {
      toast.error(
        err.message || "Booking failed"
      );
    } finally {
      setBooking(false);
    }
  };

  // ============================================
  // GET QUEUE NUMBER
  // ============================================

  const changeQueue = async (
    doctorId,
    startSlot,
    date
  ) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/take/queue/number`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            doctorId,
            startSlot,
            date,
          }),
        }
      );

      const data = await res.json();

      setSlotQueueData((prev) => ({
        ...prev,

        [doctorId]: data.queueNumber,
      }));
    } catch (err) {
      toast.error("Failed to fetch queue");
    }
  };

  // ============================================
  // DOCTOR SOCKET
  // ============================================

  useEffect(() => {
    if (user?.id) {
      socket.emit(
        "PersonalAppointment",
        user.id
      );
    }

    const handleDoctorSlotAdded = () => {
      fetchDoctors(
        doctorPage,
        DOCTORS_PER_PAGE,
        search
      );
    };

    socket.on(
      "DoctorSlotAdded",
      handleDoctorSlotAdded
    );

    return () => {
      socket.off(
        "DoctorSlotAdded",
        handleDoctorSlotAdded
      );
    };
  }, [user, doctorPage, search]);

  // ============================================
  // LOADING
  // ============================================

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-gray-500 font-medium">
            Loading doctors...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">

          <div>
            <p className="text-sm font-bold text-teal-600 uppercase tracking-[3px]">
              Healthcare
            </p>

            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mt-2">
              Find Your Doctor
            </h1>

            <p className="text-gray-500 mt-3 max-w-xl">
              Search doctors by name or specialty and
              book your appointment instantly.
            </p>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Available Schedules
            </p>

            <p className="text-2xl font-black text-teal-600">
              {doctorPagination.totalSchedules}
            </p>
          </div>
        </div>

        {/* ======================================
            SEARCH
        ====================================== */}

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg p-4 mb-8">

          <div className="relative">

            {/* Search Icon */}

            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search doctor by name or specialty..."
              className="w-full pl-14 pr-14 py-4 rounded-2xl bg-gray-50 border-2 border-transparent outline-none text-gray-800 placeholder:text-gray-400 focus:border-teal-400 focus:bg-white transition-all"
            />

            {/* Clear Search */}

            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-500 transition"
              >
                ✕
              </button>
            )}
          </div>

          {search && (
            <div className="mt-3 px-2 text-sm text-gray-500">
              Searching for{" "}
              <span className="font-bold text-teal-600">
                "{search}"
              </span>
            </div>
          )}
        </div>

        {/* ======================================
            SEARCH LOADING
        ====================================== */}

        {loading && (
          <div className="mb-5 flex items-center gap-2 text-sm text-teal-600">
            <div className="w-4 h-4 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>

            Searching doctors...
          </div>
        )}

        {/* ======================================
            DOCTORS
        ====================================== */}

        {doctors.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {doctors.map((doc, index) => {

              const doctorId =
                doc.doctorId?._id;

              const doctorName =
                doc.doctorId?.name ||
                "Unknown Doctor";

              const doctorEmail =
                doc.doctorId?.email ||
                "No email";

              const specialty =
                doc.doctorId?.specialty ||
                "General Physician";

              return (
                <div
                  key={doc._id || index}
                  className="group relative overflow-hidden bg-white rounded-[30px] border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                >

                  {/* Top Gradient */}

                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500"></div>

                  <div className="p-6">

                    {/* DOCTOR INFO */}

                    <div className="flex items-center gap-4">

                      <div className="relative">

                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            doctorName
                          )}`}
                          className="w-16 h-16 rounded-2xl border-2 border-purple-200 shadow-md"
                          alt="doctor"
                        />

                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>

                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h2 className="text-lg font-bold text-gray-800">
                            Dr. {doctorName}
                          </h2>

                          <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-700">
                            AVAILABLE
                          </span>

                        </div>

                        <p className="text-sm text-gray-500 truncate">
                          {doctorEmail}
                        </p>

                        {/* SPECIALTY */}

                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                          <span>🩺</span>

                          {specialty}
                        </div>

                      </div>
                    </div>

                    {/* DATE */}

                    <div className="mt-5 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-3">

                      <span className="text-lg">
                        📅
                      </span>

                      <span>
                        {new Date(
                          doc.date
                        ).toDateString()}
                      </span>

                    </div>

                    {/* SLOTS */}

                    <div className="mt-5">

                      <div className="flex items-center justify-between mb-3">

                        <h3 className="text-sm font-semibold text-gray-700">
                          Available Slots
                        </h3>

                        <span className="text-xs text-gray-400">
                          {doc.slotDuration?.length || 0} slots
                        </span>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        {doc.slotDuration?.length > 0 ? (

                          doc.slotDuration.map(
                            (slot, idx) => {

                              const isSelected =
                                selectedSlot?.doctorId ===
                                  doctorId &&
                                selectedSlot?.date ===
                                  doc.date &&
                                selectedSlot?.slotStart ===
                                  slot.start;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {

                                    setSelectedSlot({
                                      doctorId:
                                        doctorId,

                                      patientId:
                                        user?.id,

                                      date:
                                        doc.date,

                                      slotStart:
                                        slot.start,
                                    });

                                    changeQueue(
                                      doctorId,
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
                                  {slot.start} -{" "}
                                  {slot.end}
                                </button>
                              );
                            }
                          )

                        ) : (

                          <div className="w-full py-4 text-center text-gray-400 bg-gray-50 rounded-xl">
                            No slots available
                          </div>

                        )}

                      </div>
                    </div>

                    {/* QUEUE */}

                    {slotQueueData[doctorId] && (
                      <div className="mt-4 bg-teal-50 border border-teal-100 rounded-2xl p-3">

                        <p className="text-xs text-teal-600 font-semibold">
                          Current Queue
                        </p>

                        <p className="text-xl font-black text-teal-700">
                          #{slotQueueData[doctorId]}
                        </p>

                      </div>
                    )}

                    {/* FOOTER */}

                    <div className="mt-6 flex items-center justify-between gap-3">

                      <button
                        onClick={() =>
                          navigate(
                            `/profile/${doctorId}`
                          )
                        }
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium shadow-md hover:scale-105 transition"
                      >
                        View Profile
                      </button>

                      <span className="text-xs text-gray-400">
                        Schedule available
                      </span>

                    </div>

                  </div>

                  {/* Decorative Blur */}

                  <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-purple-100 opacity-40 blur-3xl rounded-full pointer-events-none"></div>

                </div>
              );
            })}

          </div>
        ) : (

          /* ====================================
             NO DOCTORS FOUND
          ==================================== */

          <div className="w-full bg-white rounded-[30px] border border-dashed border-gray-300 p-12 text-center shadow-sm">

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center text-4xl">
              🔍
            </div>

            <h2 className="text-2xl font-bold text-gray-700 mt-5">
              {search
                ? "No Doctors Found"
                : "No Doctor Schedules"}
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              {search
                ? `We couldn't find any doctor matching "${search}". Try another name or specialty.`
                : "There are currently no available doctor schedules."}
            </p>

            {search && (
              <button
                onClick={clearSearch}
                className="mt-5 px-5 py-2.5 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition"
              >
                Clear Search
              </button>
            )}

          </div>
        )}

        {/* ======================================
            DOCTOR PAGINATION
        ====================================== */}

        {doctorPagination &&
          doctorPagination.totalPages > 1 && (

            <div className="mt-10 flex flex-col items-center gap-4">

              {/* PAGE INFO */}

              <p className="text-sm text-gray-400">

                Showing page{" "}

                <span className="text-purple-600 font-bold">
                  {doctorPagination.currentPage}
                </span>

                {" "}of{" "}

                <span className="text-purple-600 font-bold">
                  {doctorPagination.totalPages}
                </span>

                {" "}·{" "}

                <span className="text-gray-500">
                  {doctorPagination.totalSchedules}
                  {" "}total schedules
                </span>

              </p>

              {/* BUTTONS */}

              <div className="flex items-center gap-2">

                {/* PREVIOUS */}

                <button
                  onClick={() => {
                    setDoctorPage(
                      (p) => Math.max(p - 1, 1)
                    );

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  disabled={
                    !doctorPagination.hasPreviousPage
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white border-2 border-gray-200 text-gray-600 shadow-sm hover:border-purple-400 hover:text-purple-600 hover:shadow-md active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                      length:
                        doctorPagination.totalPages,
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
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        page === doctorPage
                          ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg scale-110"
                          : "bg-white border-2 border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-600"
                      }`}
                    >
                      {page}
                    </button>

                  ))}

                </div>

                {/* NEXT */}

                <button
                  onClick={() => {
                    setDoctorPage(
                      (p) =>
                        Math.min(
                          p + 1,
                          doctorPagination.totalPages
                        )
                    );

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  disabled={
                    !doctorPagination.hasNextPage
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white border-2 border-gray-200 text-gray-600 shadow-sm hover:border-purple-400 hover:text-purple-600 hover:shadow-md active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                      d="M9 5l7 7-7-7"
                    />
                  </svg>

                </button>

              </div>
            </div>
          )}

        {/* ======================================
            BOOK BUTTON
        ====================================== */}

        <div className="mt-10">

          <button
            onClick={bookSlot}
            disabled={
              booking || !selectedSlot
            }
            className="relative w-full overflow-hidden group bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-teal-300/50 hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >

            <span className="relative z-10 flex items-center justify-center gap-2">

              {booking ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>

                  Booking...
                </>
              ) : (
                <>
                  <span className="text-xl">
                    🗓️
                  </span>

                  {selectedSlot
                    ? "Confirm Appointment"
                    : "Select a Slot First"}
                </>
              )}

            </span>

            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          </button>

        </div>

        {/* ======================================
            UPCOMING APPOINTMENTS
        ====================================== */}

        <h2 className="text-3xl font-black mt-16 mb-6 text-teal-700">
          Upcoming Appointments
        </h2>

        <div className="grid gap-6">

          {upcomingAppointments &&
          upcomingAppointments.length > 0 ? (

            upcomingAppointments.map(
              (appointment, index) => (

                <div
                  key={
                    appointment._id ||
                    index
                  }
                  className="group relative overflow-hidden bg-white rounded-[30px] border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                >

                  {/* TOP */}

                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"></div>

                  <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                    {/* LEFT */}

                    <div className="flex items-center gap-5">

                      <div className="relative">

                        <img
                          src={`https://i.pravatar.cc/150?img=${
                            index + 10
                          }`}
                          alt="doctor"
                          className="w-20 h-20 rounded-3xl object-cover border-4 border-teal-100 shadow-lg"
                        />

                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white animate-pulse"></div>

                      </div>

                      <div>

                        <div className="flex items-center gap-3 flex-wrap">

                          <h1 className="text-2xl font-black text-gray-800">
                            {appointment.doctorName ||
                              "Dr. Unknown"}
                          </h1>

                          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                            Upcoming
                          </span>

                        </div>

                        <p className="text-sm text-teal-600 font-semibold mt-1">
                          Cardiology Specialist
                        </p>

                        <div className="flex flex-wrap gap-3 mt-5">

                          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-2xl text-sm font-medium text-gray-700">
                            📅

                            {new Date(
                              appointment.date
                            ).toLocaleDateString()}
                          </div>

                          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-2xl text-sm font-medium text-gray-700">
                            ⏰

                            {appointment.slotStart}
                          </div>

                        </div>

                      </div>
                    </div>

                    {/* RIGHT */}

                    <div className="flex flex-col items-center lg:items-end gap-4">

                      <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 text-white rounded-3xl px-8 py-5 shadow-xl text-center min-w-[150px]">

                        <p className="text-xs uppercase tracking-[3px] opacity-80">
                          Queue No
                        </p>

                        <h2 className="text-4xl font-black mt-1">
                          #{appointment.queueNumber}
                        </h2>

                      </div>

                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                          appointment.status ===
                          "waiting"
                            ? "bg-yellow-100 text-yellow-700"
                            : appointment.status ===
                              "current"
                            ? "bg-green-100 text-green-700 animate-pulse"
                            : appointment.status ===
                              "done"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {appointment.status ||
                          "waiting"}
                      </span>

                      <button
                        onClick={() =>
                          navigate("/queue")
                        }
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border-2 border-teal-200 text-teal-600 font-semibold text-sm hover:bg-teal-50 hover:border-teal-400 transition"
                      >
                        👁️ View Queue
                      </button>

                    </div>
                  </div>

                </div>
              )
            )

          ) : (

            <div className="w-full bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center shadow-sm">

              <div className="text-6xl mb-4">
                📅
              </div>

              <h2 className="text-2xl font-bold text-gray-700">
                No Upcoming Appointments
              </h2>

              <p className="text-gray-500 mt-2">
                You don’t have any scheduled
                appointments right now.
              </p>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default UserAppointmentShow;