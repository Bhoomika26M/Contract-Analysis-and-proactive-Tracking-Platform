import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../features/authentication/services/contractsApi';
import { cardStyle, tableHeaderCellStyle } from '../uiStyles';

const ContractApproval = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);
  const canDecide = ['Administrator', 'Legal Manager'].includes(
    localStorage.getItem('userRole')
  );

  useEffect(() => {
    if (!canDecide) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const loadContracts = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (active) {
          setContracts(response.data.filter((contract) => contract.status === 'Pending'));
          setError('');
        }
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load pending contracts.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContracts();
    return () => {
      active = false;
    };
  }, [canDecide]);

  const handleDecision = async (contractId, newStatus) => {
    setWorkingId(contractId);
    setError('');

    try {
      await axios.patch(
        `${API_URL}/${contractId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setContracts((current) => current.filter((contract) => contract.id !== contractId));
    } catch (err) {
      console.error(err);
      setError(`Failed to update contract status to ${newStatus}. Please try again.`);
    } finally {
      setWorkingId(null);
    }
  };

  if (!canDecide) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d',
          textAlign: 'center'
        }}
      >
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <section style={{ ...cardStyle, padding: '24px' }}>
      <h1 style={{ marginTop: 0, color: '#1e1e2d', fontWeight: 600 }}>
        Contract Approvals
      </h1>
      <p style={{ color: '#6c757d' }}>Review contracts awaiting approval.</p>

      {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
      {loading ? (
        <p>Loading pending contracts...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                {['Title', 'Category', 'Risk Level', 'Expiration Date', 'Actions'].map((heading) => (
                  <th key={heading} style={tableHeaderCellStyle}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{contract.title}</td>
                  <td style={{ padding: '12px' }}>{contract.category || '—'}</td>
                  <td style={{ padding: '12px' }}>{contract.risk_level || '—'}</td>
                  <td style={{ padding: '12px' }}>{contract.expiration_date || 'TBD'}</td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => handleDecision(contract.id, 'Active')}
                      disabled={workingId !== null}
                      style={{
                        backgroundColor: '#e8fff3',
                        color: '#0bb783',
                        border: '1px solid #0bb783',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {workingId === contract.id ? 'Saving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(contract.id, 'Rejected')}
                      disabled={workingId !== null}
                      style={{
                        backgroundColor: '#ffebf0',
                        color: '#f1416c',
                        border: '1px solid #f1416c',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {workingId === contract.id ? 'Saving...' : 'Reject'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contracts.length === 0 && (
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>
              No contracts are awaiting approval.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default ContractApproval;
