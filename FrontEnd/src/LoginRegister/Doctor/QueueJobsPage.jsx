import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const QueueJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "/api/queue/prescription",
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setJobs(response.data.jobs);
      }

    } catch (error) {
      console.error(
        "Failed to fetch queue jobs:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ==========================================
  // Statistics
  // ==========================================

  const stats = useMemo(() => {
    return {
      total: jobs.length,

      waiting: jobs.filter(
        (job) => job.status === "waiting"
      ).length,

      running: jobs.filter(
        (job) =>
          job.status === "active" ||
          job.status === "processing"
      ).length,

      completed: jobs.filter(
        (job) => job.status === "completed"
      ).length,

      failed: jobs.filter(
        (job) => job.status === "failed"
      ).length,
    };
  }, [jobs]);

  // ==========================================
  // Filters
  // ==========================================

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {

      const patientName =
        job.patient?.name?.toLowerCase() || "";

      const jobType =
        job.jobType?.toLowerCase() || "";

      const jobId =
        job.jobId?.toString().toLowerCase() || "";

      const searchText =
        search.toLowerCase();

      const matchesSearch =
        patientName.includes(searchText) ||
        jobType.includes(searchText) ||
        jobId.includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        job.status === statusFilter;

      const matchesQueue =
        queueFilter === "all" ||
        job.queueName === queueFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesQueue
      );
    });
  }, [
    jobs,
    search,
    statusFilter,
    queueFilter,
  ]);

  const queueNames = [
    ...new Set(
      jobs.map((job) => job.queueName)
    ),
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* ==========================================
          Header
      ========================================== */}

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Queue Jobs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage background jobs
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <span>↻</span>
          Refresh
        </button>

      </div>


      {/* ==========================================
          Statistics
      ========================================== */}

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-5">

        <StatCard
          title="Total Jobs"
          value={stats.total}
          icon="▦"
        />

        <StatCard
          title="Waiting"
          value={stats.waiting}
          icon="◷"
        />

        <StatCard
          title="Running"
          value={stats.running}
          icon="⚡"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          icon="✓"
        />

        <StatCard
          title="Failed"
          value={stats.failed}
          icon="!"
        />

      </div>


      {/* ==========================================
          Filters
      ========================================== */}

      <div className="p-4 mb-6 bg-white border border-gray-200 rounded-2xl">

        <div className="flex flex-col gap-3 md:flex-row">

          {/* Search */}

          <div className="relative flex-1">

            <span className="absolute text-gray-400 left-3 top-2.5">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search patient, job type or job ID..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full py-2.5 pl-10 pr-4 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400"
            />

          </div>


          {/* Status */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none"
          >
            <option value="all">
              All Status
            </option>

            <option value="waiting">
              Waiting
            </option>

            <option value="active">
              Running
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="failed">
              Failed
            </option>
          </select>


          {/* Queue */}

          <select
            value={queueFilter}
            onChange={(e) =>
              setQueueFilter(e.target.value)
            }
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none"
          >

            <option value="all">
              All Queues
            </option>

            {queueNames.map((queue) => (
              <option
                key={queue}
                value={queue}
              >
                {queue}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* ==========================================
          Table
      ========================================== */}

      <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                  Job
                </th>

                <th className="px-6 py-4 text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                  Patient
                </th>

                <th className="px-6 py-4 text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                  Queue
                </th>

                <th className="px-6 py-4 text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                  Schedule
                </th>

                <th className="px-6 py-4 text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                  Attempts
                </th>

                <th className="px-6 py-4 text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                  Action
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {loading ? (

                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-16 text-center"
                  >
                    <div className="text-sm text-gray-500">
                      Loading queue jobs...
                    </div>
                  </td>
                </tr>

              ) : filteredJobs.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-16 text-center"
                  >
                    <div className="text-3xl">
                      📭
                    </div>

                    <p className="mt-2 text-sm font-medium text-gray-700">
                      No queue jobs found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Try changing your filters
                    </p>
                  </td>
                </tr>

              ) : (

                filteredJobs.map((job) => (

                  <QueueRow
                    key={job._id}
                    job={job}
                    onRefresh={fetchJobs}
                  />

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};


// =================================================
// Statistic Card
// =================================================

const StatCard = ({
  title,
  value,
  icon,
}) => {

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-2xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>

        </div>

        <div className="flex items-center justify-center w-10 h-10 text-lg bg-gray-100 rounded-xl">
          {icon}
        </div>

      </div>

    </div>
  );
};


// =================================================
// Queue Row
// =================================================

const QueueRow = ({
  job,
  onRefresh,
}) => {

  const isFailed =
    job.status === "failed";

  return (
    <tr className="transition hover:bg-gray-50">

      {/* Job */}

      <td className="px-6 py-5">

        <div>

          <p className="text-sm font-semibold text-gray-900">
            #{job.jobId}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {job.jobType}
          </p>

        </div>

      </td>


      {/* Patient */}

      <td className="px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex items-center justify-center w-9 h-9 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
            {getInitials(
              job.patient?.name
            )}
          </div>

          <div>

            <p className="text-sm font-medium text-gray-900">
              {job.patient?.name ||
                "Unknown Patient"}
            </p>

            <p className="text-xs text-gray-400">
              {job.patient?.email || "-"}
            </p>

          </div>

        </div>

      </td>


      {/* Queue */}

      <td className="px-6 py-5">

        <span className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg">
          {job.queueName}
        </span>

      </td>


      {/* Schedule */}

      <td className="px-6 py-5">

        <p className="text-sm font-medium text-gray-700">
          {job.payload?.date || "-"}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {job.payload?.slot || "-"}
        </p>

      </td>


      {/* Status */}

      <td className="px-6 py-5">

        <StatusBadge
          status={job.status}
        />

      </td>


      {/* Attempts */}

      <td className="px-6 py-5">

        <span className="text-sm font-medium text-gray-700">
          {job.attemptsMade || 0}
        </span>

        <span className="text-sm text-gray-400">
          {" / "}
          {job.maxAttempts || 1}
        </span>

      </td>


      {/* Action */}

      <td className="px-6 py-5">

        {isFailed ? (

          <button
            onClick={() => {
              // call retry API here
            }}
            className="px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
          >
            ↻ Retry
          </button>

        ) : (

          <button
            className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            View
          </button>

        )}

      </td>

    </tr>
  );
};


// =================================================
// Status Badge
// =================================================

const StatusBadge = ({
  status,
}) => {

  const config = {

    waiting: {
      label: "Waiting",
      className:
        "bg-gray-100 text-gray-600",
    },

    active: {
      label: "Running",
      className:
        "bg-blue-50 text-blue-600",
    },

    processing: {
      label: "Running",
      className:
        "bg-blue-50 text-blue-600",
    },

    completed: {
      label: "Completed",
      className:
        "bg-green-50 text-green-600",
    },

    failed: {
      label: "Failed",
      className:
        "bg-red-50 text-red-600",
    },

    delayed: {
      label: "Retrying",
      className:
        "bg-yellow-50 text-yellow-600",
    },

  };

  const current =
    config[status] || {
      label: status,
      className:
        "bg-gray-100 text-gray-600",
    };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg ${current.className}`}
    >

      <span className="w-1.5 h-1.5 rounded-full bg-current" />

      {current.label}

    </span>
  );
};


// =================================================
// Initials
// =================================================

const getInitials = (name = "") => {

  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default QueueJobs;