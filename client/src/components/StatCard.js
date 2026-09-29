import React from 'react';

const StatCard = ({ title, value, subtext, bgColor, subtextIcon }) => {
  return (
    <div style={{
      backgroundColor: bgColor,
      color: 'white',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '130px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      flex: '1', // This ensures all cards stretch equally in a row
      minWidth: '200px' // Prevents cards from getting too squished on small screens
    }}>
      
      <h3 style={{ fontSize: '15px', fontWeight: '500', margin: 0, opacity: 0.9 }}>
        {title}
      </h3>
      
      <div style={{ fontSize: '36px', fontWeight: 'bold', margin: '8px 0' }}>
        {value}
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Creates the slightly transparent sub-badge
        padding: '4px 8px',
        borderRadius: '6px',
        width: 'fit-content'
      }}>
        {subtextIcon}
        <span>{subtext}</span>
      </div>

    </div>
  );
};

export default StatCard;