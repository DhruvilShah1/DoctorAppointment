import BASE_URL from "../../config/api";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Calendar,
  Clock,
  Eye,
  Pill,
  X,
  Search,
  Filter,
  ChevronDown,
  UserRound,
} from "lucide-react";

const DoctorPrescriptionTable = () => {
  const [selectedMedicine, setSelectedMedicine] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    verificationFilter,
    setVerificationFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [
    prescriptions,
    setPrescriptions,
  ] = useState([]);

  useEffect(() => {
    const fetchPrescriptions =
      async () => {
        try {
          setLoading(true);

          const refreshRes =
            await fetch(
              `${BASE_URL}/api/refresh-token`,
              {
                method:
                  "POST",
                credentials:
                  "include",
              }
            );

          const refreshData =
            await refreshRes.json();

          if (
            !refreshRes.ok
          ) {
            throw new Error(
              "Session expired"
            );
          }

          const newToken =
            refreshData.newAccessToken;

          const res =
            await fetch(
              `${BASE_URL}/api/get/prescription/doctor`,
              {
                method:
                  "GET",
                headers:
                  {
                    "Content-Type":
                      "application/json",
                    Authorization: `Bearer ${newToken}`,
                  },
              }
            );

          const data =
            await res.json();

          if (
            data.success
          )
          console.log(data
          );
          
          {
            setPrescriptions(
              data.data ||
                []
            );
          }
        } catch (
          err
        ) {
          console.log(
            err
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    fetchPrescriptions();
  }, []);

  const filteredPrescriptions =
    useMemo(() => {
      return prescriptions.filter(
        (item) => {
          const value =
            search.toLowerCase();

          const patientName =
            item
              ?.patientId?.name?.toLowerCase() ||
            "";

          const patientId =
            item
              ?.patientId?._id?.toLowerCase() ||
            "";

          const prescriptionId =
            item.prescriptionId?.toLowerCase() ||
            "";

          const matchSearch =
            patientName.includes(
              value
            ) ||
            patientId.includes(
              value
            ) ||
            prescriptionId.includes(
              value
            );

          const matchVerification =
            verificationFilter ===
              "all" ||
            item.verificationStatus ===
              verificationFilter;

          const matchStatus =
            statusFilter ===
              "all" ||
            item.status ===
              statusFilter;

          const itemDate =
            new Date(
              item.date
            );

          const matchesFrom =
            !fromDate ||
            itemDate >=
              new Date(
                fromDate
              );

          const matchesTo =
            !toDate ||
            itemDate <=
              new Date(
                toDate
              );

          return (
            matchSearch &&
            matchVerification &&
            matchStatus &&
            matchesFrom &&
            matchesTo
          );
        }
      );
    }, [
      prescriptions,
      search,
      verificationFilter,
      statusFilter,
      fromDate,
      toDate,
    ]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-100 p-8 border-b">
          <div className="flex justify-between flex-col lg:flex-row gap-4">

            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Prescription Dashboard
              </h1>

              <p className="text-slate-500 mt-2">
                Manage patient prescriptions
              </p>
            </div>

            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:scale-105 transition shadow-lg">
              + New Prescription
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">

            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search Patient / Patient ID / Prescription ID"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={
                verificationFilter
              }
              onChange={(e) =>
                setVerificationFilter(
                  e.target.value
                )
              }
              className="rounded-2xl border border-slate-200 px-4"
            >
              <option value="all">
                Verification
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="verified">
                Verified
              </option>
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="rounded-2xl border border-slate-200 px-4"
            >
              <option value="all">
                Status
              </option>

              <option value="issued">
                Issued
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={
                  fromDate
                }
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
                className="border rounded-2xl p-3 w-full"
              />

              <input
                type="date"
                value={
                  toDate
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
                className="border rounded-2xl p-3 w-full"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-5 text-left">
                  Prescription
                </th>
                <th className="p-5 text-left">
                  Patient
                </th>
                <th className="p-5 text-left">
                  Appointment
                </th>
                <th className="p-5 text-left">
                  Medicines
                </th>
                <th className="p-5 text-left">
                  Verification
                </th>
                <th className="p-5 text-left">
                  Status
                </th>
                <th className="p-5 text-left">
                  Action
                </th>
              </tr>
            </thead>
<tbody>
{loading ? (
  <tr>
    <td colSpan="7" className="text-center py-20">
      Loading...
    </td>
  </tr>
) : filteredPrescriptions.length > 0 ? (
  filteredPrescriptions.map((item) => (
    <tr
      key={item._id}
      className="border-b hover:bg-slate-50 transition"
    >
      {/* PRESCRIPTION */}
      <td className="p-5">
        <div className="flex gap-3 items-center">
          <div
            className={`p-3 rounded-2xl ${
              item.status === "notcome"
                ? "bg-red-100"
                : "bg-blue-100"
            }`}
          >
            <FileText
              className={
                item.status === "notcome"
                  ? "text-red-600"
                  : "text-blue-600"
              }
            />
          </div>

          <div>
            <h3 className="font-semibold">
              {item.status === "notcome"
                ? "Missed Appointment"
                : `#${item.prescriptionId}`}
            </h3>

            <p className="text-sm text-slate-500 break-all">
              {item._id}
            </p>
          </div>
        </div>
      </td>

      {/* PATIENT */}
      <td className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center">
            <UserRound />
          </div>

          <div>
            <p className="font-semibold">
              {item?.patientId?.name}
            </p>

            <p className="text-sm text-slate-500">
              {item?.patientId?._id}
            </p>
          </div>
        </div>
      </td>

      {/* APPOINTMENT */}
      <td className="p-5">
        <div>
          <div className="flex gap-2 items-center">
            <Calendar size={16} />
            {item.date}
          </div>

          <div className="flex gap-2 text-slate-500 mt-2 items-center">
            <Clock size={16} />
            {item.slot}
          </div>
        </div>
      </td>

      {/* MEDICINES */}
      <td className="p-5">
        {item.status === "notcome" ? (
          <span className="text-red-500 text-sm font-medium">
            No Visit
          </span>
        ) : (
          <button
            onClick={() =>
              setSelectedMedicine(item.medicines)
            }
            className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-2xl flex items-center gap-2"
          >
            <Pill size={18} />
            {item?.medicines?.length || 0}
          </button>
        )}
      </td>

      {/* VERIFICATION */}
      <td className="p-5">
        {item.status === "notcome" ? (
          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full">
            Not Attended
          </span>
        ) : (
          <span
            className={`px-4 py-2 rounded-full ${
              item.verificationStatus === "verified"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {item.verificationStatus}
          </span>
        )}
      </td>

      {/* STATUS */}
      <td className="p-5">
        <span
          className={`px-4 py-2 rounded-full ${
            item.status === "notcome"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {item.status}
        </span>
      </td>

      {/* ACTION */}
      <td className="p-5">
        {item.status !== "notcome" ? (
          <a
            href={`https://doctorappointment-lj0a.onrender.com${item?.pdfUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition"
          >
            View Prescription
          </a>
        ) : (
          <span className="text-slate-400 text-sm italic">
            No Prescription
          </span>
        )}
      </td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="7" className="text-center py-20">
      No Prescription Found
    </td>
  </tr>
)}
</tbody>
          </table>
        </div>
      </div>

      {selectedMedicine && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl">

            <div className="flex justify-between mb-6">
              <h2 className="font-bold text-2xl">
                Medicines
              </h2>

              <button
                onClick={() =>
                  setSelectedMedicine(
                    null
                  )
                }
              >
                <X />
              </button>
            </div>

            <div className="space-y-4">
              {selectedMedicine.map(
                (
                  med,
                  i
                ) => (
                  <div
                    key={i}
                    className="border rounded-3xl p-5"
                  >
                    <h3 className="font-bold text-lg">
                      {
                        med.name
                      }
                    </h3>

                    <p className="text-slate-500 mt-1">
                      {
                        med.strength
                      }{" "}
                      •{" "}
                      {
                        med.days
                      }{" "}
                      Days
                    </p>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      {med
                        ?.timing
                        ?.morning && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                          Morning
                        </span>
                      )}

                      {med
                        ?.timing
                        ?.afternoon && (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                          Afternoon
                        </span>
                      )}

                      {med
                        ?.timing
                        ?.night && (
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                          Night
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <span className={`px-4 py-2 rounded-full text-sm ${
                        med.medicineChecker
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {med.medicineChecker
                          ? "Purchased"
                          : "Not Purchased"}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptionTable;