// API URL resolution:
// 1) explicit env var wins
// 2) local development uses localhost backend
// 3) deployed frontend falls back to same-origin /api
const API_BASE =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3080'
    : '');

// Token management
export const getToken = () => localStorage.getItem('authToken');
export const setToken = (token) => localStorage.setItem('authToken', token);
export const clearToken = () => localStorage.removeItem('authToken');
export const getRole = () => localStorage.getItem('userRole');
export const setRole = (role) => localStorage.setItem('userRole', role);

// Helper function to add Authorization header
const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Authentication
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    const data = await response.json();
    setToken(data.token);
    setRole(data.role);
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logout = () => {
  clearToken();
  localStorage.removeItem('userRole');
};

// Data fetching (protected endpoints)
export const fetchStudents = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/students`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const fetchInstitutionList = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/institutions`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch institutions');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
};

export const fetchInstitutionStudents = async (institutionName) => {
  try {
    const url = `${API_BASE}/api/institution/studentRoster?institution=${encodeURIComponent(institutionName)}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch institution students: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching institution students:', error);
    throw error;
  }
};

export const fetchGrades = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/grades`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch grades');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching grades:', error);
    throw error;
  }
};

export const fetchAttendance = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/attendance`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch attendance');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

export const fetchAttendanceMapping = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/attendance-mapping`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch attendance mapping');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching attendance mapping:', error);
    throw error;
  }
};

// New endpoints for data input
export const recordAttendance = async (studentId, date, status) => {
  try {
    const response = await fetch(`${API_BASE}/api/attendance/record`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        student_id: studentId,
        date: date,
        status: status
      })
    });
    if (!response.ok) {
      throw new Error('Failed to record attendance');
    }
    return await response.json();
  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
};

export const recordGrades = async (studentId, schoolYear, quarter, grades) => {
  try {
    const response = await fetch(`${API_BASE}/api/grades/record`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        student_id: studentId,
        school_year: schoolYear,
        grading_quarter: quarter,
        fine_motor: grades.fine_motor,
        gross_motor: grades.gross_motor,
        social_emotional: grades.social_emotional,
        early_literacy: grades.early_literacy,
        early_numeracy: grades.early_numeracy,
        independence: grades.independence
      })
    });
    if (!response.ok) {
      throw new Error('Failed to record grades');
    }
    return await response.json();
  } catch (error) {
    console.error('Error recording grades:', error);
    throw error;
  }
};

// Aggregated data endpoints for dashboards
const COMPETENCY_FIELDS = [
  'fine_motor',
  'gross_motor',
  'social_emotional',
  'early_literacy',
  'early_numeracy',
  'independence'
];

const parseQuarterValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const quarter = Math.trunc(value);
    return quarter >= 1 && quarter <= 4 ? quarter : 1;
  }

  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (match) {
      const quarter = Number(match[0]);
      return quarter >= 1 && quarter <= 4 ? quarter : 1;
    }
  }

  return 1;
};

const parseYearValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const yearMatch = value.match(/\d{4}/);
    if (yearMatch) {
      return Number(yearMatch[0]);
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return new Date().getFullYear();
};

const normalizeCompetencyLevel = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 80) return 'proficient';
    if (value >= 60) return 'developing';
    return 'emerging';
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'proficient' || normalized === 'developing' || normalized === 'emerging') {
    return normalized;
  }

  const numericValue = Number(normalized);
  if (!Number.isNaN(numericValue)) {
    if (numericValue >= 80) return 'proficient';
    if (numericValue >= 60) return 'developing';
    return 'emerging';
  }

  return null;
};

const createPresentStatusMatcher = (attendanceMapping) => {
  const presentCodes = new Set();
  if (Array.isArray(attendanceMapping)) {
    attendanceMapping.forEach((entry) => {
      const label = String(entry?.label ?? '').trim().toLowerCase();
      if (label.includes('present')) {
        presentCodes.add(String(entry?.enum_code ?? '').trim().toLowerCase());
      }
    });
  }

  return (status) => {
    const normalizedStatus = String(status ?? '').trim().toLowerCase();
    if (!normalizedStatus) return false;

    if (presentCodes.size > 0) {
      return presentCodes.has(normalizedStatus);
    }

    return ['1', 'p', 'present', 'true'].includes(normalizedStatus);
  };
};

