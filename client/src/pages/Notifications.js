import React from 'react';
import { cardStyle, tableHeaderCellStyle } from '../uiStyles';

const Notifications = () => (
  <section style={{ ...cardStyle, padding: '24px' }}>
    <h1 style={{ marginTop: 0 }}>Notifications</h1>
    <p style={{ color: '#6c757d' }}>Updates and reminders for your workspace will appear here.</p>

    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
            {['Notification', 'Type', 'Date', 'Status'].map((heading) => (
              <th key={heading} scope="col" style={tableHeaderCellStyle}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              No notifications yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
);

export default Notifications;
