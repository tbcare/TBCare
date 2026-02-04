import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Core Page Imports
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import AddPatient from './pages/AddPatient';
import PatientProfile from './pages/PatientProfile';

// Layout Import
import DashboardLayout from './layouts/DashboardLayout';

/**
 * Higher-order component to protect private clinical routes.
 * Checks for an auth token in localStorage before allowing access.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Authentication --- */}
        <Route path="/login" element={<LoginPage />} />

        {/* --- Protected Clinical Routes --- */}
        {/* All routes below are wrapped in ProtectedRoute and DashboardLayout */}
        
        {/* Main Dashboard Analytics */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Full Patient Registry */}
        <Route 
          path="/patients" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PatientList /> 
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* New Patient Enrollment */}
        <Route 
          path="/add-patient" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AddPatient />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Patient Detail & Inline Management
            Note: We no longer use a separate /edit route. 
            Editing is handled via state inside PatientProfile.
        */}
        <Route 
          path="/patients/:id" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PatientProfile />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* --- Global Navigation Logic --- */}
        {/* Redirect empty paths and 404s to the Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;