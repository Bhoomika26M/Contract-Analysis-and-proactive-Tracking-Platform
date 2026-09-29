import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import ComplianceCharts from '../components/ComplianceCharts';
import { Briefcase, AlertOctagon, RefreshCw, DollarSign } from 'lucide-react';

const ComplianceDashboard = () => {
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Compliance Dashboard</h1>
          <p style={{ color: '#6B7280', margin: '4px 0 0 0', fontSize: '14px' }}>Monitor organization-wide compliance, risks, and audit performance.</p>
        </div>
        <button style={{ backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          Export Audit Report
        </button>
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

      {/* Placeholder for Compliance Charts Area */}
      <div style={{ 
        backgroundColor: '#FFFFFF', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
        minHeight: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
         <p style={{ color: '#6B7280', fontSize: '16px' }}>Compliance charts and data tables will be rendered here.</p>
      </div>
      {/* Replaced the placeholder with the actual charts */}
      <ComplianceCharts />

    </div>
  );
};

export default ComplianceDashboard;