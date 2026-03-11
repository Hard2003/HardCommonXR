export const fetchStudents = async () => {
  try {
    const response = await fetch('http://localhost:3080/api/students');
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}

export const fetchInstitutionList = async () => {
  try {
    const response = await fetch('http://localhost:3080/api/institutions');
    if (!response.ok) {
      throw new Error('Failed to fetch institutions');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
}

export const fetchInstitutionStudents = async (institutionName) => {
  try {
    const url = `http://localhost:3080/api/institution/studentRoster?institution=${encodeURIComponent(institutionName)}`;
    console.log('Fetching from URL:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`Failed to fetch institution students: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching institution students:', error);
    throw error;
  }
}

export const fetchStudentData = async (studentName) => {
  // 4 url path api/studentRoster
  return []
}

// Additional API calls for comprehensive dashboard data
export const fetchGrades = async () => {
  try {
    const response = await fetch('http://localhost:3080/api/grades');
    if (!response.ok) {
      throw new Error('Failed to fetch grades');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching grades:', error);
    throw error;
  }
}

export const fetchAttendance = async () => {
  try {
    const response = await fetch('http://localhost:3080/api/attendance');
    if (!response.ok) {
      throw new Error('Failed to fetch attendance');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}

export const fetchAttendanceMapping = async () => {
  try {
    const response = await fetch('http://localhost:3080/api/attendance-mapping');
    if (!response.ok) {
      throw new Error('Failed to fetch attendance mapping');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching attendance mapping:', error);
    throw error;
  }
}