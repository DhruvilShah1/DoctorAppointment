import React, { useEffect, useState } from "react";

const QueueJobs = () => {
  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [retryingJob, setRetryingJob] = useState(null);

  // ==========================================
  // Fetch Queue Jobs
  // ==========================================

  const fetchQueueJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/queue/prescription`,
        {
          method: "GET",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Failed to fetch queue"
        );
      }

      setJobs(data.jobs || []);

    } catch (error) {
      console.error(
        "❌ Queue Fetch Error:",
        error
      );

      setError(
        error.message ||
          "Failed to load queue jobs"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Initial Load
  // ==========================================

  useEffect(() => {
    fetchQueueJobs();
  }, []);

  // ==========================================
  // Retry Job
  // ==========================================

  const handleRetry = async (jobId) => {
    try {
      setRetryingJob(jobId);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/queue/retry/${jobId}`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Retry failed"
        );
      }

      // Refresh queue
      await fetchQueueJobs();

    } catch (error) {
      console.error(
        "❌ Retry Error:",
        error
      );

      alert(
        error.message ||
          "Failed to retry job"
      );
    } finally {
      setRetryingJob(null);
    }
  };

  // ==========================================
  // Status Color
  // ==========================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return {
          background: "#dcfce7",
          color: "#15803d",
        };

      case "failed":
        return {
          background: "#fee2e2",
          color: "#dc2626",
        };

      case "waiting":
        return {
          background: "#fef3c7",
          color: "#d97706",
        };

      case "active":
        return {
          background: "#dbeafe",
          color: "#2563eb",
        };

      case "delayed":
        return {
          background: "#f3e8ff",
          color: "#9333ea",
        };

      default:
        return {
          background: "#f3f4f6",
          color: "#374151",
        };
    }
  };

  // ==========================================
  // Format Date
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loader}></div>

        <p style={styles.loadingText}>
          Loading Queue Jobs...
        </p>
      </div>
    );
  }

  // ==========================================
  // Error
  // ==========================================

  if (error) {
    return (
      <div style={styles.center}>
        <div style={styles.errorBox}>
          <h3>Something went wrong</h3>

          <p>{error}</p>

          <button
            onClick={fetchQueueJobs}
            style={styles.refreshButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main UI
  // ==========================================

  return (
    <div style={styles.page}>

      {/* ======================================
          Header
      ====================================== */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            Queue Jobs
          </h1>

          <p style={styles.subtitle}>
            Monitor and manage your background jobs
          </p>
        </div>

        <button
          onClick={fetchQueueJobs}
          style={styles.refreshButton}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ======================================
          Statistics
      ====================================== */}

      <div style={styles.stats}>

        <StatCard
          title="Total Jobs"
          value={jobs.length}
          icon="📋"
        />

        <StatCard
          title="Completed"
          value={
            jobs.filter(
              (job) =>
                job.status === "completed"
            ).length
          }
          icon="✓"
        />

        <StatCard
          title="Processing"
          value={
            jobs.filter(
              (job) =>
                job.status === "active" ||
                job.status === "waiting"
            ).length
          }
          icon="⚡"
        />

        <StatCard
          title="Failed"
          value={
            jobs.filter(
              (job) =>
                job.status === "failed"
            ).length
          }
          icon="!"
        />

      </div>

      {/* ======================================
          Empty State
      ====================================== */}

      {jobs.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>
            📭
          </div>

          <h2>No Queue Jobs</h2>

          <p>
            There are currently no jobs
            in your queue.
          </p>
        </div>
      ) : (

        /* ====================================
           Jobs Table
        ==================================== */

        <div style={styles.tableContainer}>

          <table style={styles.table}>

            <thead>

              <tr>

                <th style={styles.th}>
                  Job
                </th>

                <th style={styles.th}>
                  Patient
                </th>

                <th style={styles.th}>
                  Type
                </th>

                <th style={styles.th}>
                  Date
                </th>

                <th style={styles.th}>
                  Slot
                </th>

                <th style={styles.th}>
                  Status
                </th>

                <th style={styles.th}>
                  Attempts
                </th>

                <th style={styles.th}>
                  Created
                </th>

                <th style={styles.th}>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {jobs.map((job) => {

                const statusStyle =
                  getStatusStyle(
                    job.status
                  );

                return (

                  <tr
                    key={job._id}
                    style={styles.tr}
                  >

                    {/* Job */}

                    <td style={styles.td}>

                      <div style={styles.jobId}>
                        #{job.jobId}
                      </div>

                      <div style={styles.queueName}>
                        {job.queueName}
                      </div>

                    </td>

                    {/* Patient */}

                    <td style={styles.td}>

                      <div style={styles.patient}>

                        <div
                          style={
                            styles.avatar
                          }
                        >
                          {job.patientName
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "P"}
                        </div>

                        <div>

                          <div
                            style={
                              styles.patientName
                            }
                          >
                            {job.patientName ||
                              "Unknown Patient"}
                          </div>

                          <div
                            style={
                              styles.patientEmail
                            }
                          >
                            {job.patientEmail ||
                              "-"}
                          </div>

                        </div>

                      </div>

                    </td>

                    {/* Job Type */}

                    <td style={styles.td}>

                      <span
                        style={
                          styles.typeBadge
                        }
                      >
                        {job.jobType}
                      </span>

                    </td>

                    {/* Date */}

                    <td style={styles.td}>

                      {job.date || "-"}

                    </td>

                    {/* Slot */}

                    <td style={styles.td}>

                      <span
                        style={
                          styles.slot
                        }
                      >
                        {job.slot || "-"}
                      </span>

                    </td>

                    {/* Status */}

                    <td style={styles.td}>

                      <span
                        style={{
                          ...styles.status,
                          background:
                            statusStyle.background,
                          color:
                            statusStyle.color,
                        }}
                      >

                        <span
                          style={{
                            ...styles.statusDot,
                            background:
                              statusStyle.color,
                          }}
                        />

                        {job.status}

                      </span>

                    </td>

                    {/* Attempts */}

                    <td style={styles.td}>

                      <div
                        style={
                          styles.attempts
                        }
                      >

                        <strong>
                          {job.attemptsMade ||
                            0}
                        </strong>

                        <span>
                          /
                          {job.maxAttempts ||
                            3}
                        </span>

                      </div>

                    </td>

                    {/* Created */}

                    <td style={styles.td}>

                      <span
                        style={
                          styles.created
                        }
                      >
                        {formatDate(
                          job.createdAt
                        )}
                      </span>

                    </td>

                    {/* Action */}

                    <td style={styles.td}>

                      {job.status ===
                        "failed" ? (

                        <button
                          onClick={() =>
                            handleRetry(
                              job.jobId
                            )
                          }
                          disabled={
                            retryingJob ===
                            job.jobId
                          }
                          style={
                            styles.retryButton
                          }
                        >

                          {retryingJob ===
                          job.jobId
                            ? "Retrying..."
                            : "↻ Retry"}

                        </button>

                      ) : (

                        <button
                          style={
                            styles.viewButton
                          }
                          onClick={() =>
                            console.log(
                              "Job:",
                              job
                            )
                          }
                        >
                          View
                        </button>

                      )}

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
};


// ==========================================
// Stat Card
// ==========================================

const StatCard = ({
  title,
  value,
  icon,
}) => {

  return (

    <div style={styles.statCard}>

      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>

        <p style={styles.statTitle}>
          {title}
        </p>

        <h2 style={styles.statValue}>
          {value}
        </h2>

      </div>

    </div>

  );
};


// ==========================================
// Styles
// ==========================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "14px",
  },

  refreshButton: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "28px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    border:
      "1px solid #e2e8f0",
    boxShadow:
      "0 4px 15px rgba(15,23,42,0.04)",
  },

  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  statTitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  statValue: {
    margin: "3px 0 0",
    color: "#0f172a",
    fontSize: "24px",
  },

  tableContainer: {
    background: "#fff",
    borderRadius: "18px",
    overflowX: "auto",
    border:
      "1px solid #e2e8f0",
    boxShadow:
      "0 5px 20px rgba(15,23,42,0.05)",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
    minWidth: "1200px",
  },

  th: {
    textAlign: "left",
    padding: "16px",
    fontSize: "12px",
    textTransform:
      "uppercase",
    color: "#64748b",
    background: "#f8fafc",
    borderBottom:
      "1px solid #e2e8f0",
  },

  td: {
    padding: "17px 16px",
    borderBottom:
      "1px solid #f1f5f9",
    fontSize: "13px",
    color: "#334155",
  },

  tr: {
    transition:
      "background 0.2s",
  },

  jobId: {
    fontWeight: "700",
    color: "#0f172a",
  },

  queueName: {
    marginTop: "4px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  patient: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    color: "#475569",
  },

  patientName: {
    fontWeight: "600",
    color: "#0f172a",
  },

  patientEmail: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "3px",
  },

  typeBadge: {
    padding: "6px 9px",
    borderRadius: "7px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "600",
  },

  slot: {
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    padding: "6px 9px",
    borderRadius: "7px",
    fontWeight: "600",
  },

  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform:
      "capitalize",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  attempts: {
    display: "flex",
    gap: "3px",
    alignItems: "center",
  },

  created: {
    color: "#64748b",
    fontSize: "12px",
  },

  retryButton: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },

  viewButton: {
    border:
      "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },

  center: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  loader: {
    width: "35px",
    height: "35px",
    border:
      "4px solid #e2e8f0",
    borderTop:
      "4px solid #0f172a",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },

  loadingText: {
    color: "#64748b",
    marginTop: "12px",
  },

  errorBox: {
    background: "#fff",
    padding: "30px",
    borderRadius: "15px",
    textAlign: "center",
    border:
      "1px solid #fecaca",
  },

  empty: {
    background: "#fff",
    padding: "70px",
    textAlign: "center",
    borderRadius: "18px",
    border:
      "1px solid #e2e8f0",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "15px",
  },
};

export default QueueJobs;