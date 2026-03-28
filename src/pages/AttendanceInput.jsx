import React, { useState, useEffect } from 'react';
import { fetchStudents, fetchAttendanceMapping, recordAttendance } from '../apiCalls';
import '../pages/AttendanceInput.css';

const AttendanceInput = () => {
  const [students, setStudents] = useState([]);
  const [attendanceMapping, setAttendanceMapping] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [studentsData, mappingData] = await Promise.all([
          fetchStudents(),
          fetchAttendanceMapping()
        ]);
        setStudents(studentsData);
        setAttendanceMapping(mappingData);
        
        // Extract unique institutions
        const uniqueInstitutions = [...new Set(studentsData.map(s => s.institution_code || s.institution || 'Unknown'))].sort();
        setInstitutions(uniqueInstitutions);
        
        // Initialize attendance object
        const initialAttendance = {};
        studentsData.forEach(student => {
          initialAttendance[student.id] = '';
        });
        setAttendance(initialAttendance);
      } catch (err) {
        setError('Failed to load students and attendance data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
    setMessage('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      
      // Save all attendance records
      const promises = Object.entries(attendance)
        .filter(([_, status]) => status) // Only save if status is selected
        .map(([studentId, status]) =>
          recordAttendance(parseInt(studentId), selectedDate, status)
        );

      await Promise.all(promises);
      setMessage(`✓ Attendance saved for ${promises.length} students on ${selectedDate}`);
    } catch (err) {
      setError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading attendance interface...</div>;
  }

  return (
    <div className="attendance-page">
      <div className="attendance-controls-sidebar">
        <div className="sidebar-header">
          <h2>📋 Attendance</h2>
        </div>

        <div className="controls-section">
          <div className="control-group">
            <label>Institution:</label>
            <select 
              value={filterInstitution} 
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="institution-select"
            >
              <option value="">All Institutions</option>
              {institutions.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <button 
            className="save-button-sticky"
            onClick={handleSave}
            disabled={saving || Object.values(attendance).every(s => !s)}
          >
            {saving ? '⏳ Saving...' : '💾 Save Attendance'}
          </button>
        </div>

        <div className="attendance-stats-sidebar">
          <div className="stat-item">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{
              filterInstitution 
                ? students.filter(s => (s.institution_code || s.institution) === filterInstitution).length
                : students.length
            }</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Marked</div>
            <div className="stat-value marked">{
              filterInstitution
                ? students.filter(s => (s.institution_code || s.institution) === filterInstitution).filter(s => attendance[s.id]).length
                : Object.values(attendance).filter(s => s).length
            }</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Pending</div>
            <div className="stat-value pending">{
              filterInstitution
                ? students.filter(s => (s.institution_code || s.institution) === filterInstitution).filter(s => !attendance[s.id]).length
                : Object.values(attendance).filter(s => !s).length
            }</div>
          </div>
        </div>
      </div>

      <div className="attendance-main">
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Institution</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students
                .filter(student => 
                  (!filterInstitution || (student.institution_code || student.institution) === filterInstitution) &&
                  (!searchTerm ||
                  student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  student.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map(student => (
                <tr key={student.id}>
                  <td className="student-name">{student.first_name} {student.last_name}</td>
                  <td className="institution">{student.institution_code || student.institution}</td>
                  <td className="grade">{student.grade}</td>
                  <td className="status-selector">
                    <select
                      value={attendance[student.id] || ''}
                      onChange={(e) => handleStatusChange(student.id, e.target.value)}
                    >
                      <option value="">—</option>
                      {attendanceMapping.map(mapping => (
                        <option key={mapping.enum_code} value={mapping.enum_code}>
                          {mapping.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceInput;
