import React, { useEffect, useState } from "react";
import BASE_URL from "../config/api.js";

const PAGE_SIZE = 5;

const QueueJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);

  const fetchJobs = async (currentPage = page) => {
    try {
      setLoading(true);
      const refreshRes = await fetch(`${BASE_URL}/api/refresh-token`, {
        method: "POST",
        credentials: "include",
      });
      const refreshData = await refreshRes.json();

      const response = await fetch(
        `${BASE_URL}/api/queue-jobs?page=${currentPage}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${refreshData.newAccessToken}` } }
      );

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

  useEffect(() => { fetchJobs(page); }, [page]);

  const handlePage = (p) => {
    setExpanded(null);
    setPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

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

      {jobs.length === 0 ? (
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
                    <Th>Patient</Th>
                    <Th>Date / Slot</Th>
                    <Th>Status</Th>
                    <Th>Attempts</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
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
                          {job.result?.pdfUrl ? (
                            <a
                              href={job.result.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              PDF
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expanded === job._id && (
                        <tr className="bg-blue-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <Detail label="Reference Type" value={job.referenceType} />
                              <Detail label="Reference ID" value={job.referenceId} />
                              <Detail label="Started" value={formatDate(job.startedAt)} />
                              <Detail label="Completed" value={formatDate(job.completedAt)} />
                              {job.lastError && (
                                <div className="col-span-2 sm:col-span-4">
                                  <p className="text-xs text-gray-400 mb-1">Last Error</p>
                                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                    {job.lastError}
                                  </p>
                                </div>
                              )}
                              {job.result?.qrCode && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">QR Code</p>
                                  <img
                                    src={job.result.qrCode}
                                    alt="QR"
                                    className="w-16 h-16 rounded border border-gray-200"
                                  />
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
    <p className="text-sm text-gray-800 font-medium truncate">{value || "—"}</p>
  </div>
);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

export default QueueJobsPage;
