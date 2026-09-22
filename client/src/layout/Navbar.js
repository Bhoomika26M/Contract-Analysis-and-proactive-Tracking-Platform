import React from 'react';
import { Search, Bell, Moon } from 'lucide-react';

const Navbar = () => {
  return (
    <div style={{
      height: '72px',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid #E5E7EB'
    }}>
      
      {/* Left Side: Search Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        backgroundColor: '#F3F4F6', 
        borderRadius: '8px', 
        padding: '8px 16px', 
        width: '400px' 
      }}>
        <Search size={18} color="#6B7280" />
        <input 
          type="text" 
          placeholder="Search contracts, obligations..." 
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            outline: 'none',
            marginLeft: '12px',
            width: '100%',
            fontSize: '14px',
            color: '#374151'
          }}
        />
      </div>

      {/* Right Side: Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* Dark Mode Toggle */}
        <button style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <Moon size={20} color="#4B5563" />
        </button>

        {/* Notification Bell with Badge */}
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Bell size={20} color="#4B5563" />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#EF4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            3
          </span>
        </div>

        {/* User Profile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginLeft: '12px', 
          borderLeft: '1px solid #E5E7EB', 
          paddingLeft: '20px' 
        }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            backgroundColor: '#8B5CF6', 
            color: 'white', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 'bold' 
          }}>
            NJ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Neha James</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Administrator</span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Navbar;