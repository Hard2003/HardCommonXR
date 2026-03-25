import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

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
  const cacheStudents = useCallback((data) => {
    setCache(prev => ({ ...prev, students: data }));
  }, []);

  // Cache institutions data
  const cacheInstitutions = useCallback((data) => {
    setCache(prev => ({ ...prev, institutions: data }));
  }, []);

  // Cache institution-specific students
  const cacheInstitutionStudents = useCallback((institution, data) => {
    setCache(prev => ({ 
      ...prev, 
      institutionStudents: { 
        ...prev.institutionStudents, 
        [institution]: data 
      }
    }));
  }, []);

  // Get cached students
  const getCachedStudents = useCallback(() => cache.students, [cache.students]);

  // Get cached institutions
  const getCachedInstitutions = useCallback(() => cache.institutions, [cache.institutions]);

  // Get cached institution students
  const getCachedInstitutionStudents = useCallback(
    (institution) => cache.institutionStudents[institution] || null,
    [cache.institutionStudents]
  );

  // Clear all cache (useful for refresh)
  const clearCache = useCallback(() => {
    setCache({
      students: null,
      institutions: null,
      institutionStudents: {}
    });
  }, []);

  const value = useMemo(
    () => ({
      cacheStudents,
      cacheInstitutions,
      cacheInstitutionStudents,
      getCachedStudents,
      getCachedInstitutions,
      getCachedInstitutionStudents,
      clearCache,
    }),
    [
      cacheStudents,
      cacheInstitutions,
      cacheInstitutionStudents,
      getCachedStudents,
      getCachedInstitutions,
      getCachedInstitutionStudents,
      clearCache,
    ]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};