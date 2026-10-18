import React, { useEffect, useState } from 'react';
import { getContracts } from '../services/contractsApi';

const ContractList = ({ refreshKey }) => {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getContracts();
        setContracts(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load contracts.');
      }
    };
    fetchContracts();
  }, [refreshKey]);;

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0 }}>My Contracts</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>ID</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Title</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Status</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Execution Date</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Expiration Date</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px' }}>{contract.id}</td>
              <td style={{ padding: '12px', fontWeight: '500' }}>{contract.title}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ 
                  padding: '5px 10px', 
                  borderRadius: '12px', 
                  fontSize: '14px',
                  backgroundColor: contract.status === 'Draft' ? '#e2e3e5' : '#d4edda',
                  color: contract.status === 'Draft' ? '#383d41' : '#155724'
                }}>
                  {contract.status}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{contract.execution_date || 'TBD'}</td>
              <td style={{ padding: '12px' }}>{contract.expiration_date || 'TBD'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {contracts.length === 0 && !error && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>No contracts found.</p>
      )}
    </div>
  );
};

export default ContractList;