import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageContainer from './layout/PageContainer';
import AdminDashboard from './pages/AdminDashboard';
import LegalDashboard from './pages/LegalDashboard';
import ComplianceDashboard from './pages/ComplianceDashboard';
import Obligations from './pages/Obligations'; 
import ContractManagerDashboard from './pages/ContractManagerDashboard';
import DepartmentHeadDashboard from './pages/DepartmentHeadDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

// This dynamically returns the correct dashboard based on the role state
const DynamicDashboard = ({ role }) => {
  switch (role) {
    case 'Administrator': return <AdminDashboard />;
    case 'Legal Manager': return <LegalDashboard />;
    case 'Compliance Officer': return <ComplianceDashboard />;
    case 'Contract Manager': return <ContractManagerDashboard />;
    case 'Department Head': return <DepartmentHeadDashboard />;
    case 'Employee': return <EmployeeDashboard />;
    default: return <AdminDashboard />;
  }
};

function App() {
  // Manage the role state at the top level
  const [activeRole, setActiveRole] = useState('Administrator');

  return (
    <Router>
      {/* Pass the state to PageContainer so it can reach your Sidebar */}
      <PageContainer activeRole={activeRole} setActiveRole={setActiveRole}>
        <Routes>
          {/* Dashboard Route: Automatically loads the right component */}
          <Route path="/" element={<DynamicDashboard role={activeRole} />} />
          
          {/* Feature Modules */}
          <Route path="/obligations" element={<Obligations />} /> 
          <Route path="/users" element={<UserManagement />} />
          
          {/* Direct URL access to specific dashboards (optional, but good to keep) */}
          <Route path="/legal" element={<LegalDashboard />} />
          <Route path="/compliance" element={<ComplianceDashboard />} />
          <Route path="/contract-manager" element={<ContractManagerDashboard />} />
          <Route path="/department-head" element={<DepartmentHeadDashboard />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/settings" element={<Settings activeRole={activeRole} />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageContainer>
    </Router>
  );
}

export default App;