import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../AuthProvider";
import {
  Clock3,
  CalendarDays,
  Coffee,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const today = new Date();

const getDateForDay = (index) => {
  const d = new Date();
  d.setDate(today.getDate() + index);
  return d.toISOString().split("T")[0];
};

const createDay = (date) => ({
  date,
  isOff: false,
  start: "09:00",
  end: "17:00",
  maxPerSlot: 10,
  breaks: [],
  saved: false,
});

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (m) => {
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  const min = String(m % 60).padStart(2, "0");
  return `${h}:${min}`;
};

const generateSlots = (start, end, breaks = []) => {
  const slots = [];
  let s = timeToMinutes(start);
  const e = timeToMinutes(end);

  while (s + 60 <= e) {
    const slotStart = s;
    const slotEnd = s + 60;

    const isBreak = breaks.some((b) => {
      const bStart = timeToMinutes(b.start);
      const bEnd = timeToMinutes(b.end);
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!isBreak) {
      slots.push({
        start: minutesToTime(slotStart),
        end: minutesToTime(slotEnd),
      });
    }

    s += 60;
  }

  return slots;
};

const DoctorDashboard = () => {
  const { accessToken } = useAuth();

  const doctor = JSON.parse(localStorage.getItem("user") || "{}");

  const [schedule, setSchedule] = useState(() =>
    DAYS.reduce((acc, day, i) => {
      acc[day] = createDay(getDateForDay(i));
      return acc;
    }, {})
  );

  const [savedData, setSavedData] = useState({});

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        if (!doctor?.id) return;

        const res = await fetch(
          `http://localhost:5000/api/doctor/${doctor.id}`
        );

        const data = await res.json();

        if (!data.success) return;

        const apiData = data.data;

        const updatedSchedule = { ...schedule };

        apiData.forEach((item) => {
          const dateStr = new Date(item.date)
            .toISOString()
            .split("T")[0];

          const dayKey = Object.keys(updatedSchedule).find(
            (d) => updatedSchedule[d].date === dateStr
          );

          if (dayKey) {
            updatedSchedule[dayKey] = {
              ...updatedSchedule[dayKey],
              ...item,
              date: dateStr,
              saved: true,
            };
          }
        });

        setSchedule(updatedSchedule);

        const formatted = {};

        apiData.forEach((item) => {
          const dateStr = new Date(item.date)
            .toISOString()
            .split("T")[0];

          formatted[dateStr] = item;
        });

        setSavedData(formatted);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchSlots();
  }, []);

  const updateField = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
        saved: false,
      },
    }));
  };

  const toggleOff = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOff: !prev[day].isOff,
        saved: false,
      },
    }));
  };

  const addBreak = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [
          ...prev[day].breaks,
          {
            start: "12:00",
            end: "13:00",
          },
        ],
        saved: false,
      },
    }));
  };

  const removeBreak = (day, index) => {
    const updated = [...schedule[day].breaks];

    updated.splice(index, 1);

    updateField(day, "breaks", updated);
  };

  const saveDay = async (day) => {
    const d = schedule[day];

    if (!doctor?.id) {
      toast.error("Doctor not logged in");
      return;
    }

    const slots = d.isOff
      ? []
      : generateSlots(d.start, d.end, d.breaks);

    const payload = {
      doctorId: doctor.id,
      date: new Date(d.date),
      isOff: d.isOff,
      start: d.start,
      end: d.end,
      maxPerSlot: d.maxPerSlot,
      breaks: d.breaks,
      slots,
    };

    try {
      const res = await fetch(
        `http://localhost:5000/api/create/slot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      toast.success(data.message);

      setSavedData((prev) => ({
        ...prev,
        [d.date]: {
          ...d,
          slots,
        },
      }));

      setSchedule((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          saved: true,
        },
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to save slot");
    }
  };

  const slotsByDay = useMemo(() => {
    const result = {};

    Object.keys(schedule).forEach((day) => {
      const d = schedule[day];

      result[day] = d.isOff
        ? []
        : generateSlots(d.start, d.end, d.breaks);
    });

    return result;
  }, [schedule]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-xl mb-8">
          <h1 className="text-4xl font-bold">
            Doctor Schedule Dashboard
          </h1>

          <p className="mt-2 text-teal-100">
            Manage your weekly appointment availability
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {DAYS.map((day) => {
              const d = schedule[day];
              const slots = slotsByDay[day];

              return (
                <div
                  key={day}
                  className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  {/* TOP */}
                  <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <CalendarDays className="text-teal-600" />

                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                              {day}
                            </h2>

                            <p className="text-gray-500 text-sm">
                              {d.date}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleOff(day)}
                        className={`px-5 py-2 rounded-2xl font-medium transition ${
                          d.isOff
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {d.isOff
                          ? "Marked as Off Day"
                          : "Working Day"}
                      </button>
                    </div>
                  </div>

                  {!d.isOff && (
                    <div className="p-6 space-y-6">
                      {/* WORKING HOURS */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <Clock3 size={20} />
                          Working Hours
                        </h3>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">
                              Start Time
                            </label>

                            <input
                              type="time"
                              value={d.start}
                              onChange={(e) =>
                                updateField(
                                  day,
                                  "start",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">
                              End Time
                            </label>

                            <input
                              type="time"
                              value={d.end}
                              onChange={(e) =>
                                updateField(
                                  day,
                                  "end",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">
                              Max Patients
                            </label>

                            <input
                              type="number"
                              value={d.maxPerSlot}
                              onChange={(e) =>
                                updateField(
                                  day,
                                  "maxPerSlot",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* BREAK SECTION */}
                      <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <Coffee className="text-orange-500" />

                            <h3 className="font-bold text-gray-700">
                              Break Management
                            </h3>
                          </div>

                          <button
                            onClick={() => addBreak(day)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-2xl transition"
                          >
                            <Plus size={18} />
                            Add Break
                          </button>
                        </div>

                        {d.breaks.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            No breaks added yet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {d.breaks.map((b, i) => (
                              <div
                                key={i}
                                className="bg-white rounded-2xl p-4 border border-orange-100"
                              >
                                <div className="grid md:grid-cols-3 gap-4 items-end">
                                  <div>
                                    <label className="text-sm text-gray-500 mb-1 block">
                                      Break Start
                                    </label>

                                    <input
                                      type="time"
                                      value={b.start}
                                      onChange={(e) => {
                                        const updated = [
                                          ...d.breaks,
                                        ];

                                        updated[i].start =
                                          e.target.value;

                                        updateField(
                                          day,
                                          "breaks",
                                          updated
                                        );
                                      }}
                                      className="w-full border border-gray-200 rounded-2xl p-3"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm text-gray-500 mb-1 block">
                                      Break End
                                    </label>

                                    <input
                                      type="time"
                                      value={b.end}
                                      onChange={(e) => {
                                        const updated = [
                                          ...d.breaks,
                                        ];

                                        updated[i].end =
                                          e.target.value;

                                        updateField(
                                          day,
                                          "breaks",
                                          updated
                                        );
                                      }}
                                      className="w-full border border-gray-200 rounded-2xl p-3"
                                    />
                                  </div>

                                  <button
                                    onClick={() =>
                                      removeBreak(day, i)
                                    }
                                    className="bg-red-100 hover:bg-red-200 text-red-600 rounded-2xl py-3 flex items-center justify-center gap-2 transition"
                                  >
                                    <Trash2 size={18} />
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* FOOTER */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="bg-teal-50 text-teal-700 px-4 py-3 rounded-2xl">
                            <p className="text-sm text-gray-500">
                              Total Slots
                            </p>

                            <p className="font-bold text-lg">
                              {slots.length}
                            </p>
                          </div>

                          <div className="bg-cyan-50 text-cyan-700 px-4 py-3 rounded-2xl">
                            <p className="text-sm text-gray-500">
                              Patients / Slot
                            </p>

                            <p className="font-bold text-lg">
                              {d.maxPerSlot}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => saveDay(day)}
                          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold transition ${
                            d.saved
                              ? "bg-green-600 text-white"
                              : "bg-teal-600 hover:bg-teal-700 text-white"
                          }`}
                        >
                          {d.saved ? (
                            <>
                              <CheckCircle2 size={20} />
                              Saved Successfully
                            </>
                          ) : (
                            <>
                              <Save size={20} />
                              Save Schedule
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Weekly Overview
              </h2>

              <p className="text-gray-500 text-sm mb-6">
                Quick summary of your availability
              </p>

              <div className="space-y-4">
                {DAYS.map((day) => {
                  const d = schedule[day];
                  const slots = slotsByDay[day];

                  return (
                    <div
                      key={day}
                      className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-700">
                            {day}
                          </h3>

                          <p className="text-xs text-gray-400">
                            {d.date}
                          </p>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            d.isOff
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {d.isOff ? "Off" : "Active"}
                        </div>
                      </div>

                      {!d.isOff && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Time
                            </span>

                            <span className="font-medium text-gray-700">
                              {d.start} - {d.end}
                            </span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Slots
                            </span>

                            <span className="font-medium text-teal-600">
                              {slots.length}
                            </span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Breaks
                            </span>

                            <span className="font-medium text-orange-500">
                              {d.breaks.length}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;