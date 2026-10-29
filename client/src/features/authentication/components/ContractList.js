import React, { useEffect, useState } from 'react';
import { getContracts } from '../services/contractsApi';
import EditContractModal from './EditContractModal';
import { cardStyle, getStatusBadgeStyle, primaryButtonStyle, tableHeaderCellStyle } from '../../../uiStyles';

const ContractList = ({ refreshKey, onContractUpdated }) => {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');
  const [editingContract, setEditingContract] = useState(null);
  const canEditContracts = ['Administrator', 'Contract Manager'].includes(
    localStorage.getItem('userRole')
  );

  const handleContractUpdated = () => {
    if (onContractUpdated) onContractUpdated();
  };

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getContracts();
        setContracts(data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load contracts.');
      }
    };
    fetchContracts();
  }, [refreshKey]);

  return (
    <div style={{ ...cardStyle, padding: '20px' }}>
      <h2 style={{ marginTop: 0 }}>My Contracts</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
            <th style={tableHeaderCellStyle}>ID</th>
            <th style={tableHeaderCellStyle}>Title</th>
            <th style={tableHeaderCellStyle}>Status</th>
            <th style={tableHeaderCellStyle}>Execution Date</th>
            <th style={tableHeaderCellStyle}>Expiration Date</th>
            {canEditContracts && (
              <th style={tableHeaderCellStyle}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px' }}>{contract.id}</td>
              <td style={{ padding: '12px', fontWeight: '500' }}>{contract.title}</td>
              <td style={{ padding: '12px' }}>
                <span style={getStatusBadgeStyle(contract.status)}>
                  {contract.status}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{contract.execution_date || 'TBD'}</td>
              <td style={{ padding: '12px' }}>{contract.expiration_date || 'TBD'}</td>
              {canEditContracts && (
                <td style={{ padding: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingContract(contract)}
                    style={{ ...primaryButtonStyle, padding: '7px 12px' }}
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {contracts.length === 0 && !error && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>No contracts found.</p>
      )}
      {editingContract && (
        <EditContractModal
          isOpen={Boolean(editingContract)}
          contract={editingContract}
          onClose={() => setEditingContract(null)}
          onSave={handleContractUpdated}
        />
      )}
    </div>
  );
};

export default ContractList;