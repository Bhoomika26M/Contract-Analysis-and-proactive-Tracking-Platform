import React, { useEffect, useMemo, useState } from 'react';
import { getContracts, renewContract } from '../features/authentication/services/contractsApi';
import { cardStyle, getStatusBadgeStyle, tableHeaderCellStyle } from '../uiStyles';

const parseDateOnly = (value) => {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsedDate = new Date(year, month - 1, day);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const isExpiringWithin30Days = (contract, today, deadline) => {
  if ((contract.status || '').toLowerCase() === 'expiring') return true;
  const expirationDate = parseDateOnly(contract.expiration_date);
  return Boolean(
    expirationDate
    && expirationDate >= today
    && expirationDate <= deadline
  );
};

const Renewals = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDates, setSelectedDates] = useState({});
  const [renewingId, setRenewingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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
        if (active) setError('Failed to load renewal contracts.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContracts();
    return () => {
      active = false;
    };
  }, []);

  const handleRenewal = async (contractId) => {
    const expirationDate = selectedDates[contractId];
    if (!expirationDate) {
      setError('Select a new expiration date before initiating renewal.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setRenewingId(contractId);
    try {
      const renewedContract = await renewContract(contractId, expirationDate);
      setContracts((currentContracts) => currentContracts.map((contract) => (
        contract.id === renewedContract.id ? renewedContract : contract
      )));
      setSelectedDates((dates) => ({ ...dates, [contractId]: '' }));
      setSuccessMessage('Contract renewed successfully.');
    } catch (err) {
      console.error('Failed to renew contract', err);
      setError(err.response?.data?.detail || 'Failed to renew contract.');
    } finally {
      setRenewingId(null);
    }
  };

  const renewalContracts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 30);

    return contracts.filter((contract) => (
      isExpiringWithin30Days(contract, today, deadline)
    ));
  }, [contracts]);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f8fa'
      }}
    >
      <section style={{ ...cardStyle, padding: '24px' }}>
        <h1 style={{ marginTop: 0, color: '#1e1e2d', fontWeight: 600 }}>
          Renewal Management
        </h1>
        <p style={{ color: '#6c757d' }}>
          Contracts marked as expiring or due to expire in the next 30 days.
        </p>

        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
        {successMessage && <p role="status" style={{ color: '#155724' }}>{successMessage}</p>}
        {loading ? (
          <p style={{ color: '#6c757d' }}>Loading renewal contracts...</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '20px' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#ffffff'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                  {['Title', 'Category', 'Status', 'Expiration Date', 'New Expiration Date', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{
                        ...tableHeaderCellStyle,
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renewalContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #dee2e6' }}
                  >
                    <td style={{ padding: '12px', fontWeight: 500 }}>{contract.title}</td>
                    <td style={{ padding: '12px' }}>{contract.category || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={getStatusBadgeStyle(contract.status)}>{contract.status}</span>
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      {contract.expiration_date || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="date"
                        aria-label={`New expiration date for ${contract.title}`}
                        value={selectedDates[contract.id] || ''}
                        onChange={(event) => setSelectedDates((dates) => ({
                          ...dates,
                          [contract.id]: event.target.value
                        }))}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleRenewal(contract.id)}
                        disabled={renewingId === contract.id}
                        style={{
                          backgroundColor: '#e8fff3',
                          color: '#0bb783',
                          border: '1px solid #0bb783',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: renewingId === contract.id ? 'wait' : 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {renewingId === contract.id ? 'Renewing...' : 'Initiate Renewal'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renewalContracts.length === 0 && !error && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>
                No contracts are due for renewal in the next 30 days.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default Renewals;
