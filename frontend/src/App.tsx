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
    /* --- UPDATED: Added Future Flags to remove console warnings --- */
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* --- Public Authentication --- */}
        <Route path="/login" element={<LoginPage />} />

        {/* --- Protected Clinical Routes --- */}
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;