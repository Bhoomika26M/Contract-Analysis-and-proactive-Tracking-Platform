import React from 'react';
import { cardStyle } from '../uiStyles';

const Reports = () => {
  return (
    <div style={{ ...cardStyle, padding: '20px' }}>
      <h2>Generate Reports</h2>
      <p>CSV and PDF data exports will be generated here.</p>
    </div>
  );
};

export default Reports;