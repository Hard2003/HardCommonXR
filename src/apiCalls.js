// API URL - switches between local development and Railway production
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3080';

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
export const fetchAdminDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch admin dashboard stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    throw error;
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