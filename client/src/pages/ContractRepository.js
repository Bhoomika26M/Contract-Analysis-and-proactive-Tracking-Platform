import React, { useEffect, useMemo, useState } from 'react';
import { getContracts } from '../features/authentication/services/contractsApi';
import { cardStyle, getStatusBadgeStyle, tableHeaderCellStyle } from '../uiStyles';

const ContractRepository = () => {
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
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

  const categories = useMemo(() => (
    Array.from(new Set(contracts.map((contract) => contract.category).filter(Boolean))).sort()
  ), [contracts]);

  const filteredContracts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return contracts.filter((contract) => {
      const matchesSearch = !normalizedSearch || [
        contract.title,
        contract.id,
        contract.category,
        contract.status
      ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
      const matchesCategory = !selectedCategory || contract.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [contracts, search, selectedCategory]);

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
          Contract Repository
        </h1>
        <p style={{ color: '#6c757d' }}>Browse and track contracts in your portfolio.</p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            margin: '20px 0'
          }}
        >
          <input
            type="search"
            aria-label="Search contracts"
            placeholder="Search contracts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '300px',
              maxWidth: '100%',
              boxSizing: 'border-box',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '10px',
              outline: 'none'
            }}
          />
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            style={{
              minWidth: '170px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '10px',
              backgroundColor: '#ffffff',
              color: '#6c757d'
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
        {loading ? (
          <p style={{ color: '#6c757d' }}>Loading contracts...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#ffffff'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  {['#', 'Title', 'Category', 'Status', 'Execution Date', 'Expiration Date'].map((heading) => (
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
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #dee2e6' }}
                  >
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
            {filteredContracts.length === 0 && !error && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>
                {contracts.length === 0
                  ? 'No contracts yet. Add a contract from the Contracts page.'
                  : 'No contracts match your search and category filters.'}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default ContractRepository;
