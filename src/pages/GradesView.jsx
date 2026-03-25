import React, { useState, useEffect } from 'react';
import { fetchGrades, fetchStudents } from '../apiCalls';
import './GradesView.css';

const GradesView = () => {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [sortBy, setSortBy] = useState('student');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [gradesData, studentsData] = await Promise.all([
          fetchGrades(),
          fetchStudents()
        ]);
        setGrades(gradesData);
        setStudents(studentsData);
      } catch (err) {
        setError('Failed to load grades data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = grades.map(grade => {
      const student = students.find(s => s.id === grade.id);
      return {
        ...grade,
        studentName: student ? `${student.first_name} ${student.last_name}` : `Student ${grade.id}`,
        studentInfo: student
      };
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply student filter
    if (filterStudent) {
      filtered = filtered.filter(g => g.id.toString() === filterStudent);
    }

    // Apply quarter filter
    if (filterQuarter) {
      filtered = filtered.filter(g => g.grading_quarter.toString() === filterQuarter);
    }

    // Apply year filter
    if (filterYear) {
      filtered = filtered.filter(g => g.school_year.toString() === filterYear);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'student':
          return a.studentName.localeCompare(b.studentName);
        case 'year':
          return b.school_year - a.school_year;
        case 'quarter':
          return a.grading_quarter - b.grading_quarter;
        default:
          return 0;
      }
    });

    setFilteredGrades(filtered);
  }, [grades, students, searchTerm, filterStudent, filterQuarter, filterYear, sortBy]);

  const getGradeColor = (gradeText) => {
    switch (gradeText) {
      case 'Proficient':
        return '#27ae60';
      case 'Developing':
        return '#f39c12';
      case 'Emerging':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const uniqueStudents = [...new Set(grades.map(g => g.id))].sort();
  const uniqueQuarters = [...new Set(grades.map(g => g.grading_quarter))].sort((a, b) => a - b);
  const uniqueYears = [...new Set(grades.map(g => g.school_year))].sort((a, b) => b - a);

  if (loading) return <div className="loading">Loading grades...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="grades-view">
      <h1>Student Grades</h1>

      <div className="filter-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by student name..."
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

        <div className="filter-row">
          <div className="filter-group">
            <label>Student:</label>
            <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="filter-select">
              <option value="">All Students</option>
              {uniqueStudents.map(studentId => {
                const student = students.find(s => s.id === studentId);
                return (
                  <option key={studentId} value={studentId}>
                    {student ? `${student.first_name} ${student.last_name}` : `Student ${studentId}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-group">
            <label>Quarter:</label>
            <select value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)} className="filter-select">
              <option value="">All Quarters</option>
              {uniqueQuarters.map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>School Year:</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="filter-select">
              <option value="">All Years</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="student">Student Name</option>
              <option value="year">School Year</option>
              <option value="quarter">Quarter</option>
            </select>
          </div>

          {(searchTerm || filterStudent || filterQuarter || filterYear) && (
            <button 
              className="reset-button"
              onClick={() => {
                setSearchTerm('');
                setFilterStudent('');
                setFilterQuarter('');
                setFilterYear('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredGrades.length === 0 ? (
        <div className="no-data">No grades found matching your filters.</div>
      ) : (
        <div className="grades-container">
          {filteredGrades.map((gradeRecord, idx) => (
            <div key={idx} className="grade-card">
              <div className="card-header">
                <div className="student-info">
                  <h3>{gradeRecord.studentName}</h3>
                  {gradeRecord.studentInfo && (
                    <p className="student-details">
                      Grade {gradeRecord.studentInfo.grade} • {gradeRecord.studentInfo.institution}
                    </p>
                  )}
                </div>
                <div className="period-badge">
                  {gradeRecord.school_year} - Q{gradeRecord.grading_quarter}
                </div>
              </div>

              <div className="grades-grid">
                <GradeItem label="Fine Motor" value={gradeRecord.fine_motor} color={getGradeColor(gradeRecord.fine_motor)} />
                <GradeItem label="Gross Motor" value={gradeRecord.gross_motor} color={getGradeColor(gradeRecord.gross_motor)} />
                <GradeItem label="Social Emotional" value={gradeRecord.social_emotional} color={getGradeColor(gradeRecord.social_emotional)} />
                <GradeItem label="Early Literacy" value={gradeRecord.early_literacy} color={getGradeColor(gradeRecord.early_literacy)} />
                <GradeItem label="Early Numeracy" value={gradeRecord.early_numeracy} color={getGradeColor(gradeRecord.early_numeracy)} />
                <GradeItem label="Independence" value={gradeRecord.independence} color={getGradeColor(gradeRecord.independence)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grades-summary">
        <div>Showing {filteredGrades.length} of {grades.length} grade records</div>
      </div>
    </div>
  );
};

const GradeItem = ({ label, value, color }) => {
  return (
    <div className="grade-item">
      <div className="grade-label">{label}</div>
      <div className="grade-badge" style={{ backgroundColor: color }}>
        {value}
      </div>
    </div>
  );
};

export default GradesView;
