import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageContainer from './layout/PageContainer';
import AdminDashboard from './pages/AdminDashboard';
import LegalDashboard from './pages/LegalDashboard';
import ComplianceDashboard from './pages/ComplianceDashboard';
import Obligations from './pages/Obligations'; 
import ContractManagerDashboard from './pages/ContractManagerDashboard';
import DepartmentHeadDashboard from './pages/DepartmentHeadDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  return (
    <Router>
      <PageContainer>
        <Routes>
          {/* Dashboard Routes */}
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/legal" element={<LegalDashboard />} />
          <Route path="/compliance" element={<ComplianceDashboard />} />
          
          {/* Obligation Tracker Route */}
          <Route path="/obligations" element={<Obligations />} /> {/* <-- 2. New Route added here! */}
          
          {/* Fallback route just in case */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/contract-manager" element={<ContractManagerDashboard />} />
          <Route path="/department-head" element={<DepartmentHeadDashboard />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </PageContainer>
    </Router>
  );
}

export default App;