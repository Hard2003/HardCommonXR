import React, { useState, useEffect } from 'react';
import { fetchStudents, recordGrades, fetchGrades } from '../apiCalls';
import '../pages/GradesInput.css';

const GradesInput = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [schoolYear, setSchoolYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState('Q1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [grades, setGrades] = useState({
    fine_motor: '',
    gross_motor: '',
    social_emotional: '',
    early_literacy: '',
    early_numeracy: '',
    independence: ''
  });

  const gradeCategories = [
    { key: 'fine_motor', label: 'Fine Motor Skills' },
    { key: 'gross_motor', label: 'Gross Motor Skills' },
    { key: 'social_emotional', label: 'Social Emotional' },
    { key: 'early_literacy', label: 'Early Literacy' },
    { key: 'early_numeracy', label: 'Early Numeracy' },
    { key: 'independence', label: 'Independence' }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(false);
        const studentsData = await fetchStudents();
        setStudents(studentsData);
        if (studentsData.length > 0) {
          setSelectedStudent(studentsData[0].id);
        }
      } catch (err) {
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGradeChange = (category, value) => {
    // Only allow numbers 0-100
    let numValue = value;
    if (value === '') {
      numValue = '';
    } else {
      numValue = parseInt(value) || 0;
      if (numValue > 100) numValue = 100;
      if (numValue < 0) numValue = 0;
    }
    
    setGrades(prev => ({
      ...prev,
      [category]: numValue
    }));
    setMessage('');
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    // Check if at least one grade is entered
    const hasGrade = Object.values(grades).some(g => g !== '');
    if (!hasGrade) {
      setError('Please enter at least one grade');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      
      const student = students.find(s => s.id === parseInt(selectedStudent));
      
      await recordGrades(selectedStudent, schoolYear.toString(), quarter, grades);
      
      setMessage(`✓ Grades saved for ${student.first_name} ${student.last_name} (${schoolYear} - ${quarter})`);
      
      // Clear form
      setGrades({
        fine_motor: '',
        gross_motor: '',
        social_emotional: '',
        early_literacy: '',
        early_numeracy: '',
        independence: ''
      });
    } catch (err) {
      setError('Failed to save grades: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setGrades({
      fine_motor: '',
      gross_motor: '',
      social_emotional: '',
      early_literacy: '',
      early_numeracy: '',
      independence: ''
    });
    setMessage('');
  };

  if (loading) {
    return <div className="loading">Loading grades interface...</div>;
  }

  const currentStudent = students.find(s => s.id === parseInt(selectedStudent));

  return (
    <div className="grades-input-container">
      <h2>Record Student Grades</h2>

      <div className="grades-form">
        {/* Selection Section */}
        <div className="form-section">
          <h3>1. Select Student</h3>
          <div className="form-group full-width">
            <label>Student Name:</label>
            <select 
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value);
                setGrades({
                  fine_motor: '',
                  gross_motor: '',
                  social_emotional: '',
                  early_literacy: '',
                  early_numeracy: '',
                  independence: ''
                });
                setMessage('');
              }}
              className="student-select"
            >
              <option value="">-- Select a Student --</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.institution}
                </option>
              ))}
            </select>
          </div>

          {currentStudent && (
            <div className="student-info">
              <div className="info-item">
                <span className="label">Grade Level:</span>
                <span className="value">{currentStudent.grade}</span>
              </div>
              <div className="info-item">
                <span className="label">Institution:</span>
                <span className="value">{currentStudent.institution}</span>
              </div>
            </div>
          )}
        </div>

        {/* Period Section */}
        <div className="form-section">
          <h3>2. Select Period</h3>
          <div className="period-controls">
            <div className="form-group">
              <label>School Year:</label>
              <input
                type="number"
                value={schoolYear}
                onChange={(e) => setSchoolYear(parseInt(e.target.value))}
                min="2020"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div className="form-group">
              <label>Quarter:</label>
              <select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grades Section */}
        <div className="form-section">
          <h3>3. Enter Grades (0-100)</h3>
          <div className="grades-input-grid">
            {gradeCategories.map(category => (
              <div key={category.key} className="grade-field">
                <label>{category.label}</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={grades[category.key]}
                    onChange={(e) => handleGradeChange(category.key, e.target.value)}
                    placeholder="0"
                    className="grade-number-input"
                  />
                  <span className="unit">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Grade Scale */}
        <div className="grade-scale-info">
          <h4>Grade Scale</h4>
          <div className="scale-items">
            <div className="scale-item">
              <span className="scale-range">90-100</span>
              <span className="scale-label">Excellent (A)</span>
            </div>
            <div className="scale-item">
              <span className="scale-range">80-89</span>
              <span className="scale-label">Good (B)</span>
            </div>
            <div className="scale-item">
              <span className="scale-range">70-79</span>
              <span className="scale-label">Satisfactory (C)</span>
            </div>
            <div className="scale-item">
              <span className="scale-range">Below 70</span>
              <span className="scale-label">Needs Improvement (D)</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="action-buttons">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={saving || !selectedStudent || !Object.values(grades).some(g => g !== '')}
          >
            {saving ? 'Saving...' : 'Save Grades'}
          </button>
          <button 
            className="clear-button"
            onClick={handleClear}
            disabled={saving}
          >
            Clear Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradesInput;
