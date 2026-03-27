import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Plotly from "plotly.js-basic-dist-min";
import { fetchInstitutionDetail } from "../apiCalls";
import "../SimpleDashboard.css";

export default function InstitutionDetailPage() {
  const { institutionId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchInstitutionDetail(institutionId);
      setDetail(data);

      // Create charts after data loads
      setTimeout(() => {
        if (data.students && data.students.length > 0) {
          createStudentsByGradeChart(data.students);
        }
      }, 100);
    } catch (err) {
      setError("Failed to load institution details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDetail();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadDetail]);

  const createStudentsByGradeChart = (students) => {
    const container = document.getElementById("grade-distribution-chart");
    if (!container) return;

    // Count students by grade
    const gradeCount = {};
    students.forEach((s) => {
      const grade = s.grade || "Unknown";
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    });

    const grades = Object.keys(gradeCount).sort();
    const counts = grades.map((g) => gradeCount[g]);

    const trace = {
      x: grades,
      y: counts,
      type: "bar",
      marker: { color: "rgba(102, 126, 234, 0.7)" },
    };

    const layout = {
      title: "Students by Grade",
      xaxis: { title: "Grade Level" },
      yaxis: { title: "Number of Students" },
      margin: { l: 60, r: 30, t: 50, b: 50 },
      height: 350,
    };

    Plotly.newPlot("grade-distribution-chart", [trace], layout, {
      responsive: true,
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading institution details...</div>
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

  if (!detail) {
    return (
      <div className="dashboard-container">
        <div className="error">Institution not found</div>
      </div>
    );
  }

  // Group students by grade
  const studentsByGrade = {};
  detail.students.forEach((student) => {
    const grade = student.grade || "Unknown";
    if (!studentsByGrade[grade]) {
      studentsByGrade[grade] = [];
    }
    studentsByGrade[grade].push(student);
  });

  const grades = Object.keys(studentsByGrade).sort();

  return (
    <div className="dashboard-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>
          📊 Dashboard
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{detail.institution.school}</span>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>🏫 {detail.institution.school}</h1>
          <p className="header-subtitle">
            Principal: {detail.institution.principal} | District:{" "}
            {detail.institution.district}
          </p>
        </div>
        <button className="refresh-button" onClick={loadDetail} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards-container">
        <div className="kpi-card">
          <div className="kpi-value">{detail.studentCount}</div>
          <div className="kpi-label">Total Students</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{grades.length}</div>
          <div className="kpi-label">Grade Levels</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{detail.attendancePercent}%</div>
          <div className="kpi-label">Avg Attendance (30d)</div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <div id="grade-distribution-chart"></div>
      </div>

      {/* Grades Section */}
      <div className="table-container">
        <h2>📚 Grades & Students</h2>

        {grades.map((grade) => (
          <div key={grade} className="grade-section">
            <div className="grade-header">
              <h3>{grade} ({studentsByGrade[grade].length} students)</h3>
              <button
                className="view-btn"
                onClick={() => navigate(`/institution/${institutionId}/grade/${grade}`)}
              >
                View Details →
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentsByGrade[grade].slice(0, 5).map((student) => (
                  <tr key={student.id}>
                    <td className="student-name">
                      {student.first_name} {student.last_name}
                    </td>
                    <td>{student.id}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/student/${student.id}/profile`)}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {studentsByGrade[grade].length > 5 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", padding: "15px" }}>
                      <em>
                        +{studentsByGrade[grade].length - 5} more students (click
                        "View Details" to see all)
                      </em>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <button
          className="view-btn"
          onClick={() => navigate("/dashboard")}
          style={{ width: "200px" }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
