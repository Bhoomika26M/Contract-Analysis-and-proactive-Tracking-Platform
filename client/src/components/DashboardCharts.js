import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// In React, Chart.js requires you to register the specific elements you want to use
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardCharts = () => {
  // --- BAR CHART DATA (Monthly Activity) ---
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Created',
        data: [45, 59, 80, 81, 56, 55, 40],
        backgroundColor: '#8B5CF6', // Purple
      },
      {
        label: 'Approved',
        data: [28, 48, 40, 19, 86, 27, 90],
        backgroundColor: '#10B981', // Green
      },
      {
        label: 'Expired',
        data: [12, 19, 3, 5, 2, 3, 7],
        backgroundColor: '#EF4444', // Red
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  // --- DOUGHNUT CHART DATA (Contract Status) ---
  const doughnutData = {
    labels: ['Active', 'Pending', 'Archived', 'Expired'],
    datasets: [
      {
        data: [68, 10, 15, 7],
        backgroundColor: ['#10B981', '#06B6D4', '#9CA3AF', '#EF4444'],
        borderWidth: 0,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%', // Makes the center hole larger, like your design
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
      
      {/* Left Box: Monthly Activity */}
      <div style={{ 
        flex: 2, // Takes up 2/3 of the space
        backgroundColor: '#FFFFFF', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Monthly Activity</h3>
        <div style={{ height: '300px' }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Right Box: Contract Status */}
      <div style={{ 
        flex: 1, // Takes up 1/3 of the space
        backgroundColor: '#FFFFFF', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Contract Status</h3>
        <div style={{ height: '300px', position: 'relative' }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

    </div>
  );
};

export default DashboardCharts;