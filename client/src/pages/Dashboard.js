import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
import { API_URL } from '../features/authentication/services/contractsApi';
import { cardStyle } from '../uiStyles';

const riskColors = {
  Low: '#0bb783',
  Medium: '#f6c000',
  High: '#f1416c'
};

const metricCards = [
  { key: 'total', label: 'Total Contracts', color: '#4b2bf2' },
  { key: 'active', label: 'Active Contracts', color: '#0bb783' },
  { key: 'expiring', label: 'Expiring Contracts', color: '#f6c000' },
  { key: 'highRisk', label: 'High Risk Contracts', color: '#f1416c' }
];

const parseDateOnly = (value) => {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const processContracts = (contracts) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const statusCounts = new Map();
  const riskCounts = { Low: 0, Medium: 0, High: 0 };
  let activeContracts = 0;
  let expiringContracts = 0;
  let highRiskContracts = 0;

  contracts.forEach((contract) => {
    const status = (contract.status || 'Unknown').trim();
    const normalizedStatus = status.toLowerCase();
    const normalizedRisk = (contract.risk_level || '').trim().toLowerCase();

    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    if (normalizedStatus === 'active') activeContracts += 1;
    if (normalizedRisk === 'high') highRiskContracts += 1;

    const riskLevel = normalizedRisk
      ? `${normalizedRisk.charAt(0).toUpperCase()}${normalizedRisk.slice(1)}`
      : '';
    if (Object.prototype.hasOwnProperty.call(riskCounts, riskLevel)) {
      riskCounts[riskLevel] += 1;
    }

    const expirationDate = parseDateOnly(contract.expiration_date);
    const expiresWithin30Days = expirationDate
      && expirationDate >= today
      && expirationDate <= thirtyDaysFromNow;
    if (normalizedStatus === 'expiring' || expiresWithin30Days) {
      expiringContracts += 1;
    }
  });

  return {
    metrics: {
      total: contracts.length,
      active: activeContracts,
      expiring: expiringContracts,
      highRisk: highRiskContracts
    },
    statusData: Array.from(statusCounts, ([status, count]) => ({ status, count })),
    riskData: Object.entries(riskCounts).map(([risk, count]) => ({ risk, count }))
  };
};

const Dashboard = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchContracts = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (active) {
          setContracts(response.data);
          setError('');
        }
      } catch (err) {
        console.error('Failed to fetch dashboard contracts', err);
        if (active) setError('Failed to load dashboard data. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchContracts();
    return () => {
      active = false;
    };
  }, []);

  const { metrics, statusData, riskData } = processContracts(contracts);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f8fa'
      }}
    >
      <h1 style={{ margin: '0 0 24px', color: '#1e1e2d', fontWeight: 600 }}>
        Dashboard Overview
      </h1>

      {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
      {loading ? (
        <p style={{ color: '#6c757d' }}>Loading dashboard...</p>
      ) : (
        <>
          <section
            aria-label="Contract metrics"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}
          >
            {metricCards.map((card) => (
              <article
                key={card.key}
                style={{
                  ...cardStyle,
                  padding: '20px',
                  backgroundColor: '#ffffff'
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: '#6c757d',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {card.label}
                </h2>
                <p
                  style={{
                    margin: '12px 0 0',
                    color: card.color,
                    fontSize: '36px',
                    fontWeight: 700,
                    lineHeight: 1.2
                  }}
                >
                  {metrics[card.key]}
                </p>
              </article>
            ))}
          </section>

          <section
            aria-label="Contract charts"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px'
            }}
          >
            <article style={{ ...cardStyle, padding: '20px', backgroundColor: '#ffffff' }}>
              <h2 style={{ margin: '0 0 20px', color: '#1e1e2d', fontSize: '18px' }}>
                Contracts by Status
              </h2>
              {statusData.length === 0 ? (
                <p style={{ color: '#6c757d' }}>No contracts available to display.</p>
              ) : (
                <div style={{ width: '100%', height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 8, right: 12, left: -16, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Contracts"
                        fill="#4b2bf2"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article style={{ ...cardStyle, padding: '20px', backgroundColor: '#ffffff' }}>
              <h2 style={{ margin: '0 0 20px', color: '#1e1e2d', fontSize: '18px' }}>
                Risk Distribution
              </h2>
              {riskData.every((entry) => entry.count === 0) ? (
                <p style={{ color: '#6c757d' }}>No contracts available to display.</p>
              ) : (
                <div style={{ width: '100%', height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        dataKey="count"
                        nameKey="risk"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {riskData.map((entry) => (
                          <Cell key={entry.risk} fill={riskColors[entry.risk]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
};

export default Dashboard;
