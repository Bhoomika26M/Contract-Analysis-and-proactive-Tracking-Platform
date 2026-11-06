import React, { useState } from 'react';
import { createContract } from '../services/contractsApi';
import { cardStyle, primaryButtonStyle } from '../../../uiStyles';

const ContractForm = ({ onContractAdded }) => {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    status: 'Pending',
    category: 'IT',
    risk_level: 'Low',
    department: 'IT',
    execution_date: '',
    expiration_date: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        execution_date: formData.execution_date || null,
        expiration_date: formData.expiration_date || null
      };
      await createContract(payload);
      
      // Reset the form to default values
      setFormData({ 
        title: '', 
        status: 'Pending', 
        category: 'IT', 
        risk_level: 'Low', 
        department: 'IT', 
        execution_date: '', 
        expiration_date: '' 
      });
      if (onContractAdded) onContractAdded();
      
    } catch (err) {
      console.error(err);
      const detail = err.response && err.response.data && err.response.data.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : detail
            ? JSON.stringify(detail)
            : err.message || 'Failed to create contract.'
      );
    }
  };

  // Reusable inline styles for the new inputs to keep the JSX clean
  const labelStyle = { display: 'block', color: '#6c757d', fontSize: '12px', fontWeight: '600', marginBottom: '5px' };
  const inputStyle = { border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px', width: '100%', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ ...cardStyle, padding: '24px', marginBottom: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, color: '#1e1e2d', fontWeight: '600' }}>Create New Contract</h3>
      {error && <p role="alert" style={{ color: '#f1416c', fontWeight: '600' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 250px' }}>
          <label style={labelStyle}>Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={labelStyle}>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Legal">Legal</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <div style={{ flex: '1 1 120px' }}>
          <label style={labelStyle}>Risk Level</label>
          <select name="risk_level" value={formData.risk_level} onChange={handleChange} style={inputStyle}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={labelStyle}>Department</label>
          <select name="department" value={formData.department} onChange={handleChange} style={inputStyle}>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Legal">Legal</option>
            <option value="Operations">Operations</option>
            <option value="Global">Global</option>
          </select>
        </div>

        <div style={{ flex: '1 1 120px' }}>
          <label style={labelStyle}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Expiring">Expiring</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <label style={labelStyle}>Execution Date</label>
          <input type="date" name="execution_date" value={formData.execution_date} onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <label style={labelStyle}>Expiration Date</label>
          <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ flex: '1 1 100%' }}>
          <button type="submit" style={{ ...primaryButtonStyle, backgroundColor: '#4b2bf2', color: '#ffffff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            Add Contract
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;