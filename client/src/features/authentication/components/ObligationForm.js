import React, { useState } from 'react';
import { createObligation } from '../services/obligationsApi';

const ObligationForm = ({ contractId, onTaskAdded }) => {
  const [formData, setFormData] = useState({
    description: '',
    due_date: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contractId) return alert("Please select a contract first");

    try {
      await createObligation({
        description: formData.description,
        due_date: formData.due_date,
        contract_id: parseInt(contractId)
      });
      
      // Clear the form and tell the parent to refresh the board
      setFormData({ description: '', due_date: '' });
      if (onTaskAdded) onTaskAdded();
      
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert(`Error: ${err.response.data.detail}`);
      } else {
        alert('Failed to add task. Please try again.');
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
      <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Add New Task</h4>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Task Description</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="e.g., Send draft for review" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Due Date</label>
          <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <button type="submit" style={{ padding: '9px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default ObligationForm;