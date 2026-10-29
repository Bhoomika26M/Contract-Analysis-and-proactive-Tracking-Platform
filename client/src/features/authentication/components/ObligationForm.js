import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createObligation } from '../services/obligationsApi';
import { cardStyle, primaryButtonStyle } from '../../../uiStyles';

const ObligationForm = ({ onObligationAdded }) => {
  const [error, setError] = useState('');
  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    description: '',
    due_date: '',
    contract_id: '',
    assignee_id: '',
    status: 'Pending'
  });

  // Fetch Contracts and Users when the component loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Assuming your backend has these standard GET routes
        const [contractsRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/contracts', { headers }),
          axios.get('http://localhost:8000/api/users', { headers })
        ]);
        
        setContracts(contractsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Failed to fetch dropdown data", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- NEW VALIDATION LOGIC ---
    if (formData.contract_id && formData.due_date) {
      const selectedContract = contracts.find(c => String(c.id) === String(formData.contract_id));
      
      if (selectedContract && selectedContract.execution_date && selectedContract.expiration_date) {
        if (formData.due_date < selectedContract.execution_date || formData.due_date > selectedContract.expiration_date) {
          setError(`Error: Due date must be between the contract's execution date (${selectedContract.execution_date}) and expiration date (${selectedContract.expiration_date}).`);
          return; // Stop the submission
        }
      }
    }
    // ----------------------------

    try {
      const payload = {
        description: formData.description,
        status: formData.status,
        contract_id: parseInt(formData.contract_id, 10),
        assignee_id: formData.assignee_id ? parseInt(formData.assignee_id, 10) : null,
        due_date: formData.due_date || null
      };
      
      await createObligation(payload);
      
      setFormData({ description: '', due_date: '', contract_id: '', assignee_id: '', status: 'Pending' });
      if (onObligationAdded) onObligationAdded();
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create obligation.');
    }
  };

  const labelStyle = { display: 'block', color: '#6c757d', fontSize: '12px', fontWeight: '600', marginBottom: '5px' };
  const inputStyle = { border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px', width: '100%', boxSizing: 'border-box', outline: 'none' };

  // Find the selected contract to dynamically set the calendar boundaries
  const activeContract = contracts.find(c => String(c.id) === String(formData.contract_id));
  const minDate = activeContract?.execution_date || '';
  const maxDate = activeContract?.expiration_date || '';

  return (
    <div style={{ ...cardStyle, padding: '24px', marginBottom: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, color: '#1e1e2d', fontWeight: '600' }}>Assign New Task (Obligation)</h3>
      {error && <p role="alert" style={{ color: '#f1416c', fontWeight: '600' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 250px' }}>
          <label style={labelStyle}>Task Description</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} required style={inputStyle} placeholder="e.g., Review Privacy Clauses" />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={labelStyle}>Select Contract</label>
          <select name="contract_id" value={formData.contract_id} onChange={handleChange} required style={inputStyle}>
            <option value="" disabled>-- Choose a Contract --</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={labelStyle}>Assign To</label>
          <select name="assignee_id" value={formData.assignee_id} onChange={handleChange} style={inputStyle}>
            <option value="">-- Unassigned --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 120px' }}>
          <label style={labelStyle}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <label style={labelStyle}>Due Date</label>
          <input 
            type="date" 
            name="due_date" 
            value={formData.due_date} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
            min={minDate} 
            max={maxDate} 
          />
        </div>

        <div style={{ flex: '1 1 100%' }}>
          <button type="submit" style={{ ...primaryButtonStyle, backgroundColor: '#4b2bf2', color: '#ffffff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            Assign Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default ObligationForm;