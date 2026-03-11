import React, { createContext, useContext, useState } from 'react';

// Create context for data caching
const DataContext = createContext();

// Custom hook to use the data context
export const useDataCache = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataProvider');
  }
  return context;
};

// Data provider component
export const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({
    students: null,
    institutions: null,
    institutionStudents: {}
  });

  // Cache students data
  const cacheStudents = (data) => {
    setCache(prev => ({ ...prev, students: data }));
  };

  // Cache institutions data
  const cacheInstitutions = (data) => {
    setCache(prev => ({ ...prev, institutions: data }));
  };

  // Cache institution-specific students
  const cacheInstitutionStudents = (institution, data) => {
    setCache(prev => ({ 
      ...prev, 
      institutionStudents: { 
        ...prev.institutionStudents, 
        [institution]: data 
      }
    }));
  };

  // Get cached students
  const getCachedStudents = () => cache.students;

  // Get cached institutions
  const getCachedInstitutions = () => cache.institutions;

  // Get cached institution students
  const getCachedInstitutionStudents = (institution) => {
    return cache.institutionStudents[institution] || null;
  };

  // Clear all cache (useful for refresh)
  const clearCache = () => {
    setCache({
      students: null,
      institutions: null,
      institutionStudents: {}
    });
  };

  const value = {
    cacheStudents,
    cacheInstitutions,
    cacheInstitutionStudents,
    getCachedStudents,
    getCachedInstitutions,
    getCachedInstitutionStudents,
    clearCache
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};