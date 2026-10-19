import React, { useEffect, useState } from 'react';
import { getContract, updateContract } from '../services/contractsApi';
import { cardStyle, primaryButtonStyle, secondaryButtonStyle } from '../../../uiStyles';

const emptyForm = {
  status: 'Draft',
  execution_date: '',
  expiration_date: '',
  category: '',
  risk_level: ''
};

const EditContractModal = ({ contractId, onClose, onUpdated }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchContract = async () => {
      try {
        const contract = await getContract(contractId);
        if (active) {
          setFormData({
            status: contract.status || 'Draft',
            execution_date: contract.execution_date || '',
            expiration_date: contract.expiration_date || '',
            category: contract.category || '',
            risk_level: contract.risk_level || ''
          });
          setLoaded(true);
          setError('');
        }
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load contract details.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchContract();
    return () => {
      active = false;
    };
  }, [contractId]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await updateContract(contractId, {
        ...formData,
        execution_date: formData.execution_date || null,
        expiration_date: formData.expiration_date || null,
        category: formData.category || null,
        risk_level: formData.risk_level || null
      });
      onUpdated();
    } catch (err) {
      console.error(err);
      setError('Failed to update contract. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)'
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-contract-title"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          ...cardStyle,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        <h2 id="edit-contract-title" style={{ marginTop: 0 }}>Edit Contract</h2>
        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}

        {loading ? (
          <p>Loading contract details...</p>
        ) : !loaded ? (
          <div>
            <button type="button" onClick={onClose} style={{ ...secondaryButtonStyle, padding: '9px 14px' }}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label>
                Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '8px', boxSizing: 'border-box' }}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
              </label>
              <label>
                Category
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Technology"
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '8px', boxSizing: 'border-box' }}
                />
              </label>
              <label>
                Execution Date
                <input
                  type="date"
                  name="execution_date"
                  value={formData.execution_date}
                  onChange={handleChange}
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '8px', boxSizing: 'border-box' }}
                />
              </label>
              <label>
                Expiration Date
                <input
                  type="date"
                  name="expiration_date"
                  value={formData.expiration_date}
                  onChange={handleChange}
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '8px', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Risk Level
                <select
                  name="risk_level"
                  value={formData.risk_level}
                  onChange={handleChange}
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '8px', boxSizing: 'border-box' }}
                >
                  <option value="">Not specified</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={onClose} disabled={saving} style={{ ...secondaryButtonStyle, padding: '9px 14px' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ ...primaryButtonStyle, padding: '9px 14px', cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default EditContractModal;
