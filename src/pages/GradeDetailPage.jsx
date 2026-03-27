import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchStudents,
  fetchGrades,
  fetchAttendance,
  fetchInstitutionDetail,
} from "../apiCalls";
import "../SimpleDashboard.css";

export default function GradeDetailPage() {
  const { institutionId, grade } = useParams();
  const navigate = useNavigate();
  const [gradeStudents, setGradeStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [students, grds, att, instDetail] = await Promise.all([
        fetchStudents(),
        fetchGrades(),
        fetchAttendance(),
        fetchInstitutionDetail(institutionId),
      ]);

      setGrades(grds);
      setAttendance(att);
      setInstitution(instDetail.institution);

      // Filter students by grade and institution
      const filtered = students.filter(
        (s) => s.institution_code === instDetail.institution.institution_code && s.grade === grade
      );
      setGradeStudents(filtered);
    } catch (err) {
      setError("Failed to load grade details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [institutionId, grade]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate performance score for a student (0-6)
  const getPerformanceScore = (studentId) => {
    const studentGrades = grades.filter((g) => g.id === studentId);
    if (studentGrades.length === 0) return 0;

    const latestGrade = studentGrades[0];
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
    return proficientCount;
  };

  // Calculate attendance percentage
  const getAttendancePercent = (studentId) => {
    const studentAtt = attendance.filter((a) => a.id === studentId);
    if (studentAtt.length === 0) return 0;
    const present = studentAtt.filter((a) => a.status === 1).length;
    return Math.round((present / studentAtt.length) * 100);
  };

  // Filter students by search term
  const filteredStudents = gradeStudents.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading grade details...</div>
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
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>
          📊 Dashboard
        </button>
        <span className="breadcrumb-separator">/</span>
        <button
          className="breadcrumb-link"
          onClick={() => navigate(`/institution/${institutionId}/detail`)}
        >
          {institution?.school}
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Grade {grade}</span>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>👥 Grade {grade}</h1>
          <p className="header-subtitle">
            {institution?.school} | {filteredStudents.length} students
          </p>
        </div>
        <button className="refresh-button" onClick={loadData} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="table-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-results">{filteredStudents.length} results</span>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>ID</th>
              <th>Attendance %</th>
              <th>Performance (6 areas)</th>
              <th>Needs Help?</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const attPercent = getAttendancePercent(student.id);
                const perfScore = getPerformanceScore(student.id);
                const needsHelp = perfScore <= 2;

                return (
                  <tr key={student.id}>
                    <td className="student-name">
                      {student.first_name} {student.last_name}
                    </td>
                    <td>{student.id}</td>
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
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/student/${student.id}/profile`)}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Back Button */}
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <button
          className="view-btn"
          onClick={() => navigate(`/institution/${institutionId}/detail`)}
          style={{ width: "200px" }}
        >
          ← Back to Institution
        </button>
      </div>
    </div>
  );
}
