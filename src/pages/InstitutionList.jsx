import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchInstitutionList } from "../apiCalls";
import { useDataCache } from "../context/DataContext";

export default function InstitutionList() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getCachedInstitutions, cacheInstitutions } = useDataCache();

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = getCachedInstitutions();
        if (cachedData) {
          setInstitutions(cachedData);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const data = await fetchInstitutionList();
        setInstitutions(data);
        cacheInstitutions(data);
      } catch (err) {
        setError('Failed to load institutions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInstitutions();
  }, [getCachedInstitutions, cacheInstitutions]);

  if (loading) return <div className="loading">Loading institutions...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="institutionList">
      <h1>All Institutions</h1>
      <div className="table-container">
        <table className="institutions-table">
          <thead>
            <tr>
              <th>Institution</th>
              <th>School Name</th>
              <th>Principal</th>
              <th>Phone</th>
              <th>Address</th>
              <th>City</th>
              <th>District</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map((institution, index) => (
              <tr key={index}>
                <td>{institution.institution}</td>
                <td>{institution.school}</td>
                <td>{institution.principal}</td>
                <td>{institution.phone}</td>
                <td>{institution.address}</td>
                <td>{institution.city}</td>
                <td>{institution.district}</td>
                <td>
                  <Link 
                    to={`/${institution.institution}/studentlist`}
                    className="view-students-btn"
                  >
                    View Students
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-summary">
        Total Institutions: {institutions.length}
      </div>
    </div>
  );
};