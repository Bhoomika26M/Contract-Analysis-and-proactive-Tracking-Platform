import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContracts } from '../features/authentication/services/contractsApi';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    draft: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getContracts();
        
        // Calculate the metrics directly on the frontend
        setMetrics({
          total: data.length,
          active: data.filter(c => c.status === 'Active').length,
          draft: data.filter(c => c.status === 'Draft').length,
          expired: data.filter(c => c.status === 'Expired').length
        });
      } catch (err) {
        console.error("Failed to fetch dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <p style={{ padding: '20px' }}>Loading dashboard...</p>;

  // Reusable styling for the metric cards
  const cardStyle = {
    flex: 1,
    minWidth: '200px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  };

  const numberStyle = {
    fontSize: '42px',
    fontWeight: 'bold',
    margin: '10px 0'
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Dashboard Overview</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Total Contracts</h4>
          <div style={{ ...numberStyle, color: '#343a40' }}>{metrics.total}</div>
        </div>
        
        <div style={cardStyle}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Active</h4>
          <div style={{ ...numberStyle, color: '#28a745' }}>{metrics.active}</div>
        </div>
        
        <div style={cardStyle}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Drafts</h4>
          <div style={{ ...numberStyle, color: '#ffc107' }}>{metrics.draft}</div>
        </div>

        <div style={cardStyle}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Expired</h4>
          <div style={{ ...numberStyle, color: '#dc3545' }}>{metrics.expired}</div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>Need to draft a new agreement or update a task?</p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/contracts" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: '500' }}>
            Manage Contracts
          </Link>
          <Link to="/obligations" style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: '500' }}>
            Manage Obligations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;