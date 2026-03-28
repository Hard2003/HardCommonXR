import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchInstitutionStudents } from "../apiCalls";
import { useDataCache } from "../context/DataContext";

export default function InstitutionStudentRoster() {
  const { institution } = useParams();
  const { getCachedInstitutionStudents, cacheInstitutionStudents } = useDataCache();
  const initialStudents = institution ? (getCachedInstitutionStudents(institution) || []) : [];

  const [students, setStudents] = useState(initialStudents);
  const [loading, setLoading] = useState(initialStudents.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInstitutionStudents = async () => {
      try {
        console.log('Loading students for institution:', institution);
        
        // Check cache first
        const cachedData = getCachedInstitutionStudents(institution);
        if (cachedData) {
          console.log('Found cached data:', cachedData.length, 'students');
          setStudents(cachedData);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
  setLoading(true);
        console.log('Fetching from API for institution:', institution);
        const data = await fetchInstitutionStudents(institution);
        console.log('API returned:', data.length, 'students');
        setStudents(data);
        cacheInstitutionStudents(institution, data);
      } catch (err) {
        console.error('Error loading institution students:', err);
        setError('Failed to load students: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (institution) {
      loadInstitutionStudents();
    }
  }, [institution, getCachedInstitutionStudents, cacheInstitutionStudents]);

  if (loading) return <div className="loading">Loading students for {institution}...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="institution-student-roster">
      <div className="header-section">
        <Link to="/institutions" className="back-btn">← Back to Institutions</Link>
        <h1>Students in {institution.toUpperCase()} Institution</h1>
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
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={student.uuid}>
                  <td>{student.id}</td>
                  <td>{student.first_name} {student.last_name}</td>
                  <td>{student.primary_guardian_email}</td>
                  <td>{student.gender}</td>
                  <td>{student.dob}</td>
                  <td>{student.grade}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No students found for this institution</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="table-summary">
        Total Students in {institution}: {students.length}
      </div>
    </div>
  );
}