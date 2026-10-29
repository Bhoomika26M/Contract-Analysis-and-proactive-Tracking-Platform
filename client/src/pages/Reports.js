import React, { useEffect, useState } from 'react';
import { getContracts } from '../features/authentication/services/contractsApi';
import { cardStyle, primaryButtonStyle } from '../uiStyles';

export const exportToCSV = (contracts) => {
  const columns = [
    ['ID', 'id'],
    ['Title', 'title'],
    ['Status', 'status'],
    ['Department', 'department'],
    ['Risk Level', 'risk_level'],
    ['Expiration', 'expiration_date']
  ];
  const escapeCSV = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csvContent = [
    columns.map(([heading]) => escapeCSV(heading)).join(','),
    ...contracts.map((contract) => (
      columns.map(([, field]) => escapeCSV(contract[field])).join(',')
    ))
  ].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'contractiq_report.csv';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
};

const Reports = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getContracts()
      .then((data) => {
        if (active) setContracts(data);
      })
      .catch((err) => {
        console.error('Failed to load report contracts', err);
        if (active) setError('Failed to load contracts for export.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '24px', boxSizing: 'border-box', backgroundColor: '#f5f8fa' }}>
      <section style={{ ...cardStyle, padding: '24px' }}>
        <h1 style={{ marginTop: 0, color: '#1e1e2d' }}>Generate Reports</h1>
        <p style={{ color: '#6c757d' }}>
          Export the contracts available to your account as a CSV report.
        </p>
        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
        <button
          type="button"
          onClick={() => exportToCSV(contracts)}
          disabled={loading || contracts.length === 0}
          style={{
            ...primaryButtonStyle,
            padding: '10px 16px',
            fontWeight: 600,
            opacity: loading || contracts.length === 0 ? 0.6 : 1,
            cursor: loading || contracts.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Export to CSV
        </button>
        {loading && <p role="status" style={{ color: '#6c757d' }}>Loading contracts...</p>}
        {!loading && !error && contracts.length === 0 && (
          <p style={{ color: '#6c757d' }}>No contracts are available to export.</p>
        )}
      </section>
    </main>
  );
};

export default Reports;
