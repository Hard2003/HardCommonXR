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
    institutionStudents: {},
    grades: null,
    attendance: null,
    attendanceMapping: null,
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

  // Cache grades data
  const cacheGrades = useCallback((data) => {
    setCache(prev => ({ ...prev, grades: data }));
  }, []);

  // Cache attendance data
  const cacheAttendance = useCallback((data) => {
    setCache(prev => ({ ...prev, attendance: data }));
  }, []);

  // Cache attendance mapping
  const cacheAttendanceMapping = useCallback((data) => {
    setCache(prev => ({ ...prev, attendanceMapping: data }));
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

  // Get cached grades
  const getCachedGrades = useCallback(() => cache.grades, [cache.grades]);

  // Get cached attendance
  const getCachedAttendance = useCallback(() => cache.attendance, [cache.attendance]);

  // Get cached attendance mapping
  const getCachedAttendanceMapping = useCallback(
    () => cache.attendanceMapping,
    [cache.attendanceMapping]
  );

  // Clear all cache (useful for refresh)
  const clearCache = useCallback(() => {
    setCache({
      students: null,
      institutions: null,
      institutionStudents: {},
      grades: null,
      attendance: null,
      attendanceMapping: null,
    });
  }, []);

  const value = useMemo(
    () => ({
      cacheStudents,
      cacheInstitutions,
      cacheInstitutionStudents,
      cacheGrades,
      cacheAttendance,
      cacheAttendanceMapping,
      getCachedStudents,
      getCachedInstitutions,
      getCachedInstitutionStudents,
      getCachedGrades,
      getCachedAttendance,
      getCachedAttendanceMapping,
      clearCache,
    }),
    [
      cacheStudents,
      cacheInstitutions,
      cacheInstitutionStudents,
      cacheGrades,
      cacheAttendance,
      cacheAttendanceMapping,
      getCachedStudents,
      getCachedInstitutions,
      getCachedInstitutionStudents,
      getCachedGrades,
      getCachedAttendance,
      getCachedAttendanceMapping,
      clearCache,
    ]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};