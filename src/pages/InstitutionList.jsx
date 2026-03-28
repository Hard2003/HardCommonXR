import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchInstitutionList } from "../apiCalls";
import { useDataCache } from "../context/DataContext";
import "./InstitutionList.css";

export default function InstitutionList() {
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [districts, setDistricts] = useState([]);
  const { getCachedInstitutions, cacheInstitutions } = useDataCache();

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = getCachedInstitutions();
        if (cachedData) {
          setInstitutions(cachedData);
          extractFilters(cachedData);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const data = await fetchInstitutionList();
        setInstitutions(data);
        cacheInstitutions(data);
        extractFilters(data);
      } catch (err) {
        setError('Failed to load institutions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInstitutions();
  }, [getCachedInstitutions, cacheInstitutions]);

  const extractFilters = (data) => {
    const uniqueDistricts = [...new Set(data.map(i => i.district))].sort();
    setDistricts(uniqueDistricts);
  };

  useEffect(() => {
    let filtered = institutions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(inst =>
        (inst.school || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.principal || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.institution_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.city || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply district filter
    if (filterDistrict) {
      filtered = filtered.filter(inst => inst.district === filterDistrict);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.school || "").localeCompare(b.school || "");
        case "district":
          return (a.district || "").localeCompare(b.district || "");
        case "city":
          return (a.city || "").localeCompare(b.city || "");
        default:
          return 0;
      }
    });

    setFilteredInstitutions(filtered);
  }, [institutions, searchTerm, filterDistrict, sortBy]);

  if (loading) return <div className="loading">Loading institutions...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="institutionList">
      <h1>All Institutions</h1>
      
      <div className="filter-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by school name, principal, code, or city..."
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
            value={filterDistrict} 
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="filter-select"
          >
            <option value="">All Districts</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">Sort by School Name</option>
            <option value="district">Sort by District</option>
            <option value="city">Sort by City</option>
          </select>

          {(searchTerm || filterDistrict) && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilterDistrict("");
              }}
              className="reset-button"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

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
            {filteredInstitutions.map((institution) => (
              <tr key={institution.id || institution.institution_code}>
                <td><span className="institution-code">{institution.institution_code}</span></td>
                <td><strong>{institution.school}</strong></td>
                <td>{institution.principal}</td>
                <td>{institution.phone}</td>
                <td>{institution.address}</td>
                <td>{institution.city}</td>
                <td>{institution.district}</td>
                <td>
                  <Link 
                    to={`/${institution.institution_code}/studentlist`}
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
        <div>Showing {filteredInstitutions.length} of {institutions.length} institutions</div>
      </div>
    </div>
  );
};