import React from 'react';
import { cardStyle } from '../uiStyles';

const Compliance = () => {
  return (
    <div style={{ ...cardStyle, padding: '20px' }}>
      <h2>Compliance Monitoring</h2>
      <p>Overdue obligations and risk alerts will be monitored here.</p>
    </div>
  );
};

export default Compliance;