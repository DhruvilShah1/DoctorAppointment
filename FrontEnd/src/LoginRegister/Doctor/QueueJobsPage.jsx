import React, { useEffect, useState } from "react";
import BASE_URL from "../config/api.js";

const PAGE_SIZE = 5;

const REFERENCE_TYPES = ["prescription", "email", "notification", "pdf", "payment", "report", "other"];

const QueueJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [queueName, setQueueName] = useState("");
  const [referenceType, setReferenceType] = useState("");

  const getToken = async () => {
    const res = await fetch(`${BASE_URL}/api/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    return data.newAccessToken;
  };

  const fetchJobs = async (currentPage = 1, qn = queueName, rt = referenceType) => {
    try {
      setLoading(true);
      const token = await getToken();

      const params = new URLSearchParams({ page: currentPage, limit: PAGE_SIZE });
      if (qn) params.set("queueName", qn);
      if (rt) params.set("referenceType", rt);

      const response = await fetch(`${BASE_URL}/api/queue-jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch queue jobs");
      const data = await response.json();

      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (job) => {
    try {
      setRetrying(job.jobId);
      const token = await getToken();

      const response = await fetch(`${BASE_URL}/api/queue-jobs/${job.jobId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to retry job");
      await fetchJobs(page);
    } catch (error) {
      console.error("Retry error:", error);
      alert("Failed to retry job");
    } finally {
      setRetrying(null);
    }
  };

  useEffect(() => { fetchJobs(page); }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchJobs(1, queueName, referenceType);
  };

  const handleClear = () => {
    setQueueName("");
    setReferenceType("");
    setPage(1);
    fetchJobs(1, "", "");
  };

  const handlePage = (p) => {
    setExpanded(null);
    setPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescription Queue</h1>
          <p className="mt-1 text-sm text-gray-500">{total} job{total !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => fetchJobs(page)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Queue Name</label>
          <input
            type="text"
            value={queueName}
            onChange={(e) => setQueueName(e.target.value)}
            placeholder="e.g. prescriptionQueue"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Reference Type</label>
          <select
            value={referenceType}
            onChange={(e) => setReferenceType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
          >
            <option value="">All Types</option>
            {REFERENCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>

        {(queueName || referenceType) && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-10 text-center bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">No queue jobs found.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <Th>#</Th>
                    <Th>Job</Th>
                    <Th>Queue</Th>
                    <Th>Reference Type</Th>
                    <Th>Patient</Th>
                    <Th>Date / Slot</Th>
                    <Th>Status</Th>
                    <Th>Attempts</Th>
                    <Th>Created</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map((job, idx) => (
                    <React.Fragment key={job._id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setExpanded(expanded === job._id ? null : job._id)}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{job.jobType}</p>
                          <p className="text-xs text-gray-400">#{job.jobId}</p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">
                            {job.queueName}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-md capitalize">
                            {job.referenceType}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">
                          {job.payload?.patientId || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-gray-700">{job.payload?.date || "—"}</p>
                          <p className="text-xs text-gray-400">{job.payload?.slot || ""}</p>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={job.status} />
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {job.attemptsMade ?? 0}
                          <span className="text-gray-400"> / {job.maxAttempts ?? 3}</span>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(job.createdAt)}
                        </td>

                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {job.status === "failed" ? (
                            <button
                              onClick={() => retryJob(job)}
                              disabled={retrying === job.jobId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {retrying === job.jobId ? (
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : "↻"}
                              Retry
                            </button>
                          ) : job.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg">
                              ✓ Completed
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expanded === job._id && (
                        <tr className="bg-blue-50">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <Detail label="Reference ID" value={job.referenceId} />
                              <Detail label="Started" value={formatDate(job.startedAt)} />
                              <Detail label="Completed" value={formatDate(job.completedAt)} />
                              <Detail label="Retry Count" value={job.retryCount ?? 0} />
                              {job.lastError && (
                                <div className="col-span-2 sm:col-span-4">
                                  <p className="text-xs text-gray-400 mb-1">Last Error</p>
                                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                    {job.lastError}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>

                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePage(p)}
                    className={`w-9 h-9 text-sm font-medium rounded-lg border transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
    {children}
  </th>
);

const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    active: "bg-blue-100 text-blue-700",
    waiting: "bg-yellow-100 text-yellow-700",
    delayed: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 font-medium truncate">{value ?? "—"}</p>
  </div>
);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

export default QueueJobsPage;
