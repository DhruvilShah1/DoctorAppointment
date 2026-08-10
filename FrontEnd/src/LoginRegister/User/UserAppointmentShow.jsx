import BASE_URL from "../config/api.js";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket/FrontendSocketConnection";
import { toast } from "react-toastify";

const UserAppointmentShow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // =========================================================
  // DOCTORS
  // =========================================================
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // SEARCH
  // =========================================================
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");

  const specialties = [
    "All Specialties",
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Orthopedic",
    "Pediatrics",
    "Dentist",
    "General Physician",
    "Psychiatry",
  ];

  // =========================================================
  // DOCTOR PAGINATION
  // =========================================================
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

  // =========================================================
  // APPOINTMENT
  // =========================================================
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);

  const [slotQueueData, setslotQueueData] = useState({});

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // FETCH DOCTORS
  // =========================================================
  const fetchDoctors = async (
    page = doctorPage,
    limit = DOCTORS_PER_PAGE,
    searchValue = search,
    specialtyValue = specialty
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", limit);

      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      if (
        specialtyValue &&
        specialtyValue !== "All Specialties"
      ) {
        params.append("specialty", specialtyValue);
      }

      const res = await fetch(
        `${BASE_URL}/api/get/all?${params.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to fetch doctors"
        );
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
    } catch (error) {
      console.error("Fetch doctors error:", error);

      toast.error(
        error.message || "Failed to fetch doctors"
      );

      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEARCH HANDLER
  // =========================================================
  const handleSearch = () => {
    setDoctorPage(1);

    fetchDoctors(
      1,
      DOCTORS_PER_PAGE,
      search,
      specialty
    );
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================
  const clearSearch = () => {
    setSearch("");
    setSpecialty("");
    setDoctorPage(1);

    fetchDoctors(
      1,
      DOCTORS_PER_PAGE,
      "",
      ""
    );
  };

  // =========================================================
  // WHEN SPECIALTY CHANGES
  // =========================================================
  useEffect(() => {
    if (!user?.id) return;

    setDoctorPage(1);

    fetchDoctors(
      1,
      DOCTORS_PER_PAGE,
      search,
      specialty
    );
  }, [specialty]);

  // =========================================================
  // PAGINATION CHANGE
  // =========================================================
  useEffect(() => {
    if (!user?.id) return;

    fetchDoctors(
      doctorPage,
      DOCTORS_PER_PAGE,
      search,
      specialty
    );
  }, [doctorPage]);

  // =========================================================
  // RECONNECT SOCKET ROOM
  // =========================================================
  const reconnectToRoom = () => {
    const savedRoom = localStorage.getItem("roomId");
    const savedAppointment =
      localStorage.getItem("appointment");

    if (!savedRoom || !savedAppointment) return;

    try {
      const savedData = JSON.parse(savedAppointment);

      socket.emit("patient:join", {
        doctorId: savedData.doctorId,
        date: savedData.date,
        slot: savedData.slot,
        patientId: user?.id,
      });
    } catch (error) {
      console.error(
        "Failed to reconnect room:",
        error
      );
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

      const refreshData = await refreshRes.json();

      const newToken =
        refreshData.newAccessToken;

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

      setUpcomingAppointments(
        data.data || []
      );

      // =====================================================
      // JOIN FIRST APPOINTMENT ROOM
      // =====================================================

      const appointment = data?.data?.[0];

      if (!appointment) return;

      const formattedDate =
        appointment.date.split("T")[0];

      socket.emit("patient:join", {
        doctorId: appointment.doctorId,
        date: formattedDate,
        slot: appointment.slotStart,
        patientId: user?.id,
      });

      const roomId =
        `${appointment.doctorId}_${formattedDate}_${appointment.slotStart}`;

      localStorage.setItem(
        "roomId",
        roomId
      );

      localStorage.setItem(
        "appointment",
        JSON.stringify({
          doctorId: appointment.doctorId,
          date: formattedDate,
          slot: appointment.slotStart,
        })
      );
    } catch (error) {
      console.error(
        "Fetch appointment error:",
        error
      );

      toast.error(
        error.message ||
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
  // SOCKET APPOINTMENT LISTENER
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
  }, [user, currentPage]);

  // =========================================================
  // DOCTOR SOCKET
  // =========================================================
  useEffect(() => {
    if (!user?.id) return;

    socket.emit(
      "PersonalAppointment",
      user.id
    );

    const handleDoctorSlotAdded = () => {
      fetchDoctors(
        doctorPage,
        DOCTORS_PER_PAGE,
        search,
        specialty
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
    specialty,
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
      const refreshRes = await fetch(
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
          data.message ||
            "Booking failed"
        );
      }

      toast.success(
        `Booked! Queue No: ${data.queueNumber}`
      );

      setSelectedSlot(null);

      await fetchDoctors(
        doctorPage,
        DOCTORS_PER_PAGE,
        search,
        specialty
      );

      await fetchAppointment(
        currentPage
      );
    } catch (error) {
      toast.error(
        error.message ||
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

      setslotQueueData((prev) => ({
        ...prev,
        [`${doctorId}_${startSlot}`]:
          data.queueNumber,
      }));
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to fetch queue"
      );
    }
  };

  // =========================================================
  // SELECT SLOT
  // =========================================================
  const handleSelectSlot = (
    doc,
    slot
  ) => {
    setSelectedSlot({
      doctorId: doc.doctorId?._id,
      patientId: user?.id,
      date: doc.date,
      slotStart: slot.start,
    });

    changeQueue(
      doc.doctorId?._id,
      slot.start,
      doc.date
    );
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-gray-500 font-medium">
            Finding available doctors...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                Healthcare Booking
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
                Find Your Doctor
              </h1>

              <p className="text-gray-500 mt-2 max-w-2xl">
                Search doctors by name or specialty
                and choose an available appointment
                slot.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-400">
                  Available Schedules
                </p>

                <p className="text-xl font-black text-teal-600">
                  {doctorPagination.totalSchedules || 0}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================
            SEARCH PANEL
        ===================================================== */}

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg shadow-slate-200/50 p-4 sm:p-5 mb-8">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px_auto] gap-3">

            {/* SEARCH */}
            <div className="relative">

              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />
                  <path
                    d="m20 20-4-4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search doctor by name..."
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition text-gray-700"
              />
            </div>

            {/* SPECIALTY */}
            <div className="relative">

              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500">
                🩺
              </div>

              <select
                value={
                  specialty || "All Specialties"
                }
                onChange={(e) =>
                  setSpecialty(e.target.value)
                }
                className="w-full h-14 pl-11 pr-4 bg-slate-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition text-gray-700 appearance-none"
              >
                {specialties.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-2">

              <button
                onClick={handleSearch}
                className="flex-1 lg:flex-none h-14 px-7 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold shadow-lg shadow-teal-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition"
              >
                Search
              </button>

              {(search || specialty) && (
                <button
                  onClick={clearSearch}
                  className="h-14 px-5 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold hover:border-red-300 hover:text-red-500 transition"
                >
                  Clear
                </button>
              )}

            </div>

          </div>

          {/* ACTIVE FILTERS */}

          {(search || specialty) && (
            <div className="flex flex-wrap gap-2 mt-4">

              {search && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold">
                  🔎 {search}

                  <button
                    onClick={() => {
                      setSearch("");
                      setDoctorPage(1);

                      fetchDoctors(
                        1,
                        DOCTORS_PER_PAGE,
                        "",
                        specialty
                      );
                    }}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              )}

              {specialty &&
                specialty !== "All Specialties" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold">
                    🩺 {specialty}

                    <button
                      onClick={() => {
                        setSpecialty("");
                        setDoctorPage(1);

                        fetchDoctors(
                          1,
                          DOCTORS_PER_PAGE,
                          search,
                          ""
                        );
                      }}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                )}

            </div>
          )}

        </div>

        {/* =====================================================
            DOCTOR SECTION
        ===================================================== */}

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Available Doctors
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Choose a doctor and available time
            </p>
          </div>

          <div className="hidden sm:block text-sm text-gray-400">
            Page{" "}
            <span className="font-bold text-teal-600">
              {doctorPagination.currentPage}
            </span>{" "}
            /{" "}
            <span className="font-bold text-teal-600">
              {doctorPagination.totalPages || 1}
            </span>
          </div>

        </div>

        {/* =====================================================
            DOCTORS
        ===================================================== */}

        {doctors.length > 0 ? (

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {doctors.map(
              (doc, index) => {

                const doctorId =
                  doc.doctorId?._id;

                const doctorName =
                  doc.doctorId?.name ||
                  "Unknown Doctor";

                const doctorEmail =
                  doc.doctorId?.email ||
                  "";

                // Backend can return either
                // specialty or specialties
                const doctorSpecialty =
                  doc.doctorId?.specialty ||
                  doc.doctorId?.specialties ||
                  "General Physician";

                return (

                  <div
                    key={doc._id || index}
                    className="group bg-white rounded-[30px] border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >

                    {/* TOP */}
                    <div className="h-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-indigo-500"></div>

                    <div className="p-6">

                      {/* DOCTOR INFO */}

                      <div className="flex items-start gap-4">

                        <div className="relative shrink-0">

                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              doctorName
                            )}`}
                            className="w-16 h-16 rounded-2xl border-2 border-teal-100 shadow-sm bg-teal-50"
                            alt={doctorName}
                          />

                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-lg font-black text-slate-800">
                              Dr. {doctorName}
                            </h3>

                            <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-green-50 text-green-600 border border-green-100">
                              Available
                            </span>

                          </div>

                          <p className="text-sm text-gray-400 mt-1 truncate">
                            {doctorEmail}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-2">

                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
                              🩺 {doctorSpecialty}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* DATE */}

                      <div className="mt-5 flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                          <span className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                            📅
                          </span>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">
                              Appointment Date
                            </p>

                            <p className="text-sm font-bold text-gray-700">
                              {new Date(
                                doc.date
                              ).toDateString()}
                            </p>
                          </div>

                        </div>

                        <button
                          onClick={() =>
                            navigate(
                              `/profile/${doctorId}`
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-slate-50 border border-gray-200 text-gray-600 text-sm font-bold hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition"
                        >
                          Profile →
                        </button>

                      </div>

                      {/* SLOTS */}

                      <div className="mt-6">

                        <div className="flex items-center justify-between mb-3">

                          <h4 className="text-sm font-bold text-slate-700">
                            Available Time Slots
                          </h4>

                          <span className="text-xs text-gray-400">
                            {doc.slotDuration?.length || 0} slots
                          </span>

                        </div>

                        {doc.slotDuration?.length > 0 ? (

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                            {doc.slotDuration.map(
                              (slot, idx) => {

                                const isSelected =
                                  selectedSlot?.doctorId ===
                                    doctorId &&
                                  selectedSlot?.date ===
                                    doc.date &&
                                  selectedSlot?.slotStart ===
                                    slot.start;

                                const queueKey =
                                  `${doctorId}_${slot.start}`;

                                const queueNumber =
                                  slotQueueData[
                                    queueKey
                                  ];

                                return (

                                  <button
                                    key={`${slot.start}-${idx}`}
                                    onClick={() =>
                                      handleSelectSlot(
                                        doc,
                                        slot
                                      )
                                    }
                                    className={`relative p-3 rounded-2xl text-left border-2 transition-all duration-200 ${
                                      isSelected
                                        ? "border-teal-500 bg-teal-50 shadow-md scale-[1.02]"
                                        : "border-gray-100 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/50"
                                    }`}
                                  >

                                    <div className="flex items-center justify-between">

                                      <span
                                        className={`text-sm font-black ${
                                          isSelected
                                            ? "text-teal-700"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {slot.start}
                                      </span>

                                      {isSelected && (
                                        <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs">
                                          ✓
                                        </span>
                                      )}

                                    </div>

                                    <p className="text-[11px] text-gray-400 mt-1">
                                      Until {slot.end}
                                    </p>

                                    {queueNumber && (
                                      <p className="text-[10px] font-bold text-purple-600 mt-2">
                                        Queue #{queueNumber}
                                      </p>
                                    )}

                                  </button>

                                );
                              }
                            )}

                          </div>

                        ) : (

                          <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-200 p-5 text-center">
                            <p className="text-sm text-gray-400">
                              No slots available
                            </p>
                          </div>

                        )}

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        ) : (

          /* EMPTY SEARCH */

          <div className="bg-white rounded-[30px] border border-dashed border-gray-300 p-12 text-center">

            <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 flex items-center justify-center text-4xl">
              🔎
            </div>

            <h3 className="text-xl font-black text-gray-700 mt-5">
              No doctors found
            </h3>

            <p className="text-gray-400 mt-2">
              Try another doctor name or specialty.
            </p>

            {(search || specialty) && (
              <button
                onClick={clearSearch}
                className="mt-5 px-5 py-2.5 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition"
              >
                Clear Filters
              </button>
            )}

          </div>

        )}

        {/* =====================================================
            DOCTOR PAGINATION
        ===================================================== */}

        {doctorPagination &&
          doctorPagination.totalPages > 1 && (

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">

              {/* INFO */}

              <p className="text-sm text-gray-400">

                Showing page{" "}

                <span className="font-black text-teal-600">
                  {doctorPagination.currentPage}
                </span>

                {" "}of{" "}

                <span className="font-black text-teal-600">
                  {doctorPagination.totalPages}
                </span>

                <span className="hidden sm:inline">
                  {" "}·{" "}
                  {doctorPagination.totalSchedules}
                  {" "}schedules
                </span>

              </p>

              {/* BUTTONS */}

              <div className="flex items-center gap-2">

                {/* PREVIOUS */}

                <button
                  onClick={() => {
                    if (
                      doctorPagination.hasPreviousPage
                    ) {
                      setDoctorPage(
                        (p) => p - 1
                      );

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }
                  }}
                  disabled={
                    !doctorPagination.hasPreviousPage
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-teal-300 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
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

                <div className="hidden sm:flex items-center gap-1">

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
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition ${
                        page === doctorPage
                          ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md"
                          : "border-2 border-gray-100 text-gray-500 hover:border-teal-300 hover:text-teal-600"
                      }`}
                    >
                      {page}
                    </button>

                  ))}

                </div>

                {/* MOBILE PAGE */}

                <div className="sm:hidden px-3 text-sm font-bold text-gray-500">
                  {doctorPage} /{" "}
                  {doctorPagination.totalPages}
                </div>

                {/* NEXT */}

                <button
                  onClick={() => {
                    if (
                      doctorPagination.hasNextPage
                    ) {
                      setDoctorPage(
                        (p) => p + 1
                      );

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }
                  }}
                  disabled={
                    !doctorPagination.hasNextPage
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-teal-300 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                      d="m9 5 7 7-7 7"
                    />
                  </svg>

                </button>

              </div>

            </div>

          )}

        {/* =====================================================
            CONFIRM APPOINTMENT
        ===================================================== */}

        <div className="mt-8">

          {selectedSlot && (

            <div className="mb-4 p-4 rounded-2xl bg-teal-50 border border-teal-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center">
                  ✓
                </div>

                <div>

                  <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">
                    Selected Slot
                  </p>

                  <p className="font-black text-gray-800">
                    {selectedSlot.slotStart}
                  </p>

                </div>

              </div>

            </div>

          )}

          <button
            onClick={bookSlot}
            disabled={
              booking ||
              !selectedSlot
            }
            className="relative w-full overflow-hidden group bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-teal-200 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >

            <span className="relative z-10 flex items-center justify-center gap-3">

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

                  Booking Appointment...

                </>

              ) : (

                <>
                  <span className="text-xl">
                    🗓️
                  </span>

                  Confirm Appointment
                </>

              )}

            </span>

          </button>

        </div>

        {/* =====================================================
            UPCOMING APPOINTMENTS
        ===================================================== */}

        <div className="mt-14">

          <div className="flex items-end justify-between mb-5">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-2">
                Your Schedule
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Upcoming Appointments
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Track your booked doctor appointments
                and queue position.
              </p>
            </div>

          </div>

          {upcomingAppointments?.length > 0 ? (

            <div className="grid gap-5">

              {upcomingAppointments.map(
                (appointment, index) => (

                  <div
                    key={
                      appointment._id ||
                      `${appointment.doctorId}-${index}`
                    }
                    className="relative overflow-hidden bg-white rounded-[30px] border border-gray-100 shadow-md hover:shadow-xl transition"
                  >

                    {/* GRADIENT */}

                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-indigo-500"></div>

                    <div className="p-6">

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                        {/* LEFT */}

                        <div className="flex items-start gap-4">

                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              appointment.doctorName ||
                                "Doctor"
                            )}`}
                            alt="doctor"
                            className="w-16 h-16 rounded-2xl border-2 border-teal-100"
                          />

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="text-xl font-black text-gray-800">
                                Dr.{" "}
                                {appointment.doctorName ||
                                  "Unknown"}
                              </h3>

                              <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] uppercase tracking-wider font-black">
                                Upcoming
                              </span>

                            </div>

                            <p className="text-sm text-gray-400 mt-1">
                              {appointment.doctorEmail}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-4">

                              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600">
                                📅{" "}
                                {new Date(
                                  appointment.date
                                ).toLocaleDateString()}
                              </div>

                              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600">
                                ⏰{" "}
                                {appointment.slotStart}
                              </div>

                            </div>

                          </div>

                        </div>

                        {/* RIGHT */}

                        <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-3">

                          {/* QUEUE */}

                          <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 text-white rounded-2xl px-7 py-4 text-center min-w-[140px] shadow-lg">

                            <p className="text-[9px] uppercase tracking-[3px] opacity-80">
                              Queue Number
                            </p>

                            <p className="text-3xl font-black">
                              #
                              {appointment.queueNumber}
                            </p>

                          </div>

                          {/* STATUS */}

                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                              appointment.status ===
                              "waiting"
                                ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                                : appointment.status ===
                                  "current"
                                ? "bg-green-50 text-green-600 border border-green-100 animate-pulse"
                                : appointment.status ===
                                  "done"
                                ? "bg-gray-100 text-gray-500 border border-gray-200"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}
                          >
                            {appointment.status ||
                              "waiting"}
                          </span>

                          <button
                            onClick={() =>
                              navigate(
                                `/queue`
                              )
                            }
                            className="px-5 py-2.5 rounded-xl bg-white border-2 border-teal-100 text-teal-600 font-bold text-sm hover:bg-teal-50 hover:border-teal-300 transition"
                          >
                            👁️ View Queue
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="bg-white rounded-[30px] border border-dashed border-gray-300 p-12 text-center">

              <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-50 flex items-center justify-center text-4xl">
                📅
              </div>

              <h3 className="text-xl font-black text-gray-700 mt-5">
                No Upcoming Appointments
              </h3>

              <p className="text-gray-400 mt-2">
                You don't have any scheduled
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
