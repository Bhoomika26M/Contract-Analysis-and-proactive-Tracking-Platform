import React from 'react';

const RecentActivities = () => {
  // Mock data representing the activity logs
  const activities = [
    { id: 1, user: 'Sarah Chen', action: 'Contract Approved', module: 'Contracts', time: '09:14', status: 'Success' },
    { id: 2, user: 'James Miller', action: 'Document Uploaded', module: 'Repository', time: '10:32', status: 'Success' },
    { id: 3, user: 'Priya Nair', action: 'Login Attempt', module: 'Auth', time: '11:00', status: 'Failed' },
    { id: 4, user: 'Daniel Park', action: 'Obligation Updated', module: 'Obligations', time: '13:45', status: 'Success' },
  ];

  // Helper function to color-code the status badges
  const getStatusColor = (status) => {
    switch(status) {
      case 'Success': return { bg: '#D1FAE5', text: '#065F46' }; // Green
      case 'Failed': return { bg: '#FEE2E2', text: '#991B1B' }; // Red
      case 'Pending': return { bg: '#FEF3C7', text: '#92400E' }; // Yellow
      default: return { bg: '#F3F4F6', text: '#374151' }; // Gray
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '24px' }}>
      
      {/* Table Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Recent Activities</h3>
        <button style={{ background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          View all →
        </button>
      </div>

      {/* Data Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 8px', fontWeight: '600' }}>User</th>
            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Action</th>
            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Module</th>
            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Time</th>
            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '12px 8px', color: '#111827', fontWeight: '500', fontSize: '14px' }}>{activity.user}</td>
              <td style={{ padding: '12px 8px', color: '#4B5563', fontSize: '14px' }}>{activity.action}</td>
              <td style={{ padding: '12px 8px', color: '#4B5563', fontSize: '14px' }}>{activity.module}</td>
              <td style={{ padding: '12px 8px', color: '#4B5563', fontSize: '14px' }}>{activity.time}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{ 
                  backgroundColor: getStatusColor(activity.status).bg, 
                  color: getStatusColor(activity.status).text,
                  padding: '4px 8px',
                  borderRadius: '9999px', // Creates the pill shape
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {activity.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
    </div>
  );
};

export default RecentActivities;