import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Plotly from "plotly.js-basic-dist-min";
import {
  fetchStudents,
  fetchGrades,
  fetchAttendance,
} from "../apiCalls";
import "../SimpleDashboard.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const todayDate = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);
      const [stud, grad, att] = await Promise.all([
        fetchStudents(),
        fetchGrades(),
        fetchAttendance(),
      ]);

      setStudents(stud);
      setGrades(grad);
      setAttendance(att);

      // Create charts after data loads
      setTimeout(() => {
        createPerformanceSnapshotChart(grad);
      }, 100);
    } catch (err) {
      if (showLoader) {
        setError("Failed to load class data");
      } else {
        console.error("Failed to refresh class data:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Calculate performance score for a student
  const getPerformanceScore = (studentId) => {
    const studentGrades = grades.filter((g) => g.id === studentId);
    if (studentGrades.length === 0) return 0;

    const latestGrade = studentGrades[0]; // Already sorted
    const competencies = [
      "fine_motor",
      "gross_motor",
      "social_emotional",
      "early_literacy",
      "early_numeracy",
      "independence",
    ];

    const proficientCount = competencies.filter(
      (c) => latestGrade[c] === "Proficient"
    ).length;
    return proficientCount; // 0-6 scale
  };

  // Calculate attendance percentage
  const getAttendancePercent = (studentId) => {
    const studentAtt = attendance.filter((a) => a.id === studentId);
    if (studentAtt.length === 0) return 0;

    const present = studentAtt.filter((a) => a.status === 1).length;
    return Math.round((present / studentAtt.length) * 100);
  };

  // Get today's attendance status
  const getTodayStatus = (studentId) => {
    const todayAtt = attendance.find(
      (a) => a.id === studentId && a.date === todayDate
    );
    return todayAtt ? todayAtt.status : null;
  };

  // Performance snapshot chart
  const createPerformanceSnapshotChart = (gradesData) => {
    const container = document.getElementById("performance-snapshot");
    if (!container) return;

    // Get unique students and their latest performance
    const studentPerformance = {};
    gradesData.forEach((grade) => {
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

      if (!studentPerformance[grade.id]) {
        studentPerformance[grade.id] = proficientCount;
      }
    });

    const performanceDistribution = [0, 0, 0, 0, 0, 0, 0];
    Object.values(studentPerformance).forEach((score) => {
      performanceDistribution[score]++;
    });

    const trace = {
      x: ["0/6", "1/6", "2/6", "3/6", "4/6", "5/6", "6/6"],
      y: performanceDistribution,
      type: "bar",
      marker: { color: "rgba(102, 126, 234, 0.7)" },
    };

    const layout = {
      title: "Class Performance Distribution",
      xaxis: { title: "Proficiency Score" },
      yaxis: { title: "Number of Students" },
      margin: { l: 60, r: 30, t: 50, b: 50 },
      height: 350,
    };

    Plotly.newPlot("performance-snapshot", [trace], layout, {
      responsive: true,
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your class...</div>
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

  // Count today's attendance
  const todayPresent = students.filter(
    (s) => getTodayStatus(s.id) === 1
  ).length;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>👨‍🏫 My Class Dashboard</h1>
        <button
          className="refresh-button"
          onClick={() => loadData(false)}
          disabled={loading || refreshing}
        >
          {refreshing ? "⏳ Refreshing..." : "🔄 Refresh Data"}
        </button>
      </div>

      {/* Class Overview Cards */}
      <div className="kpi-cards-container">
        <div className="kpi-card">
          <div className="kpi-value">{students.length}</div>
          <div className="kpi-label">Students in Class</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {todayPresent}/{students.length}
          </div>
          <div className="kpi-label">Present Today</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {Math.round(
              (todayPresent / Math.max(students.length, 1)) * 100
            )}%
          </div>
          <div className="kpi-label">Today's Attendance</div>
        </div>
      </div>

      {/* Performance Snapshot Chart */}
      <div className="chart-container">
        <div id="performance-snapshot"></div>
      </div>

      {/* Student Roster Table */}
      <div className="table-container">
        <h2>📋 Class Roster</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Today</th>
              <th>Overall Att %</th>
              <th>Performance (6 areas)</th>
              <th>Needs Help?</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const attPercent = getAttendancePercent(student.id);
              const perfScore = getPerformanceScore(student.id);
              const todayStatus = getTodayStatus(student.id);
              const needsHelp = perfScore <= 2;

              return (
                <tr key={student.id}>
                  <td className="student-name">
                    {student.first_name} {student.last_name}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        todayStatus === 1
                          ? "present"
                          : todayStatus === 0
                          ? "absent"
                          : "unmarked"
                      }`}
                    >
                      {todayStatus === 1
                        ? "✓ Present"
                        : todayStatus === 0
                        ? "✗ Absent"
                        : "- Mark"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`attendance-badge ${
                        attPercent >= 90 ? "good" : "warning"
                      }`}
                    >
                      {attPercent}%
                    </span>
                  </td>
                  <td>
                    <div className="performance-bar">
                      <div
                        className="performance-fill"
                        style={{
                          width: `${(perfScore / 6) * 100}%`,
                        }}
                      ></div>
                      <span className="performance-text">{perfScore}/6</span>
                    </div>
                  </td>
                  <td>{needsHelp ? "⚠️ Yes" : "✓ Good"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* At-Risk Summary */}
      <div className="table-container">
        <h2>⚠️ Students Needing Support</h2>
        <div className="students-grid">
          {students
            .filter((s) => getPerformanceScore(s.id) <= 2)
            .slice(0, 4)
            .map((student) => (
              <div className="student-card" key={student.id}>
                <div className="student-card-name">
                  {student.first_name} {student.last_name}
                </div>
                <div className="student-card-stat">
                  Performance: {getPerformanceScore(student.id)}/6
                </div>
                <div className="student-card-stat">
                  Attendance: {getAttendancePercent(student.id)}%
                </div>
                <button 
                  className="view-btn"
                  onClick={() => navigate(`/student/${student.id}/profile`)}
                >
                  View Details
                </button>
              </div>
            ))}
          {students.filter((s) => getPerformanceScore(s.id) <= 2).length ===
            0 && <p>Great! All students are doing well! 🎉</p>}
        </div>
      </div>
    </div>
  );
}
