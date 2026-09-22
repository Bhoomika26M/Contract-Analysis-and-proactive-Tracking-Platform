import React from 'react';
import { Bar } from 'react-chartjs-2';
// We don't need to re-register ChartJS elements since we did it in DashboardCharts.js!

const LegalCharts = () => {
  const barData = {
    labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      { label: 'Approved', data: [12, 19, 15, 22, 18, 25], backgroundColor: '#10B981' },
      { label: 'Rejected', data: [2, 4, 1, 5, 2, 3], backgroundColor: '#EF4444' },
      { label: 'Pending', data: [5, 2, 8, 4, 7, 6], backgroundColor: '#06B6D4' }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Approval Timeline</h3>
      <div style={{ flex: 1, minHeight: '250px' }}>
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
};

export default LegalCharts;