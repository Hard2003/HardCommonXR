import React, { useState, useEffect, useCallback } from "react";
import Plotly from "plotly.js-basic-dist-min";
import "../SimpleDashboard.css";
import { 
  fetchStudents, 
  fetchInstitutionList, 
  fetchGrades, 
  fetchAttendance, 
  fetchAttendanceMapping 
} from "../apiCalls";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    students: [],
    institutions: [],
    grades: [],
    attendance: [],
    attendanceMapping: []
  });
  const [userRole, setUserRole] = useState('admin');

  // Function to refetch all data (can be called after changes)
  const refetchData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);
      const [students, institutions, grades, attendance, attendanceMapping] = await Promise.all([
        fetchStudents(),
        fetchInstitutionList(),
        fetchGrades(),
        fetchAttendance(),
        fetchAttendanceMapping()
      ]);

      setData({ students, institutions, grades, attendance, attendanceMapping });

      // Create charts after data is loaded
      setTimeout(() => {
        if (userRole === 'admin') {
          createAdminChart(students, institutions);
          createAdminAttendanceChart(attendance, attendanceMapping);
          createGradeLevelChart(students);
          createSystemTrendsChart(grades);
        } else {
          createTeacherPerformanceChart(grades);
          createTeacherAttendanceChart(attendance, attendanceMapping);
          createQuarterlyComparisonChart(grades);
        }
      }, 100);

    } catch (err) {
      if (showLoader) {
        setError('Failed to load dashboard data');
      } else {
        console.error('Failed to refresh dashboard data:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole]);

  useEffect(() => {
    refetchData(true);
  }, [userRole, refetchData]);

  useEffect(() => {
    if (data.students.length > 0) {
      // Clear all previous plots before recreating
      try {
        if (document.getElementById('admin-chart')) Plotly.purge('admin-chart');
        if (document.getElementById('admin-attendance-chart')) Plotly.purge('admin-attendance-chart');
        if (document.getElementById('admin-grade-chart')) Plotly.purge('admin-grade-chart');
        if (document.getElementById('admin-trends-chart')) Plotly.purge('admin-trends-chart');
        if (document.getElementById('teacher-performance-chart')) Plotly.purge('teacher-performance-chart');
        if (document.getElementById('teacher-attendance-chart')) Plotly.purge('teacher-attendance-chart');
        if (document.getElementById('teacher-quarterly-chart')) Plotly.purge('teacher-quarterly-chart');
      } catch (e) {
        // Ignore purge errors
      }

      // Recreate charts when role changes
      setTimeout(() => {
        if (userRole === 'admin') {
          createAdminChart(data.students, data.institutions);
          createAdminAttendanceChart(data.attendance, data.attendanceMapping);
          createGradeLevelChart(data.students);
          createSystemTrendsChart(data.grades);
        } else {
          createTeacherPerformanceChart(data.grades);
          createTeacherAttendanceChart(data.attendance, data.attendanceMapping);
          createQuarterlyComparisonChart(data.grades);
        }
      }, 50);
    }
  }, [userRole, data]);

  // Admin Chart: Institution Overview
  const createAdminChart = (students, institutions) => {
    const institutionData = institutions.map(inst => {
      const studentCount = students.filter(s => s.institution_code === inst.institution_code).length;
      const institutionName = inst.school || inst.institution || inst.institution_code || 'Unknown';
      return {
        institution: institutionName.toUpperCase(),
        students: studentCount,
        principal: inst.principal,
        district: inst.district
      };
    });

    const trace = {
      x: institutionData.map(d => d.institution),
      y: institutionData.map(d => d.students),
      type: 'bar',
      marker: { 
        color: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],
      },
      text: institutionData.map(d => `${d.students} students<br>Principal: ${d.principal}`),
      hovertemplate: '%{x}<br>%{text}<extra></extra>'
    };

    Plotly.newPlot('admin-chart', [trace], {
      title: { text: 'Institution Enrollment Overview', font: { size: 20 } },
      xaxis: { title: 'Institution', titlefont: { size: 14 } },
      yaxis: { title: 'Number of Students', titlefont: { size: 14 } },
      font: { family: 'Arial, sans-serif' },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white'
    });
  };

  // Admin Attendance Chart
  const createAdminAttendanceChart = (attendance, attendanceMapping) => {
    const monthlyStats = {};
    
    attendance.forEach(record => {
      if (!record.date) return;
      const date = new Date(record.date);
      if (Number.isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { total: 0, present: 0 };
      }
      
      monthlyStats[monthKey].total++;
      if (record.status === 1 || record.status === '1') { // Present
        monthlyStats[monthKey].present++;
      }
    });

    const months = Object.keys(monthlyStats).sort();
    
    const attendanceTrace = {
      x: months,
      y: months.map(month => (monthlyStats[month].present / monthlyStats[month].total * 100).toFixed(1)),
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#2ecc71', width: 4 },
      marker: { size: 10, color: '#27ae60' },
      fill: 'tonexty'
    };

    Plotly.newPlot('admin-attendance-chart', [attendanceTrace], {
      title: { text: 'System-Wide Attendance Trends', font: { size: 20 } },
      xaxis: { title: 'Month', titlefont: { size: 14 } },
      yaxis: { title: 'Attendance Rate (%)', range: [0, 100], titlefont: { size: 14 } },
      font: { family: 'Arial, sans-serif' },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white'
    });
  };

  // Teacher Performance Chart
  const createTeacherPerformanceChart = (grades) => {
    const subjects = ['fine_motor', 'gross_motor', 'social_emotional', 'early_literacy', 'early_numeracy', 'independence'];
    
    // Calculate average performance for each subject
    const subjectAverages = subjects.map(subject => {
      const subjectGrades = grades.filter(g => g[subject]);
      const total = subjectGrades.reduce((sum, grade) => {
        const score = grade[subject] === 'Emerging' ? 1 : 
                     grade[subject] === 'Developing' ? 2 : 3;
        return sum + score;
      }, 0);
      return subjectGrades.length > 0 ? (total / subjectGrades.length).toFixed(2) : 0;
    });

    const trace = {
      x: subjects.map(s => s.replace('_', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)).join(' ')),
      y: subjectAverages,
      type: 'bar',
      marker: { 
        color: ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'],
      }
    };

    Plotly.newPlot('teacher-performance-chart', [trace], {
      title: { text: 'Student Performance by Developmental Area', font: { size: 20 } },
      xaxis: { title: 'Developmental Areas', titlefont: { size: 14 } },
      yaxis: { title: 'Performance Level (1-3)', range: [1, 3], titlefont: { size: 14 } },
      font: { family: 'Arial, sans-serif' },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white'
    });
  };

  // Teacher Attendance Chart
  const createTeacherAttendanceChart = (attendance, attendanceMapping) => {
    const dailyAttendance = {};
    
    attendance.forEach(record => {
      if (!record.date) return;
      if (!dailyAttendance[record.date]) {
        dailyAttendance[record.date] = { total: 0, present: 0 };
      }
      dailyAttendance[record.date].total++;
      if (record.status === 1 || record.status === '1') { // Present
        dailyAttendance[record.date].present++;
      }
    });

    const dates = Object.keys(dailyAttendance).sort().slice(-30); // Last 30 days
    
    const trace = {
      x: dates,
      y: dates.map(date => (dailyAttendance[date].present / dailyAttendance[date].total * 100).toFixed(1)),
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#3498db', width: 3 },
      marker: { size: 8, color: '#2980b9' },
      fill: 'tozeroy',
      fillcolor: 'rgba(52, 152, 219, 0.3)'
    };

    Plotly.newPlot('teacher-attendance-chart', [trace], {
      title: { text: 'Daily Class Attendance (Last 30 Days)', font: { size: 20 } },
      xaxis: { title: 'Date', titlefont: { size: 14 } },
      yaxis: { title: 'Attendance Rate (%)', range: [0, 100], titlefont: { size: 14 } },
      font: { family: 'Arial, sans-serif' },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white'
    });
  };

  // Admin Grade Level Distribution Chart
  const createGradeLevelChart = (students) => {
    const gradeCounts = {};
    students.forEach(student => {
      const grade = student.grade || 'Unknown';
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });

    const trace = {
      labels: Object.keys(gradeCounts),
      values: Object.values(gradeCounts),
      type: 'pie',
      hole: 0.4,
      marker: {
        colors: ['#ff9f43', '#10ac84', '#54a0ff', '#5f27cd', '#00d2d3', '#ff6b6b']
      },
      textinfo: 'label+percent',
      textposition: 'outside'
    };

    Plotly.newPlot('admin-grade-chart', [trace], {
      title: { text: 'Grade Level Distribution', font: { size: 20 } },
      font: { family: 'Arial, sans-serif' },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white'
    });
  };

  // Admin System Performance Trends Chart
  const createSystemTrendsChart = (grades) => {
    const quarterData = {};
    
    grades.forEach(grade => {
      const quarter = grade.grading_quarter;
      if (!quarterData[quarter]) {
        quarterData[quarter] = { total: 0, proficient: 0 };
      }
      
      const subjects = ['fine_motor', 'gross_motor', 'social_emotional', 'early_literacy', 'early_numeracy', 'independence'];
      subjects.forEach(subject => {
        quarterData[quarter].total++;
        if (grade[subject] === 'Proficient') {
          quarterData[quarter].proficient++;
        }
      });
    });

    const quarters = Object.keys(quarterData).sort();
    const proficiencyRates = quarters.map(q => 
      ((quarterData[q].proficient / quarterData[q].total) * 100).toFixed(1)
    );

    const trace = {
      x: quarters.map(q => `Q${q}`),
      y: proficiencyRates,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#27ae60', width: 4 },
      marker: { size: 12, color: '#2ecc71' },
      fill: 'tozeroy',
      fillcolor: 'rgba(39, 174, 96, 0.3)'
    };

    Plotly.newPlot('admin-trends-chart', [trace], {
      title: { text: 'System-Wide Proficiency Trends', font: { size: 20 } },
      xaxis: { title: 'Quarter', titlefont: { size: 14 } },
      yaxis: { title: 'Proficiency Rate (%)', range: [0, 100], titlefont: { size: 14 } },
      font: { family: 'Arial, sans-serif' },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white'
    });
  };

  // Teacher Quarterly Comparison Chart
  const createQuarterlyComparisonChart = (grades) => {
    const quarters = [1, 2, 3, 4];
    
    const quarterAverages = quarters.map(quarter => {
      const quarterGrades = grades.filter(g => g.grading_quarter === quarter);
      let totalScore = 0;
      let totalCount = 0;
      
      const subjects = ['fine_motor', 'gross_motor', 'social_emotional', 'early_literacy', 'early_numeracy', 'independence'];
      subjects.forEach(subject => {
        quarterGrades.forEach(grade => {
          if (grade[subject]) {
            const score = grade[subject] === 'Emerging' ? 1 : 
                         grade[subject] === 'Developing' ? 2 : 3;
            totalScore += score;
            totalCount++;
          }
        });
      });
      
      return totalCount > 0 ? (totalScore / totalCount).toFixed(2) : 0;
    });

    const trace = {
      x: quarters.map(q => `Quarter ${q}`),
      y: quarterAverages,
      type: 'bar',
      marker: { 
        color: quarterAverages.map((avg, i) => {
          const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db'];
          return colors[i];
        })
      },
      text: quarterAverages.map(avg => avg),
      textposition: 'auto'
    };

    Plotly.newPlot('teacher-quarterly-chart', [trace], {
      title: { text: 'Class Performance Improvement by Quarter', font: { size: 20 } },
      xaxis: { title: 'Quarter', titlefont: { size: 14 } },
      yaxis: { title: 'Average Performance Level', range: [1, 3], titlefont: { size: 14 } },
      font: { family: 'Arial, sans-serif' },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white'
    });
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>
  );
  
  if (error) return (
    <div className="dashboard-error">
      <h3>⚠️ Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="simple-dashboard">
      <div className="dashboard-header">
        <h1>📊 Analytics Dashboard</h1>
        <div className="header-controls">
          <div className="role-toggle">
            <label>View as:</label>
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)} 
              className="role-select"
            >
              <option value="admin">👨‍💼 Administrator</option>
              <option value="teacher">👩‍🏫 Teacher</option>
            </select>
          </div>
          <button 
            onClick={() => refetchData(false)}
            disabled={loading || refreshing}
            className="refresh-button"
            title="Refresh data from server"
          >
            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-number">{data.students.length}</div>
          <div className="summary-label">Total Students</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{data.institutions.length}</div>
          <div className="summary-label">Institutions</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">
            {data.attendance.length > 0 ? 
              ((data.attendance.filter(a => a.status === 1 || a.status === '1').length / data.attendance.length) * 100).toFixed(1) + '%'
              : 'N/A'
            }
          </div>
          <div className="summary-label">Attendance Rate</div>
        </div>
      </div>

      {userRole === 'admin' && (
        <div className="admin-dashboard">
          <div className="dashboard-section-header">
            <h2>🏛️ Administrator View</h2>
            <p>Strategic insights for institutional management and resource planning</p>
          </div>
          
          <div className="charts-grid">
            <div className="chart-card">
              <div id="admin-chart" className="chart-container"></div>
            </div>
            <div className="chart-card">
              <div id="admin-attendance-chart" className="chart-container"></div>
            </div>
            <div className="chart-card">
              <div id="admin-grade-chart" className="chart-container"></div>
            </div>
            <div className="chart-card">
              <div id="admin-trends-chart" className="chart-container"></div>
            </div>
          </div>
        </div>
      )}

      {userRole === 'teacher' && (
        <div className="teacher-dashboard">
          <div className="dashboard-section-header">
            <h2>👩‍🏫 Teacher View</h2>
            <p>Detailed insights for student development and classroom management</p>
          </div>
          
          <div className="charts-grid">
            <div className="chart-card">
              <div id="teacher-performance-chart" className="chart-container"></div>
            </div>
            <div className="chart-card">
              <div id="teacher-attendance-chart" className="chart-container"></div>
            </div>
            <div className="chart-card">
              <div id="teacher-quarterly-chart" className="chart-container"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}