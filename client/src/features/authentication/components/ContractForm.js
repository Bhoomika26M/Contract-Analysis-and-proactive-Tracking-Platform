import React, { useState } from 'react';
import { createContract } from '../services/contractsApi';
import { cardStyle, primaryButtonStyle } from '../../../uiStyles';

const ContractForm = ({ onContractAdded }) => {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    status: 'Draft',
    execution_date: '',
    expiration_date: '' // Added the new field to state
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
        expiration_date: formData.expiration_date || null // Convert empty string to null
      };
      await createContract(payload);
      
      // Reset the form
      setFormData({ title: '', status: 'Draft', execution_date: '', expiration_date: '' });
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

  return (
    <div style={{ ...cardStyle, padding: '20px', marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Create New Contract</h3>
      {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
      {/* Changed flex layout slightly to fit the new 4th input nicely */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 200px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Execution Date</label>
          <input type="date" name="execution_date" value={formData.execution_date} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* NEW EXPIRATION DATE INPUT */}
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Expiration Date</label>
          <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <button type="submit" style={{ ...primaryButtonStyle, padding: '9px 15px', height: '35px' }}>
            Add Contract
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;