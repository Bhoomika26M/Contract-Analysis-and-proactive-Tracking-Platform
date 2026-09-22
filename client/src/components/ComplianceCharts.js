import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register the specific elements needed for Line and Doughnut charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ComplianceCharts = () => {
  // --- LINE CHART DATA (Compliance Deadlines) ---
  const lineData = {
    labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Compliance Score %',
        data: [78, 82, 85, 89, 91, 93],
        borderColor: '#10B981', // Green line
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4 // Makes the line curved and smooth
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  // --- DOUGHNUT CHART DATA (Risk Distribution) ---
  const doughnutData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { position: 'bottom' } }
  };

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      
      {/* Left Box: Compliance Deadlines */}
      <div style={{ flex: 2, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Compliance Deadlines</h3>
        <div style={{ height: '250px' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Right Box: Risk Distribution */}
      <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Risk Distribution</h3>
        <div style={{ height: '250px', position: 'relative' }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

    </div>
  );
};

export default ComplianceCharts;