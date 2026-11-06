import React, { useState } from 'react';
import ContractList from '../features/authentication/components/ContractList';
import ContractForm from '../features/authentication/components/ContractForm';
// Fixed the import name to match the file you created earlier
import EditContractModal from '../features/authentication/components/EditContractModal';


const Contracts = () => {
  // All hooks and state MUST live inside the component
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const canCreateContract = [
    'Administrator',
    'Contract Manager',
    'Department Head'
  ].includes(localStorage.getItem('userRole'));

  const handleContractAdded = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  // The function to open the modal must also be inside
  const handleEditClick = (contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
        color: '#1e1e2d'
      }}
    >
      <main style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <h1
          style={{
            margin: '0 0 24px',
            color: '#1e1e2d',
            fontWeight: '600'
          }}
        >
          Contracts
        </h1>

        {canCreateContract && (
          <ContractForm onContractAdded={handleContractAdded} />
        )}

        <ContractList
          refreshKey={refreshKey}
          onContractUpdated={handleContractAdded}
          onEditClick={handleEditClick}
        />

        {isModalOpen && (
          <EditContractModal
            isOpen={isModalOpen}
            contract={selectedContract}
            onClose={() => setIsModalOpen(false)}
            onSave={handleContractAdded}
          />
        )}
      </main>
    </div>
  );
};

export default Contracts;