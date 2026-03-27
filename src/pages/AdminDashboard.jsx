import React, { useState, useEffect, useCallback } from "react";
import Plotly from "plotly.js-basic-dist-min";
import { fetchAdminDashboardStats } from "../apiCalls";
import "../SimpleDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminDashboardStats();
      setStats(data);

      // Create charts after data loads
      setTimeout(() => {
        createAttendanceTrendChart(data);
        createCompetencyDistributionChart(data);
      }, 100);
    } catch (err) {
      setError("Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Attendance trend chart
  const createAttendanceTrendChart = (data) => {
    const container = document.getElementById("attendance-trend-chart");
    if (!container || !data.institutionStats) return;

    // Sort institutions by attendance for visualization
    const sorted = [...data.institutionStats].sort(
      (a, b) => (b.attendance_percent || 0) - (a.attendance_percent || 0)
    );

    const trace = {
      x: sorted.map((inst) => inst.school),
      y: sorted.map((inst) => inst.attendance_percent || 0),
      type: "bar",
      marker: { color: "rgba(102, 126, 234, 0.7)" },
    };

    const layout = {
      title: "Institution Attendance Comparison (Last 30 Days)",
      xaxis: { title: "Institution" },
      yaxis: { title: "Attendance %", range: [0, 100] },
      margin: { l: 60, r: 30, t: 50, b: 80 },
      height: 400,
    };

    Plotly.newPlot("attendance-trend-chart", [trace], layout, {
      responsive: true,
    });
  };

  // Competency distribution chart
  const createCompetencyDistributionChart = (data) => {
    const container = document.getElementById("competency-chart");
    if (!container || !data.competencyDistribution) return;

    const competencies = Object.keys(data.competencyDistribution);
    const proficientCounts = competencies.map(
      (c) => data.competencyDistribution[c].proficient
    );
    const developingCounts = competencies.map(
      (c) => data.competencyDistribution[c].developing
    );
    const emergingCounts = competencies.map(
      (c) => data.competencyDistribution[c].emerging
    );

    const trace1 = {
      x: competencies.map((c) => c.replace(/_/g, " ")),
      y: proficientCounts,
      name: "Proficient",
      type: "bar",
      marker: { color: "rgba(75, 192, 75, 0.7)" },
    };

    const trace2 = {
      x: competencies.map((c) => c.replace(/_/g, " ")),
      y: developingCounts,
      name: "Developing",
      type: "bar",
      marker: { color: "rgba(255, 193, 7, 0.7)" },
    };

    const trace3 = {
      x: competencies.map((c) => c.replace(/_/g, " ")),
      y: emergingCounts,
      name: "Emerging",
      type: "bar",
      marker: { color: "rgba(244, 67, 54, 0.7)" },
    };

    const layout = {
      title: "Competency Distribution (Current Quarter)",
      barmode: "stack",
      xaxis: { title: "Competency Area" },
      yaxis: { title: "Student Count" },
      margin: { l: 60, r: 30, t: 50, b: 100 },
      height: 400,
    };

    Plotly.newPlot(
      "competency-chart",
      [trace1, trace2, trace3],
      layout,
      { responsive: true }
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading admin dashboard...</div>
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

  return (
    <div className="dashboard-container">
      {/* Header with refresh button */}
      <div className="dashboard-header">
        <h1>📊 Admin Dashboard</h1>
        <button className="refresh-button" onClick={loadStats} disabled={loading}>
          🔄 Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="kpi-cards-container">
          <div className="kpi-card">
            <div className="kpi-value">{stats.totalStudents}</div>
            <div className="kpi-label">Total Students</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{stats.totalInstitutions}</div>
            <div className="kpi-label">Active Schools</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">Q{stats.currentQuarter}</div>
            <div className="kpi-label">{stats.currentYear}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{stats.avgAttendance}%</div>
            <div className="kpi-label">Avg Attendance</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <div id="attendance-trend-chart"></div>
        </div>
        <div className="chart-container">
          <div id="competency-chart"></div>
        </div>
      </div>

      {/* Institution Table */}
      {stats && (
        <div className="table-container">
          <h2>📍 Institution Overview</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>School Name</th>
                <th>Students</th>
                <th>Attendance %</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.institutionStats.map((inst) => (
                <tr key={inst.id}>
                  <td>{inst.school}</td>
                  <td>{inst.student_count}</td>
                  <td>
                    <span
                      className={`attendance-badge ${
                        (inst.attendance_percent || 0) >= 90 ? "good" : "warning"
                      }`}
                    >
                      {inst.attendance_percent || 0}%
                    </span>
                  </td>
                  <td>
                    <button className="view-btn">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
