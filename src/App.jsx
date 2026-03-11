import { Routes, Route, BrowserRouter } from "react-router-dom";
import './App.css';
import Navbar from './components/Navbar';
import LandingPage from "./pages/LandingPage";
import InstitutionList from "./pages/InstitutionList";
import StudentList from "./pages/StudentList";
import InstitutionStudentRoster from "./pages/InstitutionStudentRoster";
import Dashboard from "./pages/Dashboard";
import { DataProvider } from "./context/DataContext";

export default function App() {
  return (
    <div className="App">
      <DataProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/allStudents" element={<StudentList />} />
            <Route path="/institutions" element={<InstitutionList />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/:institution/studentlist" element={<InstitutionStudentRoster />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </div>
  );
}