const buildAdminDashboardFallbackStats = async () => {
  const [students, institutions, grades, attendance, attendanceMapping] = await Promise.all([
    fetchStudents(),
    fetchInstitutionList(),
    fetchGrades(),
    fetchAttendance(),
    fetchAttendanceMapping().catch(() => [])
  ]);

  const studentList = Array.isArray(students) ? students : [];
  const institutionList = Array.isArray(institutions) ? institutions : [];
  const gradeList = Array.isArray(grades) ? grades : [];
  const attendanceList = Array.isArray(attendance) ? attendance : [];

  const gradeSnapshots = gradeList.map((grade) => ({
    ...grade,
    _year: parseYearValue(grade.school_year),
    _quarter: parseQuarterValue(grade.grading_quarter)
  }));

  const sortedSnapshots = [...gradeSnapshots].sort(
    (a, b) => (b._year - a._year) || (b._quarter - a._quarter)
  );

  const currentYear = sortedSnapshots[0]?._year ?? new Date().getFullYear();
  const currentQuarter = sortedSnapshots[0]?._quarter ?? 1;

  const currentQuarterGrades = gradeSnapshots.filter(
    (grade) => grade._year === currentYear && grade._quarter === currentQuarter
  );

  const competencyDistribution = COMPETENCY_FIELDS.reduce((acc, field) => {
    acc[field] = { emerging: 0, developing: 0, proficient: 0, total: 0 };
    return acc;
  }, {});

  currentQuarterGrades.forEach((grade) => {
    COMPETENCY_FIELDS.forEach((field) => {
      const normalizedLevel = normalizeCompetencyLevel(grade[field]);
      if (!normalizedLevel) return;

      competencyDistribution[field].total += 1;
      competencyDistribution[field][normalizedLevel] += 1;
    });
  });

  const studentInstitutionById = new Map();
  const studentCountByInstitution = new Map();

  studentList.forEach((student) => {
    const studentId = String(student?.id ?? '');
    const institutionCode = String(student?.institution_code ?? '');

    if (studentId) {
      studentInstitutionById.set(studentId, institutionCode);
    }

    if (institutionCode) {
      studentCountByInstitution.set(
        institutionCode,
        (studentCountByInstitution.get(institutionCode) ?? 0) + 1
      );
    }
  });

  const isPresentStatus = createPresentStatusMatcher(attendanceMapping);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  let totalAttendanceRecords = 0;
  let totalPresentRecords = 0;
  const attendanceByInstitution = new Map();

  attendanceList.forEach((record) => {
    const recordDate = new Date(record?.date);
    if (Number.isNaN(recordDate.getTime()) || recordDate < cutoffDate) {
      return;
    }

    const studentId = String(record?.id ?? '');
    const institutionCode = studentInstitutionById.get(studentId);
    if (!institutionCode) {
      return;
    }

    const current = attendanceByInstitution.get(institutionCode) ?? { present: 0, total: 0 };
    current.total += 1;
    totalAttendanceRecords += 1;

    if (isPresentStatus(record?.status)) {
      current.present += 1;
      totalPresentRecords += 1;
    }

    attendanceByInstitution.set(institutionCode, current);
  });

  const avgAttendance = totalAttendanceRecords > 0
    ? Number(((totalPresentRecords / totalAttendanceRecords) * 100).toFixed(1))
    : 0;

  const institutionStats = institutionList.map((institution) => {
    const institutionCode = String(institution?.institution_code ?? '');
    const attendanceTotals = attendanceByInstitution.get(institutionCode) ?? { present: 0, total: 0 };

    const attendancePercent = attendanceTotals.total > 0
      ? Number(((attendanceTotals.present / attendanceTotals.total) * 100).toFixed(1))
      : 0;

    return {
      id: institution.id,
      institution_code: institutionCode,
      school: institution.school || institutionCode,
      student_count: studentCountByInstitution.get(institutionCode) ?? 0,
      attendance_percent: attendancePercent
    };
  });

  return {
    totalStudents: studentList.length,
    totalInstitutions: institutionList.length,
    avgAttendance,
    currentQuarter,
    currentYear,
    competencyDistribution,
    institutionStats
  };
};

export const fetchAdminDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to fetch admin dashboard stats (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.institutionStats) || !data.competencyDistribution) {
      throw new Error('Admin dashboard stats response is incomplete');
    }

    return data;
  } catch (error) {
    console.warn('Falling back to client-side admin dashboard stats:', error);
    try {
      return await buildAdminDashboardFallbackStats();
    } catch (fallbackError) {
      console.error('Error building fallback admin dashboard stats:', fallbackError);
      throw fallbackError;
    }
  }
};

export const fetchInstitutionDetail = async (institutionId) => {
  try {
    const response = await fetch(`${API_BASE}/api/institutions/${institutionId}/detail`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch institution detail');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching institution detail:', error);
    throw error;
  }
};

export const fetchStudentHistory = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE}/api/students/${studentId}/history`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch student history');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching student history:', error);
    throw error;
  }
};