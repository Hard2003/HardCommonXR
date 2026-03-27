import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import './App.css';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import InstitutionList from "./pages/InstitutionList";
import StudentList from "./pages/StudentList";
import InstitutionStudentRoster from "./pages/InstitutionStudentRoster";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import InstitutionDetailPage from "./pages/InstitutionDetailPage";
import GradeDetailPage from "./pages/GradeDetailPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import AttendanceInput from "./pages/AttendanceInput";
import GradesInput from "./pages/GradesInput";
import GradesView from "./pages/GradesView";
import { DataProvider } from "./context/DataContext";
import { getToken, getRole } from "./apiCalls";

// Private Route component for protected pages
const PrivateRoute = ({ children }) => {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
};

// Role-based Dashboard Router
const DashboardRouter = () => {
  const role = getRole();
  
  if (role === 'admin') {
    return <AdminDashboard />;
  } else if (role === 'teacher') {
    return <TeacherDashboard />;
  }
  
  // Fallback to generic dashboard
  return <Dashboard />;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in
    const token = getToken();
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="App">
      <DataProvider>
        <BrowserRouter>
          {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
          <Routes>
            <Route 
              path="/login" 
              element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} 
            />
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />} />
            <Route 
              path="/allStudents" 
              element={<PrivateRoute><StudentList /></PrivateRoute>} 
            />
            <Route 
              path="/institutions" 
              element={<PrivateRoute><InstitutionList /></PrivateRoute>} 
            />
            <Route 
              path="/dashboard" 
              element={<PrivateRoute><DashboardRouter /></PrivateRoute>} 
            />
            <Route 
              path="/institution/:institutionId/detail" 
              element={<PrivateRoute><InstitutionDetailPage /></PrivateRoute>} 
            />
            <Route 
              path="/institution/:institutionId/grade/:grade" 
              element={<PrivateRoute><GradeDetailPage /></PrivateRoute>} 
            />
            <Route 
              path="/student/:studentId/profile" 
              element={<PrivateRoute><StudentProfilePage /></PrivateRoute>} 
            />
            <Route 
              path="/attendance" 
              element={<PrivateRoute><AttendanceInput /></PrivateRoute>} 
            />
            <Route 
              path="/grades" 
              element={<PrivateRoute><GradesInput /></PrivateRoute>} 
            />
            <Route 
              path="/grades-view" 
              element={<PrivateRoute><GradesView /></PrivateRoute>} 
            />
            <Route 
              path="/:institution/studentlist" 
              element={<PrivateRoute><InstitutionStudentRoster /></PrivateRoute>} 
            />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </div>
  );
}