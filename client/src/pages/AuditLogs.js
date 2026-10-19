import React from 'react';
import { cardStyle, tableHeaderCellStyle } from '../uiStyles';

const auditEntries = [
  { timestamp: '2026-10-18 14:32', user: 'Avery Morgan', action: 'Contract approved', resource: 'CT-1042', details: 'Cloud Services Agreement' },
  { timestamp: '2026-10-18 13:08', user: 'Jordan Lee', action: 'Contract updated', resource: 'CT-1041', details: 'Changed status to Draft' },
  { timestamp: '2026-10-17 16:45', user: 'Avery Morgan', action: 'User role updated', resource: 'USR-0028', details: 'Employee role assigned' },
  { timestamp: '2026-10-17 11:20', user: 'Taylor Chen', action: 'Obligation completed', resource: 'OBL-0317', details: 'Quarterly compliance review' }
];

const AuditLogs = () => (
  <section style={{ ...cardStyle, padding: '24px' }}>
    <h1 style={{ marginTop: 0 }}>Audit Logs</h1>
    <p style={{ color: '#6c757d' }}>Review a sample of recent activity across the workspace.</p>

    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
            {['Timestamp', 'User', 'Action', 'Resource', 'Details'].map((heading) => (
              <th key={heading} scope="col" style={{ ...tableHeaderCellStyle, whiteSpace: 'nowrap' }}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {auditEntries.map((entry) => (
            <tr key={`${entry.timestamp}-${entry.resource}`} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{entry.timestamp}</td>
              <td style={{ padding: '12px' }}>{entry.user}</td>
              <td style={{ padding: '12px' }}>{entry.action}</td>
              <td style={{ padding: '12px' }}>{entry.resource}</td>
              <td style={{ padding: '12px' }}>{entry.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default AuditLogs;
