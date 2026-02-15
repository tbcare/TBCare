import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Core Page Imports
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import AddPatient from './pages/AddPatient';
import PatientProfile from './pages/PatientProfile';
import Reports from './pages/Reports';

// Layout Import
import DashboardLayout from './layouts/DashboardLayout';

/**
 * Optimized Protected Route
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Group */}
        <Route element={<ProtectedRoute />}>
          {/* Layout Group */}
          <Route element={<DashboardLayout children={<Outlet />} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/add-patient" element={<AddPatient />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Global Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;