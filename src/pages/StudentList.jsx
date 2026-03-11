import React, { useState, useEffect } from "react";
import { fetchStudents } from "../apiCalls";
import { useDataCache } from "../context/DataContext";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getCachedStudents, cacheStudents } = useDataCache();

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = getCachedStudents();
        if (cachedData) {
          setStudents(cachedData);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const data = await fetchStudents();
        setStudents(data);
        cacheStudents(data);
      } catch (err) {
        setError('Failed to load students');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [getCachedStudents, cacheStudents]);

  if (loading) return <div className="loading">Loading students...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="student-list">
      <h1>All Students</h1>
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
            {students.map((student) => (
              <tr key={student.uuid}>
                <td>{student.id}</td>
                <td>{student.first_name} {student.last_name}</td>
                <td>{student.primary_guardian_email}</td>
                <td>{student.gender}</td>
                <td>{student.dob}</td>
                <td>{student.institution}</td>
                <td>{student.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-summary">
        Total Students: {students.length}
      </div>
    </div>
  );
};