import React, { useState, useEffect, useCallback } from "react";
import { fetchStudents } from "../apiCalls";
import { useDataCache } from "../context/DataContext";
import "./StudentList.css";

const getInstitutionName = (student) =>
  student.institution || student.school || student.institution_code || "Unknown";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [institutions, setInstitutions] = useState([]);
  const [grades, setGrades] = useState([]);
  const { getCachedStudents, cacheStudents } = useDataCache();

  const extractFilters = useCallback((data) => {
    const uniqueInstitutions = [...new Set(data.map((s) => getInstitutionName(s)))].sort();
    const uniqueGrades = [...new Set(data.map((s) => s.grade))].sort();
    setInstitutions(uniqueInstitutions);
    setGrades(uniqueGrades);
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = getCachedStudents();
        if (cachedData) {
          setStudents(cachedData);
          extractFilters(cachedData);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const data = await fetchStudents();
        setStudents(data);
        cacheStudents(data);
        extractFilters(data);
      } catch (err) {
        setError('Failed to load students');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [getCachedStudents, cacheStudents, extractFilters]);

  // Update available grades based on selected institution
  useEffect(() => {
    let availableGrades = students;
    
    // If institution is selected, only show grades from that institution
    if (filterInstitution) {
      availableGrades = students.filter((s) => getInstitutionName(s) === filterInstitution);
    }
    
    const uniqueGrades = [...new Set(availableGrades.map(s => s.grade))].sort();
    setGrades(uniqueGrades);

    // Reset grade filter if it's not available in selected institution
    if (filterInstitution && filterGrade && !uniqueGrades.includes(filterGrade)) {
      setFilterGrade("");
    }
  }, [filterInstitution, filterGrade, students]);

  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.primary_guardian_email || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply institution filter
    if (filterInstitution) {
      filtered = filtered.filter((student) => getInstitutionName(student) === filterInstitution);
    }

    // Apply grade filter
    if (filterGrade) {
      filtered = filtered.filter(student => student.grade === filterGrade);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.first_name || ""} ${a.last_name || ""}`.localeCompare(`${b.first_name || ""} ${b.last_name || ""}`);
        case "institution":
          return getInstitutionName(a).localeCompare(getInstitutionName(b));
        case "grade":
          return (a.grade || "").localeCompare(b.grade || "");
        case "dob":
          return new Date(a.dob || 0) - new Date(b.dob || 0);
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterInstitution, filterGrade, sortBy]);

  if (loading) return <div className="loading">Loading students...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="student-list">
      <h1>All Students</h1>
      
      <div className="filter-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by first name, last name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select 
            value={filterInstitution} 
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="filter-select"
          >
            <option value="">All Institutions</option>
            {institutions.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>

          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            className="filter-select"
          >
            <option value="">All Grades</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="institution">Sort by Institution</option>
            <option value="grade">Sort by Grade</option>
            <option value="dob">Sort by DOB</option>
          </select>

          {(searchTerm || filterInstitution || filterGrade) && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilterInstitution("");
                setFilterGrade("");
              }}
              className="reset-button"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Institution</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.uuid}>
                <td>{student.id}</td>
                <td><strong>{student.first_name} {student.last_name}</strong></td>
                <td>{student.primary_guardian_email}</td>
                <td>{student.gender}</td>
                <td>{student.dob}</td>
                <td><span className="institution-badge">{getInstitutionName(student)}</span></td>
                <td>{student.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-summary">
        <div>Showing {filteredStudents.length} of {students.length} students</div>
      </div>
    </div>
  );
};