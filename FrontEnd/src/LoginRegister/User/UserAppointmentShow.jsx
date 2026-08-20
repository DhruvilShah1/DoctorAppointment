import BASE_URL from "../config/api.js";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";
import { useNavigate } from "react-router-dom";
import  socket  from "../../socket/FrontendSocketConnection";
import { toast } from "react-toastify";

const UserAppointmentShow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // =========================================================
  // DOCTORS
  // =========================================================

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


  const [search, setSearch] = useState("");

  const [selectedDate, setSelectedDate] = useState("");

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(true);

  // =========================================================
  // BOOKING
  // =========================================================

  const [booking, setBooking] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [accessToken, setAccessToken] = useState(null);

  // =========================================================
  // QUEUE
  // =========================================================

  const [slotQueueData, setSlotQueueData] = useState({});

  // =========================================================
  // APPOINTMENTS
  // =========================================================

  const [upcomingAppointments, setUpcomingAppointments] =
    useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const fetchDoctors = async (
    page = doctorPage,
    limit = DOCTORS_PER_PAGE,
    searchValue = search,
    dateValue = selectedDate
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", limit);

      // Search doctor name / specialty
      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      // Search schedule date
      if (dateValue) {
        params.append("date", dateValue);
      }

      const url = `${BASE_URL}/api/get/all?${params.toString()}`;

      console.log("Fetching doctors:", url);

      const res = await fetch(url);

      const data = await res.json();

      console.log("Doctors response:", data);

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to fetch doctors"
        );
      }

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

      toast.error(
        err.message || "Failed to fetch doctors"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEARCH CHANGE
  // =========================================================

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);

    // Always start from page 1
    setDoctorPage(1);
  };

  // =========================================================
  // DATE CHANGE
  // =========================================================

  const handleDateChange = (e) => {
    const value = e.target.value;

    setSelectedDate(value);

    // Always start from page 1
    setDoctorPage(1);
  };

  // =========================================================
  // CLEAR ALL FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setSelectedDate("");
    setDoctorPage(1);
  };

  // =========================================================
  // FETCH DOCTORS WHEN SEARCH / DATE / PAGE CHANGES
  // =========================================================

  useEffect(() => {
    if (!user?.id) return;

    const timer = setTimeout(() => {
      fetchDoctors(
        doctorPage,
        DOCTORS_PER_PAGE,
        search,
        selectedDate
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [
    user,
    doctorPage,
    search,
    selectedDate,
  ]);

  // =========================================================
  // RECONNECT TO APPOINTMENT ROOM
  // =========================================================

  const reconnectToRoom = () => {
    if (!user?.id) return;
    const savedAppointments = localStorage.getItem("appointments");
    if (!savedAppointments) return;
    try {
      const list = JSON.parse(savedAppointments);
      list.forEach((savedData) => {
        socket.emit("patient:join", {
          doctorId: savedData.doctorId,
          date: savedData.date,
          slot: savedData.slot,
          patientId: user.id,
        });
      });
    } catch (e) {
      console.error("Invalid appointments data:", e);
    }
  };

  // =========================================================
  // FETCH UPCOMING APPOINTMENTS
  // =========================================================

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

      const refreshData =
        await refreshRes.json();

      const newToken =
        refreshData.newAccessToken;

      if (!newToken) {
        toast.error(
          "No access token returned"
        );

        return;
      }

      const res = await fetch(
        `${BASE_URL}/api/take/appointments?page=${page}&limit=5`,
        {
          method: "GET",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${newToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch appointments"
        );
      }

      setUpcomingAppointments(
        data.data || []
      );

      // =====================================================
      // JOIN ALL APPOINTMENT ROOMS
      // =====================================================

      if (!data?.data?.length || !user?.id) return;

      data.data.forEach((appointment) => {
        const formattedDate = appointment.date?.split("T")[0];
        socket.emit("patient:join", {
          doctorId: appointment.doctorId,
          date: formattedDate,
          slot: appointment.slotStart,
          patientId: user.id,
        });
      });

      // Save all appointments for reconnect
      const allRooms = data.data.map((a) => ({
        doctorId: a.doctorId,
        date: a.date?.split("T")[0],
        slot: a.slotStart,
      }));
      localStorage.setItem("appointments", JSON.stringify(allRooms));

      // Keep legacy keys for App.jsx reconnect
      const latest = data.data[data.data.length - 1];
      const latestDate = latest.date?.split("T")[0];
      localStorage.setItem("roomId", `${latest.doctorId}_${latestDate}_${latest.slotStart}`);
      localStorage.setItem("appointment", JSON.stringify({
        doctorId: latest.doctorId,
        date: latestDate,
        slot: latest.slotStart,
      }));
    } catch (err) {
      console.error(err);

      toast.error(
        err.message ||
          "Failed to fetch appointments"
      );
    }
  };

  // =========================================================
  // APPOINTMENT PAGE
  // =========================================================

  useEffect(() => {
    if (!user?.id) return;

    fetchAppointment(currentPage);
  }, [user, currentPage]);

  // =========================================================
  // SOCKET APPOINTMENTS
  // =========================================================

  useEffect(() => {
    if (!user?.id) return;

    socket.emit(
      "PersonalAppointment",
      user.id
    );

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

    socket.on(
      "connect",
      handleConnect
    );

    reconnectToRoom();

    return () => {
      socket.off(
        "appointmentBooking",
        handleAppointmentBooking
      );

      socket.off(
        "connect",
        handleConnect
      );
    };
  }, [
    user,
    currentPage,
  ]);

  // =========================================================
  // BOOK SLOT
  // =========================================================

  const bookSlot = async () => {
    if (!selectedSlot) {
      toast.warning(
        "Please select a slot first"
      );

      return;
    }

    setBooking(true);

    try {
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

      if (!refreshRes.ok) {
        throw new Error(
          "Session expired, please login again"
        );
      }

      const newToken =
        refreshData.newAccessToken;

      setAccessToken(newToken);

      const res = await fetch(
        `${BASE_URL}/api/add/patient`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${newToken}`,
          },

          body:
            JSON.stringify(
              selectedSlot
            ),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Booking failed"
        );
      }

      toast.success(
        `Booked! Queue No: ${data.queueNumber}`
      );

      setSelectedSlot(null);

      // Refresh doctors
      fetchDoctors(
        doctorPage,
        DOCTORS_PER_PAGE,
        search,
        selectedDate
      );

      // Refresh appointments
      fetchAppointment(
        currentPage
      );
    } catch (err) {
      toast.error(
        err.message ||
          "Booking failed"
      );
    } finally {
      setBooking(false);
    }
  };

  // =========================================================
  // GET QUEUE NUMBER
  // =========================================================

  const changeQueue = async (
    doctorId,
    startSlot,
    date
  ) => {
    try {
      const res =
        await fetch(
          `${BASE_URL}/api/take/queue/number`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              doctorId,
              startSlot,
              date,
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch queue"
        );
      }

      setSlotQueueData(
        (prev) => ({
          ...prev,

          [`${doctorId}_${startSlot}`]:
            data.queueNumber,
        })
      );
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to fetch queue"
      );
    }
  };

  // =========================================================
  // DOCTOR SLOT SOCKET
  // =========================================================

  useEffect(() => {
    if (!user?.id) return;

    const handleDoctorSlotAdded =
      () => {
        fetchDoctors(
          doctorPage,
          DOCTORS_PER_PAGE,
          search,
          selectedDate
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
  }, [
    user,
    doctorPage,
    search,
    selectedDate,
  ]);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // FORMAT SELECTED DATE
  // =========================================================

  const formatSelectedDate = (
    date
  ) => {
    if (!date) return "";

    const parsed =
      new Date(`${date}T00:00:00`);

    return parsed.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading &&
    doctors.length === 0 &&
    !search &&
    !selectedDate
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>

          <p className="mt-5 text-gray-600 font-semibold">
            Loading doctors...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900">

        {/* Background blur */}

        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>

        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-teal-300 text-sm font-semibold backdrop-blur-md">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>

              Find Available Doctors
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mt-5 leading-tight">
              Find the right doctor
              <span className="block text-teal-400">
                for your health.
              </span>
            </h1>

            <p className="mt-5 text-slate-300 text-base md:text-lg max-w-2xl leading-7">
              Search doctors by name,
              specialty, or appointment
              date and book your queue
              instantly.
            </p>

          </div>

          {/* =================================================
              SEARCH PANEL
          ================================================= */}

          <div className="mt-10 bg-white rounded-[30px] shadow-2xl p-3">

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_auto] gap-3">

              {/* SEARCH */}

              <div className="relative">

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
                  onChange={
                    handleSearchChange
                  }
                  placeholder="Doctor name or specialty..."
                  className="w-full pl-14 pr-12 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none text-gray-800 placeholder:text-gray-400 focus:border-teal-400 focus:bg-white transition"
                />

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-200 hover:bg-red-100 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                )}

              </div>

              {/* DATE */}

              <div className="relative">

                <svg
                  className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                  />

                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={
                    handleDateChange
                  }
                  className="w-full pl-14 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none text-gray-700 focus:border-teal-400 focus:bg-white transition"
                />

              </div>

              {/* CLEAR */}

              <button
                onClick={
                  clearFilters
                }
                disabled={
                  !search &&
                  !selectedDate
                }
                className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-teal-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear Filters
              </button>

            </div>

            {/* ACTIVE FILTERS */}

            {(search ||
              selectedDate) && (
              <div className="flex flex-wrap items-center gap-2 px-2 pt-3">

                <span className="text-xs font-semibold text-gray-400">
                  Active filters:
                </span>

                {search && (
                  <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                    🔎 {search}
                  </span>
                )}

                {selectedDate && (
                  <span className="px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                    📅{" "}
                    {formatSelectedDate(
                      selectedDate
                    )}
                  </span>
                )}

              </div>
            )}

          </div>

        </div>
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* RESULT HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

          <div>

            <h2 className="text-2xl font-black text-gray-900">
              {selectedDate
                ? "Doctors Available on Selected Date"
                : "Available Doctors"}
            </h2>

            {selectedDate && (
              <p className="text-sm text-teal-600 font-semibold mt-1">
                📅{" "}
                {formatSelectedDate(
                  selectedDate
                )}
              </p>
            )}

          </div>

          <div className="flex items-center gap-3">

            {loading && (
              <div className="w-5 h-5 border-2 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            )}

            <div className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl">

              <span className="text-xs text-gray-400">
                Schedules
              </span>

              <span className="ml-2 font-black text-teal-600">
                {
                  doctorPagination.totalSchedules
                }
              </span>

            </div>

          </div>

        </div>

        {/* ===================================================
            DOCTOR CARDS
        =================================================== */}

        {doctors.length > 0 ? (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {doctors.map(
              (doc, index) => {

                const doctorId =
                  doc.doctorId?._id;

                const doctorName =
                  doc.doctorId?.name ||
                  "Unknown Doctor";

                const doctorEmail =
                  doc.doctorId?.email ||
                  "No email available";

                const specialties =
                  doc.doctorId
                    ?.specialties || [];

                return (
                  <div
                    key={
                      doc._id || index
                    }
                    className="group relative bg-white rounded-[30px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
                  >

                    {/* TOP */}

                    <div className="h-1.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-indigo-500"></div>

                    <div className="p-6">

                      {/* DOCTOR HEADER */}

                      <div className="flex items-start gap-4">

                        <div className="relative shrink-0">

                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              doctorName
                            )}`}
                            alt={
                              doctorName
                            }
                            className="w-20 h-20 rounded-[24px] border-4 border-teal-50 shadow-md"
                          />

                          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white"></span>

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2 flex-wrap">

                            <h3 className="text-xl font-black text-gray-900">
                              Dr.{" "}
                              {
                                doctorName
                              }
                            </h3>

                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                              Available
                            </span>

                          </div>

                          <p className="text-sm text-gray-400 mt-1 truncate">
                            {
                              doctorEmail
                            }
                          </p>

                          {/* SPECIALTIES */}

                          <div className="flex flex-wrap gap-1.5 mt-3">

                            {specialties.length >
                            0 ? (
                              specialties.map(
                                (
                                  specialty,
                                  specialtyIndex
                                ) => (
                                  <span
                                    key={
                                      specialtyIndex
                                    }
                                    className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold"
                                  >
                                    🩺{" "}
                                    {
                                      specialty
                                    }
                                  </span>
                                )
                              )
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                                General
                                Physician
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* DATE */}

                      <div className="mt-6 flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            📅
                          </div>

                          <div>

                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                              Appointment
                              Date
                            </p>

                            <p className="text-sm font-bold text-gray-800">
                              {formatDate(
                                doc.date
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="text-right">

                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                            Slots
                          </p>

                          <p className="text-lg font-black text-teal-600">
                            {
                              doc.slotDuration
                                ?.length ||
                              0
                            }
                          </p>

                        </div>

                      </div>

                      {/* SLOTS */}

                      <div className="mt-6">

                        <div className="flex items-center justify-between mb-3">

                          <h4 className="text-sm font-black text-gray-800">
                            Select Time
                          </h4>

                          {selectedSlot?.doctorId ===
                            doctorId && (
                            <span className="text-xs text-teal-600 font-bold">
                              Slot selected
                            </span>
                          )}

                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                          {doc.slotDuration
                            ?.length >
                          0 ? (

                            doc.slotDuration.map(
                              (
                                slot,
                                slotIndex
                              ) => {

                                const isSelected =
                                  selectedSlot?.doctorId ===
                                    doctorId &&
                                  selectedSlot?.date ===
                                    doc.date &&
                                  selectedSlot?.slotStart ===
                                    slot.start;

                                const queueKey =
                                  `${doctorId}_${slot.start}`;

                                return (
                                  <button
                                    key={
                                      slotIndex
                                    }
                                    onClick={() => {

                                      setSelectedSlot(
                                        {
                                          doctorId:
                                            doctorId,

                                          patientId:
                                            user?.id,

                                          date:
                                            doc.date,

                                          slotStart:
                                            slot.start,
                                        }
                                      );

                                      changeQueue(
                                        doctorId,
                                        slot.start,
                                        doc.date
                                      );
                                    }}
                                    className={`relative px-3 py-3 rounded-2xl text-xs font-bold border transition-all duration-200 ${
                                      isSelected
                                        ? "bg-teal-600 border-teal-600 text-white shadow-lg scale-[1.03]"
                                        : "bg-white border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50"
                                    }`}
                                  >

                                    <div>
                                      {
                                        slot.start
                                      }
                                    </div>

                                    <div
                                      className={`text-[10px] mt-0.5 ${
                                        isSelected
                                          ? "text-teal-100"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      to{" "}
                                      {
                                        slot.end
                                      }
                                    </div>

                                    {slotQueueData[
                                      queueKey
                                    ] && (
                                      <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-white text-[9px] font-black shadow">
                                        #
                                        {
                                          slotQueueData[
                                            queueKey
                                          ]
                                        }
                                      </span>
                                    )}

                                  </button>
                                );
                              }
                            )

                          ) : (

                            <div className="col-span-full py-5 rounded-2xl bg-gray-50 text-center text-sm text-gray-400">
                              No slots available
                            </div>

                          )}

                        </div>

                      </div>

                      {/* FOOTER */}

                      <div className="mt-6 flex items-center justify-between gap-3">

                        <button
                          onClick={() =>
                            navigate(
                              `/profile/${doctorId}`
                            )
                          }
                          className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition"
                        >
                          View Profile
                        </button>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          Schedule
                          available
                        </div>

                      </div>

                    </div>

                    {/* DECORATION */}

                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>

                  </div>
                );
              }
            )}

          </div>

        ) : (

          /* =================================================
             NO RESULT
          ================================================= */

          <div className="bg-white rounded-[32px] border border-dashed border-gray-300 p-14 text-center">

            <div className="w-24 h-24 mx-auto rounded-[30px] bg-slate-100 flex items-center justify-center text-5xl">
              {selectedDate
                ? "📅"
                : "🔍"}
            </div>

            <h2 className="text-2xl font-black text-gray-800 mt-6">

              {search ||
              selectedDate
                ? "No Doctors Found"
                : "No Doctor Schedules"}

            </h2>

            <p className="text-gray-500 mt-3 max-w-lg mx-auto leading-6">

              {search &&
              selectedDate
                ? `No doctors found matching "${search}" with schedules on ${formatSelectedDate(
                    selectedDate
                  )}.`
                : search
                ? `We couldn't find any doctor matching "${search}". Try another doctor name or specialty.`
                : selectedDate
                ? `There are no doctor schedules available on ${formatSelectedDate(
                    selectedDate
                  )}.`
                : "There are currently no available doctor schedules."}

            </p>

            {(search ||
              selectedDate) && (
              <button
                onClick={
                  clearFilters
                }
                className="mt-6 px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition"
              >
                Clear Filters
              </button>
            )}

          </div>
        )}

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {doctorPagination &&
          doctorPagination.totalPages >
            1 && (

            <div className="mt-10 flex flex-col items-center gap-4">

              <p className="text-sm text-gray-400">

                Page{" "}

                <span className="font-black text-teal-600">
                  {
                    doctorPagination.currentPage
                  }
                </span>

                {" "}of{" "}

                <span className="font-black text-teal-600">
                  {
                    doctorPagination.totalPages
                  }
                </span>

                {" · "}

                {
                  doctorPagination.totalSchedules
                }{" "}
                schedules

              </p>

              <div className="flex items-center gap-2">

                {/* PREVIOUS */}

                <button
                  onClick={() => {
                    setDoctorPage(
                      (page) =>
                        Math.max(
                          page - 1,
                          1
                        )
                    );

                    window.scrollTo({
                      top: 0,
                      behavior:
                        "smooth",
                    });
                  }}
                  disabled={
                    !doctorPagination.hasPreviousPage
                  }
                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:border-teal-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>

                {/* PAGE NUMBERS */}

                <div className="flex gap-1">

                  {Array.from(
                    {
                      length:
                        doctorPagination.totalPages,
                    },
                    (_, index) =>
                      index + 1
                  ).map(
                    (page) => (
                      <button
                        key={
                          page
                        }
                        onClick={() => {
                          setDoctorPage(
                            page
                          );

                          window.scrollTo(
                            {
                              top: 0,
                              behavior:
                                "smooth",
                            }
                          );
                        }}
                        className={`w-10 h-10 rounded-xl text-sm font-black transition ${
                          page ===
                          doctorPage
                            ? "bg-teal-600 text-white shadow-lg"
                            : "bg-white border border-gray-200 text-gray-500 hover:border-teal-400 hover:text-teal-600"
                        }`}
                      >
                        {
                          page
                        }
                      </button>
                    )
                  )}

                </div>

                {/* NEXT */}

                <button
                  onClick={() => {
                    setDoctorPage(
                      (page) =>
                        Math.min(
                          page + 1,
                          doctorPagination.totalPages
                        )
                    );

                    window.scrollTo({
                      top: 0,
                      behavior:
                        "smooth",
                    });
                  }}
                  disabled={
                    !doctorPagination.hasNextPage
                  }
                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:border-teal-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>

              </div>

            </div>
          )}

        {/* ===================================================
            BOOK APPOINTMENT
        =================================================== */}

        <div className="mt-10 sticky bottom-5 z-20">

          <div className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-gray-200 shadow-2xl p-3">

            <button
              onClick={
                bookSlot
              }
              disabled={
                booking ||
                !selectedSlot
              }
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >

              {booking ? (
                <span className="flex items-center justify-center gap-3">

                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>

                  Booking
                  Appointment...

                </span>
              ) : selectedSlot ? (
                <span>
                  🗓️ Confirm Appointment
                </span>
              ) : (
                <span>
                  Select a Slot to Continue
                </span>
              )}

            </button>

            {selectedSlot && (
              <div className="text-center text-xs text-gray-500 mt-2">

                Selected:
                <span className="font-bold text-teal-600 ml-1">
                  {
                    selectedSlot.slotStart
                  }
                </span>

              </div>
            )}

          </div>

        </div>

        {/* ===================================================
            UPCOMING APPOINTMENTS
        =================================================== */}

        <div className="mt-20">

          <div className="flex items-end justify-between mb-6">

            <div>

              <p className="text-xs uppercase tracking-[3px] text-teal-600 font-black">
                Your Schedule
              </p>

              <h2 className="text-3xl font-black text-gray-900 mt-2">
                Upcoming Appointments
              </h2>

            </div>

            <span className="hidden sm:block px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-sm font-bold">
              {
                upcomingAppointments.length
              }{" "}
              Appointment
              {upcomingAppointments.length !==
              1
                ? "s"
                : ""}
            </span>

          </div>

          <div className="grid gap-5">

            {upcomingAppointments.length >
            0 ? (

              upcomingAppointments.map(
                (
                  appointment,
                  index
                ) => (

                  <div
                    key={
                      appointment._id ||
                      index
                    }
                    className="relative overflow-hidden bg-white rounded-[30px] border border-gray-100 shadow-sm hover:shadow-xl transition"
                  >

                    <div className="h-1.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-500"></div>

                    <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                      {/* INFO */}

                      <div className="flex items-center gap-5">

                        <div className="relative">

                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              appointment.doctorName ||
                                "Doctor"
                            )}`}
                            alt="doctor"
                            className="w-20 h-20 rounded-3xl border-4 border-teal-50 shadow"
                          />

                          <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>

                        </div>

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h3 className="text-xl font-black text-gray-900">
                              {
                                appointment.doctorName ||
                                "Dr. Unknown"
                              }
                            </h3>

                            <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-black">
                              Upcoming
                            </span>

                          </div>

                          <p className="text-sm text-teal-600 font-bold mt-1">
                            Doctor Appointment
                          </p>

                          <div className="flex flex-wrap gap-2 mt-4">

                            <span className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-gray-700">
                              📅{" "}
                              {formatDate(
                                appointment.date
                              )}
                            </span>

                            <span className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-gray-700">
                              ⏰{" "}
                              {
                                appointment.slotStart
                              }
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* RIGHT */}

                      <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-3">

                        <div className="px-8 py-4 rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 text-white text-center shadow-lg">

                          <p className="text-[10px] uppercase tracking-[3px] opacity-80">
                            Queue No
                          </p>

                          <p className="text-4xl font-black">
                            #
                            {
                              appointment.queueNumber
                            }
                          </p>

                        </div>

                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${
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
                          {
                            appointment.status ||
                            "waiting"
                          }
                        </span>

                        <button
                          onClick={() =>
                            navigate(
                              "/queue"
                            )
                          }
                          className="px-5 py-2.5 rounded-xl bg-white border-2 border-teal-200 text-teal-600 font-bold text-sm hover:bg-teal-50 hover:border-teal-400 transition"
                        >
                          👁️ View Queue
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )

            ) : (

              <div className="bg-white rounded-[30px] border border-dashed border-gray-300 p-14 text-center">

                <div className="text-6xl">
                  📅
                </div>

                <h3 className="text-2xl font-black text-gray-700 mt-5">
                  No Upcoming
                  Appointments
                </h3>

                <p className="text-gray-500 mt-2">
                  You don't have any
                  scheduled
                  appointments
                  right now.
                </p>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
};

export default UserAppointmentShow;
