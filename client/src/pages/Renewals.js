import React from 'react';
import { cardStyle } from '../uiStyles';

const Renewals = () => {
  return (
    <div style={{ ...cardStyle, padding: '20px' }}>
      <h2>Renewal Management</h2>
      <p>Upcoming contract renewals and expirations will be tracked here.</p>
    </div>
  );
};

export default Renewals;