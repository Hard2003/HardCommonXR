import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container-fluid">
        <div className="nav-home">
          <Link to="/" className="navbar-brand">
            <img src="/logo.png" height="32px" alt="logo" />
          </Link>
          <NavLink className="nav-link" to="/">
            Home
          </NavLink>
        </div>
        <NavLink className="nav-link" to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className="nav-link" to="/allStudents">
          all Students
        </NavLink>
        <NavLink className="nav-link" to="/institutions">
          Institutions
        </NavLink>
      </div>
    </nav>
  );
}