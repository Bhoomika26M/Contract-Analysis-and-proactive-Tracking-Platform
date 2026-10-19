import React, { useEffect, useState } from 'react';
import {
  approveContract,
  getPendingContracts,
  rejectContract
} from '../features/authentication/services/approvalsApi';
import { cardStyle, getStatusBadgeStyle, tableHeaderCellStyle } from '../uiStyles';

const ContractApproval = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);
  const canDecide = ['Administrator', 'Legal Manager'].includes(
    localStorage.getItem('userRole')
  );

  useEffect(() => {
    let active = true;

    const loadPendingContracts = async () => {
      try {
        const data = await getPendingContracts();
        if (active) {
          setContracts(data);
          setError('');
        }
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load pending contracts.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPendingContracts();
    return () => {
      active = false;
    };
  }, []);

  const handleDecision = async (contractId, decision) => {
    setWorkingId(contractId);
    setError('');

    try {
      if (decision === 'approve') {
        await approveContract(contractId);
      } else {
        await rejectContract(contractId);
      }
      setContracts((current) => current.filter((contract) => contract.id !== contractId));
    } catch (err) {
      console.error(err);
      setError(`Failed to ${decision} contract. It may have already been reviewed.`);
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section style={{ ...cardStyle, padding: '24px' }}>
      <h1 style={{ marginTop: 0 }}>Contract Approvals</h1>
      <p style={{ color: '#6c757d' }}>Review contracts awaiting approval.</p>

      {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
      {loading ? (
        <p>Loading pending contracts...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                {[
                  'ID',
                  'Title',
                  'Category',
                  'Status',
                  'Risk',
                  'Execution Date',
                  'Expiration Date',
                  ...(canDecide ? ['Actions'] : [])
                ].map((heading) => (
                  <th key={heading} style={tableHeaderCellStyle}>{heading}</th>
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
                  <td style={{ padding: '12px' }}>{contract.risk_level || '—'}</td>
                  <td style={{ padding: '12px' }}>{contract.execution_date || 'TBD'}</td>
                  <td style={{ padding: '12px' }}>{contract.expiration_date || 'TBD'}</td>
                  {canDecide && (
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleDecision(contract.id, 'approve')}
                        disabled={workingId !== null}
                        style={{ marginRight: '8px', padding: '7px 11px', border: '1px solid #0bb783', borderRadius: '6px', backgroundColor: '#e8fff3', color: '#0bb783', cursor: 'pointer' }}
                      >
                        {workingId === contract.id ? 'Saving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(contract.id, 'reject')}
                        disabled={workingId !== null}
                        style={{ padding: '7px 11px', border: '1px solid #f1416c', borderRadius: '6px', backgroundColor: '#ffebf0', color: '#f1416c', cursor: 'pointer' }}
                      >
                        {workingId === contract.id ? 'Saving...' : 'Reject'}
                      </button>
                    </td>
                  )}
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
