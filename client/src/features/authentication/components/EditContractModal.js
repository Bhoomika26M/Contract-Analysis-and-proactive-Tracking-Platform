import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../services/contractsApi';
import { primaryButtonStyle, secondaryButtonStyle } from '../../../uiStyles';

const categories = [
  'Technology',
  'Services',
  'Consulting',
  'Licensing',
  'Non-Disclosure Agreement',
  'Other'
];

const getFormData = (contract) => ({
  title: contract.title || '',
  category: contract.category || '',
  risk_level: contract.risk_level || '',
  expiration_date: typeof contract.expiration_date === 'string'
    ? contract.expiration_date.slice(0, 10)
    : ''
});

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  color: '#6c757d',
  fontSize: '12px'
};

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  padding: '10px'
};

const EditContractModal = ({ isOpen, onClose, contract, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    risk_level: '',
    expiration_date: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && contract) {
      setFormData(getFormData(contract));
      setError('');
    }
  }, [isOpen, contract]);

  if (!isOpen || !contract) return null;

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await axios.patch(`${API_URL}/${contract.id}`, {
        ...formData,
        category: formData.category || null,
        risk_level: formData.risk_level || null,
        expiration_date: formData.expiration_date || null
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      await onSave();
      onClose();
    } catch (err) {
      console.error(err);
      const detail = err.response && err.response.data && err.response.data.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : err.message || 'Failed to update contract. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = contract.category && !categories.includes(contract.category)
    ? [contract.category, ...categories]
    : categories;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-contract-title"
        style={{
          width: '400px',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
        }}
      >
        <h2
          id="edit-contract-title"
          style={{ margin: '0 0 20px', color: '#1e1e2d', fontWeight: 600 }}
        >
          Edit Contract
        </h2>
        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <label>
              <span style={labelStyle}>Contract Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>

            <label>
              <span style={labelStyle}>Category</span>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select a category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              <span style={labelStyle}>Risk Level</span>
              <select
                name="risk_level"
                value={formData.risk_level}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select a risk level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label>
              <span style={labelStyle}>Expiration Date</span>
              <input
                type="date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleChange}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                ...secondaryButtonStyle,
                backgroundColor: '#f8f9fa',
                border: 'none',
                padding: '10px 16px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...primaryButtonStyle,
                padding: '10px 16px',
                cursor: saving ? 'wait' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default EditContractModal;
