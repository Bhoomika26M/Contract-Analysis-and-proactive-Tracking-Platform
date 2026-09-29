import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { Briefcase, AlertOctagon, RefreshCw, DollarSign, ArrowRight } from 'lucide-react';

const DepartmentHeadDashboard = () => {
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Department Head Dashboard</h1>
          <p style={{ color: '#6B7280', margin: '4px 0 0 0', fontSize: '14px' }}>Department contracts, team obligations, and compliance overview.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            Reports
          </button>
          <button style={{ backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            View Contracts
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

      {/* Content Layout: Department Contracts & Team Obligations */}
      <div style={{ display: 'flex', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Department Contracts</h3>
            <button style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E5E7EB', borderRadius: '8px' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Active department contracts list...</p>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Team Obligations</h3>
            <button style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E5E7EB', borderRadius: '8px' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Team member tasks and deadlines...</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DepartmentHeadDashboard;