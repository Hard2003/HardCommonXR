import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout, getRole } from '../apiCalls';
import './Navbar.css';

export default function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const role = getRole();

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container-fluid">
        <div className="nav-home">
          <Link to="/" className="navbar-brand">
            <span className="brand-logo">📚</span>
          </Link>
          <NavLink className="nav-link" to="/dashboard">
            Home
          </NavLink>
        </div>
        
        <div className="nav-middle">
          <NavLink className="nav-link" to="/dashboard">
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/allStudents">
            All Students
          </NavLink>
          <NavLink className="nav-link" to="/institutions">
            Institutions
          </NavLink>
          <NavLink className="nav-link" to="/attendance">
            Attendance
          </NavLink>
          <div className="nav-dropdown">
            <span className="nav-link dropdown-trigger">Grades</span>
            <div className="dropdown-menu">
              <NavLink className="dropdown-item" to="/grades">
                Record Grades
              </NavLink>
              <NavLink className="dropdown-item" to="/grades-view">
                View Grades
              </NavLink>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <span className="role-badge">{role?.toUpperCase()}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}