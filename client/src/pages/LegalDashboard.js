import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import PendingApprovals from '../components/PendingApprovals';
import LegalCharts from '../components/LegalCharts';
import { Briefcase, AlertOctagon, RefreshCw, DollarSign } from 'lucide-react';

const LegalDashboard = () => {
  const [metrics, setMetrics] = useState({
    active_contracts: 0,
    total_value: 0,
    pending_tasks: 0,
    completed_tasks: 0
  });

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard/metrics')
      .then(response => response.json())
      .then(data => setMetrics(data))
      .catch(error => console.error("Error fetching metrics:", error));
  }, []);
  return (
    <div>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Legal Manager Dashboard</h1>
          <p style={{ color: '#6B7280', margin: '4px 0 0 0', fontSize: '14px' }}>Contract reviews, approvals, and legal task management.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            Export
          </button>
          <button style={{ backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            + Create Contract
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard 
          title="Active Contracts" 
          value={metrics.active_contracts}  
          subtext="Currently managed" 
          bgColor="#D946EF" 
          subtextIcon={<Briefcase size={14} />} 
        />
        <StatCard 
          title="Pending Tasks" 
          value={metrics.pending_tasks}     
          subtext="Requires action" 
          bgColor="#F43F5E" 
          subtextIcon={<AlertOctagon size={14} />} 
        />
        <StatCard 
          title="Completed Tasks" 
          value={metrics.completed_tasks}   
          subtext="Finished obligations" 
          bgColor="#0EA5E9" 
          subtextIcon={<RefreshCw size={14} />} 
        />
        <StatCard 
          title="Total Value" 
          value={`$${metrics.total_value}`} 
          subtext="Under management" 
          bgColor="#10B981" 
          subtextIcon={<DollarSign size={14} />} 
        />
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', gap: '24px' }}>
        <PendingApprovals />
        <LegalCharts />
      </div>

    </div>
  );
};

export default LegalDashboard;