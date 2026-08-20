import React, { useEffect, useState } from "react";
import BASE_URL from "../config/api.js";

const QueueJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  // ==========================================
  // Fetch Queue Jobs
  // ==========================================

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${BASE_URL}/api/queue-jobs`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch queue jobs");
      }

      const data = await response.json();

      setJobs(data.jobs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // Retry Job
  // ==========================================

  const retryJob = async (job) => {

    try {

      setRetrying(job.jobId);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/queue-jobs/${job.jobId}/retry`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to retry job");
      }

      const data = await response.json();

      console.log("Retry response:", data);

      // Refresh jobs
      await fetchJobs();

    } catch (error) {

      console.error("Retry error:", error);

      alert("Failed to retry job");

    } finally {

      setRetrying(null);

    }
  };


  useEffect(() => {
    fetchJobs();
  }, []);


  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">
          Loading queue jobs...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* ================================= */}
      {/* Header */}
      {/* ================================= */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Queue Jobs
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Monitor background jobs and retry failed jobs.
        </p>

      </div>


      {/* ================================= */}
      {/* Stats */}
      {/* ================================= */}

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">

        <StatCard
          title="Total"
          value={jobs.length}
        />

        <StatCard
          title="Waiting"
          value={
            jobs.filter(
              (job) => job.status === "waiting"
            ).length
          }
        />

        <StatCard
          title="Completed"
          value={
            jobs.filter(
              (job) => job.status === "completed"
            ).length
          }
        />

        <StatCard
          title="Failed"
          value={
            jobs.filter(
              (job) => job.status === "failed"
            ).length
          }
        />

      </div>


      {/* ================================= */}
      {/* Table */}
      {/* ================================= */}

      <div className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50 border-b">

              <tr>

                <TableHeader>
                  Job
                </TableHeader>

                <TableHeader>
                  Queue
                </TableHeader>

                <TableHeader>
                  Reference
                </TableHeader>

                <TableHeader>
                  Status
                </TableHeader>

                <TableHeader>
                  Attempts
                </TableHeader>

                <TableHeader>
                  Progress
                </TableHeader>

                <TableHeader>
                  Created
                </TableHeader>

                <TableHeader>
                  Action
                </TableHeader>

              </tr>

            </thead>


            <tbody className="divide-y">

              {jobs.map((job) => (

                <tr
                  key={job._id}
                  className="hover:bg-gray-50"
                >

                  {/* Job */}

                  <td className="px-6 py-4">

                    <div>

                      <p className="font-medium text-gray-900">
                        {job.jobType}
                      </p>

                      <p className="text-xs text-gray-400">
                        Job ID: {job.jobId}
                      </p>

                    </div>

                  </td>


                  {/* Queue */}

                  <td className="px-6 py-4">

                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 rounded-md">
                      {job.queueName}
                    </span>

                  </td>


                  {/* Reference */}

                  <td className="px-6 py-4">

                    <div>

                      <p className="text-sm font-medium text-gray-700">
                        {job.referenceType}
                      </p>

                      <p className="text-xs text-gray-400">
                        {job.referenceId}
                      </p>

                    </div>

                  </td>


                  {/* Status */}

                  <td className="px-6 py-4">

                    <StatusBadge
                      status={job.status}
                    />

                  </td>


                  {/* Attempts */}

                  <td className="px-6 py-4">

                    <span className="text-sm text-gray-700">

                      {job.attemptsMade || 0}

                      <span className="text-gray-400">
                        {" "}
                        / {job.maxAttempts || 1}
                      </span>

                    </span>

                  </td>


                  {/* Progress */}

                  <td className="px-6 py-4">

                    <div className="w-32">

                      <div className="flex justify-between mb-1">

                        <span className="text-xs text-gray-500">
                          Progress
                        </span>

                        <span className="text-xs font-medium">
                          {job.progress || 0}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden bg-gray-100 rounded-full">

                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${job.progress || 0}%`,
                          }}
                        />

                      </div>

                    </div>

                  </td>


                  {/* Created */}

                  <td className="px-6 py-4">

                    <span className="text-sm text-gray-500">

                      {formatDate(job.createdAt)}

                    </span>

                  </td>


                  {/* Action */}

                  <td className="px-6 py-4">

                    {job.status === "failed" ? (

                      <button
                        onClick={() => retryJob(job)}
                        disabled={retrying === job.jobId}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >

                        {retrying === job.jobId ? (
                          <>
                            <Spinner />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <span>↻</span>
                            Retry
                          </>
                        )}

                      </button>

                    ) : (

                      <span className="text-xs text-gray-400">
                        —
                      </span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* Empty */}

        {jobs.length === 0 && (

          <div className="p-10 text-center">

            <p className="text-gray-500">
              No queue jobs found.
            </p>

          </div>

        )}

      </div>

    </div>
  );
};


// ==========================================
// Components
// ==========================================

const TableHeader = ({ children }) => {

  return (
    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">
      {children}
    </th>
  );
};


const StatCard = ({ title, value }) => {

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-xl">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
};


const StatusBadge = ({ status }) => {

  const styles = {

    completed:
      "bg-green-100 text-green-700",

    failed:
      "bg-red-100 text-red-700",

    active:
      "bg-blue-100 text-blue-700",

    waiting:
      "bg-yellow-100 text-yellow-700",

    delayed:
      "bg-orange-100 text-orange-700",

  };


  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};


const Spinner = () => {

  return (
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );
};


const formatDate = (date) => {

  if (!date) return "-";

  return new Date(date).toLocaleString();
};


export default QueueJobsPage;