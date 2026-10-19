import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { getContractAnalytics } from '../features/authentication/services/contractsApi';
import { cardStyle, primaryButtonStyle } from '../uiStyles';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState({
    total_contracts: 0,
    monthly_activity: [],
    status_distribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getContractAnalytics();
        setAnalytics(data);
        setError('');
      } catch (err) {
        console.error("Failed to fetch dashboard metrics", err);
        setError('Failed to load dashboard analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <p style={{ padding: '20px' }}>Loading dashboard...</p>;

  const getStatusCount = (status) => (
    analytics.status_distribution.find((item) => item.status === status)?.count || 0
  );
  const chartColors = ['#4b2bf2', '#0bb783', '#f7b84b', '#f1416c', '#7b61ff', '#5bc0be'];

  const metricCardStyle = {
    flex: 1,
    minWidth: '200px',
    ...cardStyle,
    padding: '20px',
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
      {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={{ ...metricCardStyle, backgroundColor: '#f8f5ff' }}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Total Contracts</h4>
          <div style={{ ...numberStyle, color: '#4b2bf2' }}>{analytics.total_contracts}</div>
        </div>
        
        <div style={{ ...metricCardStyle, backgroundColor: '#e8fff3' }}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Active</h4>
          <div style={{ ...numberStyle, color: '#0bb783' }}>{getStatusCount('Active')}</div>
        </div>
        
        <div style={{ ...metricCardStyle, backgroundColor: '#fff3cd' }}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Drafts</h4>
          <div style={{ ...numberStyle, color: '#856404' }}>{getStatusCount('Draft')}</div>
        </div>

        <div style={{ ...metricCardStyle, backgroundColor: '#ffebf0' }}>
          <h4 style={{ margin: 0, color: '#6c757d', textTransform: 'uppercase', fontSize: '12px' }}>Expired</h4>
          <div style={{ ...numberStyle, color: '#f1416c' }}>{getStatusCount('Expired')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <section style={{ ...cardStyle, padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Monthly Activity</h3>
          <p style={{ marginTop: 0, color: '#6c757d' }}>Contracts by execution date over the last 12 months.</p>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={analytics.monthly_activity} margin={{ top: 10, right: 12, left: 0, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-35} textAnchor="end" interval={0} height={55} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="contracts" name="Contracts" fill="#4b2bf2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={{ ...cardStyle, padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Contract Status Distribution</h3>
          {analytics.status_distribution.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No contracts available to display.</p>
          ) : (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={analytics.status_distribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.status_distribution.map((entry, index) => (
                      <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div style={{ ...cardStyle, padding: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>Need to draft a new agreement or update a task?</p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/contracts" style={{ ...primaryButtonStyle, padding: '10px 20px', textDecoration: 'none', fontWeight: '500' }}>
            Manage Contracts
          </Link>
          <Link to="/obligations" style={{ ...primaryButtonStyle, padding: '10px 20px', textDecoration: 'none', fontWeight: '500' }}>
            Manage Obligations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;