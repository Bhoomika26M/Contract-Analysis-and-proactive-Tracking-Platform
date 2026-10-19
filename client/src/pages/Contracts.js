import React, { useState } from 'react';
import ContractList from '../features/authentication/components/ContractList';
import ContractForm from '../features/authentication/components/ContractForm';

const Contracts = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const canCreateContract = [
    'Administrator',
    'Contract Manager',
    'Department Head'
  ].includes(localStorage.getItem('userRole'));

  const handleContractAdded = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  return (
    <div>
      {canCreateContract && (
        <ContractForm onContractAdded={handleContractAdded} />
      )}
      <ContractList refreshKey={refreshKey} onContractUpdated={handleContractAdded} />
    </div>
  );
};

export default Contracts;