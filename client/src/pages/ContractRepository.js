import React, { useEffect, useState } from 'react';
import { getContracts } from '../features/authentication/services/contractsApi';
import { cardStyle, getStatusBadgeStyle, tableHeaderCellStyle } from '../uiStyles';

const ContractRepository = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadContracts = async () => {
      try {
        const data = await getContracts();
        if (active) {
          setContracts(data);
          setError('');
        }
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load contracts.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContracts();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section style={{ ...cardStyle, padding: '24px' }}>
      <h1 style={{ marginTop: 0 }}>Contract Repository</h1>
      <p style={{ color: '#6c757d' }}>Browse and track contracts in your portfolio.</p>

      {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
      {loading ? (
        <p>Loading contracts...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                {['Contract ID', 'Title', 'Category', 'Status', 'Execution Date', 'Expiration Date'].map((heading) => (
                  <th key={heading} scope="col" style={{ ...tableHeaderCellStyle, whiteSpace: 'nowrap' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{contract.id}</td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{contract.title}</td>
                  <td style={{ padding: '12px' }}>{contract.category || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={getStatusBadgeStyle(contract.status)}>{contract.status}</span>
                  </td>
                  <td style={{ padding: '12px' }}>{contract.execution_date || '—'}</td>
                  <td style={{ padding: '12px' }}>{contract.expiration_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {contracts.length === 0 && !error && (
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>
              No contracts yet. Add a contract from the Contracts page.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default ContractRepository;
