import React, { useEffect, useState } from "react";
import BASE_URL from "../config/api.js";

const QueueJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const refreshRes = await fetch(`${BASE_URL}/api/refresh-token`, {
        method: "POST",
        credentials: "include",
      });
      const refreshData = await refreshRes.json();

      const response = await fetch(`${BASE_URL}/api/queue-jobs`, {
        headers: {
          Authorization: `Bearer ${refreshData.newAccessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch queue jobs");

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

//   const retryJob = async (job) => {
//     try {
//       setRetrying(job.jobId);
//       const refreshRes = await fetch(`${BASE_URL}/api/refresh-token`, {
//         method: "POST",
//         credentials: "include",
//       });
//       const refreshData = await refreshRes.json();

//       const response = await fetch(`${BASE_URL}/api/queue-jobs/${job.jobId}/retry`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${refreshData.newAccessToken}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to retry job");
//       await fetchJobs();
//     } catch (error) {
//       console.error("Retry error:", error);
//       alert("Failed to retry job");
//     } finally {
//       setRetrying(null);
//     }
//   };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prescription Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-10 text-center bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">No queue jobs found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{job.jobType}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Job #{job.jobId}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Detail label="Queue" value={job.queueName} />
                <Detail label="Type" value={job.referenceType} />
                <Detail label="Reference ID" value={job.referenceId} />
                <Detail label="Patient ID" value={job.payload?.patientId} />
                <Detail label="Date" value={job.payload?.date} />
                <Detail label="Slot" value={job.payload?.slot} />
                <Detail
                  label="Attempts"
                  value={`${job.attemptsMade ?? 0} / ${job.maxAttempts ?? 3}`}
                />
                <Detail label="Created" value={formatDate(job.createdAt)} />
                <Detail label="Completed" value={formatDate(job.completedAt)} />
              </div>

              {/* Result links */}
              {job.result?.success && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {job.result.pdfUrl && (
                    <a
                      href={job.result.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      View PDF
                    </a>
                  )}
                  {job.result.qrCode && (
                    <img
                      src={job.result.qrCode}
                      alt="QR Code"
                      className="w-14 h-14 rounded border border-gray-200"
                    />
                  )}
                </div>
              )}

              {/* Error */}
              {job.lastError && (
                <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {job.lastError}
                </p>
              )}

              {/* Retry */}
              {job.status === "failed" && (
                <div className="mt-4">
                  <button
                    // onClick={() => retryJob(job)}
                    disabled={retrying === job.jobId}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {retrying === job.jobId ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>↻ Retry</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    active: "bg-blue-100 text-blue-700",
    waiting: "bg-yellow-100 text-yellow-700",
    delayed: "bg-orange-100 text-orange-700",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 font-medium truncate">{value || "—"}</p>
  </div>
);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

export default QueueJobsPage;
