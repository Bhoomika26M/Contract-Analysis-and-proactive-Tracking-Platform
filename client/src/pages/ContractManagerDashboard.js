import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { Briefcase, AlertOctagon, RefreshCw, DollarSign, ArrowRight } from 'lucide-react';

const ContractManagerDashboard = () => {
  // State to hold our database metrics
  const [metrics, setMetrics] = useState({
    active_contracts: 0,
    total_value: 0,
    pending_tasks: 0,
    completed_tasks: 0
  });

  // Fetch the data when the page loads
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard/metrics')
      .then(response => response.json())
      .then(data => setMetrics(data))
      .catch(error => console.error("Error fetching metrics:", error));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Contract Manager Dashboard</h1>
          <p style={{ color: '#6B7280', margin: '4px 0 0 0', fontSize: '14px' }}>Manage contracts, track renewals, and monitor obligations.</p>
        </div>
      </div>

      {/* Metric Cards dynamically using database data */}
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
    </div>
  );
};

export default ContractManagerDashboard;