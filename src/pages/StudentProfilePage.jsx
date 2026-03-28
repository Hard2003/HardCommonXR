import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Plotly from "plotly.js-basic-dist-min";
import { fetchStudentHistory } from "../apiCalls";
import "../SimpleDashboard.css";

export default function StudentProfilePage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);
      const data = await fetchStudentHistory(studentId);
      setHistory(data);

      // Create charts after data loads
      setTimeout(() => {
        createAttendanceHistoryChart(data.attendanceHistory);
        createGradeProgressionChart(data.gradesHistory);
      }, 100);
    } catch (err) {
      if (showLoader) {
        setError("Failed to load student profile");
      } else {
        console.error("Failed to refresh student profile:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  const createAttendanceHistoryChart = (attendanceHistory) => {
    const container = document.getElementById("attendance-history-chart");
    if (!container || !attendanceHistory || attendanceHistory.length === 0)
      return;

    // Group by date and show trend
    const dateMap = {};
    attendanceHistory.forEach((att) => {
      dateMap[att.date] = att.status;
    });

    // Sort dates and get last 90 days
    const sortedDates = Object.keys(dateMap).sort().reverse().slice(0, 90);
    const statuses = sortedDates.reverse().map((d) => dateMap[d]);

    // Count by status
    const present = statuses.filter((s) => s === 1).length;
    const absent = statuses.filter((s) => s === 0).length;
    const tardy = statuses.filter((s) => s === 2).length;
    const earlyPickup = statuses.filter((s) => s === 3).length;

    const trace = {
      labels: ["Present", "Absent", "Tardy", "Early Pickup"],
      values: [present, absent, tardy, earlyPickup],
      type: "pie",
      marker: {
        colors: [
          "rgba(75, 192, 75, 0.7)",
          "rgba(244, 67, 54, 0.7)",
          "rgba(255, 193, 7, 0.7)",
          "rgba(156, 39, 176, 0.7)",
        ],
      },
    };

    const layout = {
      title: `Attendance Summary (Last 90 Days)`,
      height: 380,
    };

    Plotly.newPlot("attendance-history-chart", [trace], layout, {
      responsive: true,
    });
  };

  const createGradeProgressionChart = (gradesHistory) => {
    const container = document.getElementById("grade-progression-chart");
    if (!container || !gradesHistory || gradesHistory.length === 0) return;

    // Sort by school year and quarter
    const sorted = [...gradesHistory].sort((a, b) => {
      if (a.school_year !== b.school_year) {
        return b.school_year - a.school_year;
      }
      return b.grading_quarter - a.grading_quarter;
    });

    // Single trace for proficiency progression (showing number of competencies at proficient level)
    const trace = {
      x: sorted.map((g) => `Q${g.grading_quarter} ${g.school_year}`),
      y: sorted.map((grade) => {
        const competencies = [
          "fine_motor",
          "gross_motor",
          "social_emotional",
          "early_literacy",
          "early_numeracy",
          "independence",
        ];
        const proficientCount = competencies.filter(
          (c) => grade[c] === "Proficient"
        ).length;
        return proficientCount;
      }),
      name: "Proficient Count",
      type: "scatter",
      mode: "lines+markers",
      marker: { color: "rgba(102, 126, 234, 0.8)", size: 8 },
      line: { color: "rgba(102, 126, 234, 0.8)", width: 3 },
    };

    const layout = {
      title: "Competency Progression (Proficient Count)",
      xaxis: { title: "Quarter" },
      yaxis: { title: "Number Proficient (out of 6)", range: [0, 6] },
      margin: { l: 60, r: 30, t: 50, b: 80 },
      height: 380,
    };

    Plotly.newPlot("grade-progression-chart", [trace], layout, {
      responsive: true,
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading student profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="dashboard-container">
        <div className="error">Student not found</div>
      </div>
    );
  }

  const student = history.student;

  // Calculate status counts
  const attHistory = history.attendanceHistory || [];
  const present = attHistory.filter((a) => a.status === 1).length;
  const absent = attHistory.filter((a) => a.status === 0).length;
  const tardy = attHistory.filter((a) => a.status === 2).length;

  return (
    <div className="dashboard-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>
          📊 Dashboard
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">
          {student.first_name} {student.last_name}
        </span>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>
            👤 {student.first_name} {student.last_name}
          </h1>
          <p className="header-subtitle">
            ID: {student.id} | Grade: {student.grade} | Institution:{" "}
            {student.institution_code}
          </p>
        </div>
        <button
          className="refresh-button"
          onClick={() => loadHistory(false)}
          disabled={loading || refreshing}
        >
          {refreshing ? "⏳ Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Student Info Cards */}
      <div className="kpi-cards-container">
        <div className="kpi-card">
          <div className="kpi-value">{history.attendancePercent}%</div>
          <div className="kpi-label">Overall Attendance</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{present}</div>
          <div className="kpi-label">Days Present</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{absent}</div>
          <div className="kpi-label">Days Absent</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{tardy}</div>
          <div className="kpi-label">Tardy Days</div>
        </div>
      </div>

      {/* Detailed Info */}
      <div className="table-container">
        <h2>📋 Student Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Date of Birth:</span>
            <span className="info-value">{student.dob}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Gender:</span>
            <span className="info-value">{student.gender}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Guardian Email:</span>
            <span className="info-value">{student.primary_guardian_email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Student ID:</span>
            <span className="info-value">{student.uuid}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <div id="attendance-history-chart"></div>
        </div>
        <div className="chart-container">
          <div id="grade-progression-chart"></div>
        </div>
      </div>

      {/* Grade History Table */}
      {history.gradesHistory && history.gradesHistory.length > 0 && (
        <div className="table-container">
          <h2>📊 Grade History (Recent First)</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Quarter</th>
                <th>Fine Motor</th>
                <th>Gross Motor</th>
                <th>Social-Emot</th>
                <th>Early Literacy</th>
                <th>Early Numeracy</th>
                <th>Independence</th>
              </tr>
            </thead>
            <tbody>
              {history.gradesHistory.map((grade, idx) => (
                <tr key={idx}>
                  <td>{grade.school_year}</td>
                  <td>Q{grade.grading_quarter}</td>
                  <td>
                    <span className={`grade-badge ${grade.fine_motor?.toLowerCase()}`}>
                      {grade.fine_motor}
                    </span>
                  </td>
                  <td>
                    <span className={`grade-badge ${grade.gross_motor?.toLowerCase()}`}>
                      {grade.gross_motor}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`grade-badge ${grade.social_emotional?.toLowerCase()}`}
                    >
                      {grade.social_emotional}
                    </span>
                  </td>
                  <td>
                    <span className={`grade-badge ${grade.early_literacy?.toLowerCase()}`}>
                      {grade.early_literacy}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`grade-badge ${grade.early_numeracy?.toLowerCase()}`}
                    >
                      {grade.early_numeracy}
                    </span>
                  </td>
                  <td>
                    <span className={`grade-badge ${grade.independence?.toLowerCase()}`}>
                      {grade.independence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back Button */}
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <button
          className="view-btn"
          onClick={() => navigate(-1)}
          style={{ width: "200px" }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
