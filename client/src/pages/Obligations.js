import React, { useEffect, useState } from 'react';
import KanbanBoard from '../features/authentication/components/KanbanBoard';
import ObligationForm from '../features/authentication/components/ObligationForm';
import { getContracts } from '../features/authentication/services/contractsApi';
import { cardStyle } from '../uiStyles';

const Obligations = () => {
  const [contracts, setContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getContracts();
        setContracts(data);
        if (data.length > 0) {
          setSelectedContractId(data[0].id); // Default to the first contract
        }
      } catch (err) {
        console.error("Failed to load contracts", err);
      }
    };
    fetchContracts();
  }, []);

  return (
    <div style={{ ...cardStyle, padding: '20px' }}>
      <h2 style={{ marginTop: 0 }}>Obligation Tracking</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Contract: </label>
        <select 
          value={selectedContractId} 
          onChange={(e) => setSelectedContractId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {contracts.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {selectedContractId ? (
        <div>
          <ObligationForm contractId={selectedContractId} onTaskAdded={() => setRefreshKey(prev => prev + 1)} />
          <KanbanBoard contractId={selectedContractId} refreshKey={refreshKey} />
        </div>
      ) : (
        <p>No contracts available. Please create a contract first.</p>
      )}
    </div>
  );
};

export default Obligations;