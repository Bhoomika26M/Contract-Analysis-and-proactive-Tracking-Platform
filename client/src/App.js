import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MainLayout from './layout/MainLayout';
import Contracts from './pages/Contracts';
import Obligations from './pages/Obligations';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import ContractApproval from './pages/ContractApproval';
import ContractRepository from './pages/ContractRepository';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import Renewals from './pages/Renewals';
import Compliance from './pages/Compliance';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Public Routes without Sidebar */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes wrapped in the Layout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/repository" element={<ContractRepository />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/obligations" element={<Obligations />} />
            <Route path="/renewals" element={<Renewals />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Legal Manager', 'Contract Manager']}>
                  <ContractApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Compliance Officer']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;