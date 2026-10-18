import React, { useState } from 'react';
import ContractList from '../features/authentication/components/ContractList';
import ContractForm from '../features/authentication/components/ContractForm';

const Contracts = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleContractAdded = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  return (
    <div>
      <ContractForm onContractAdded={handleContractAdded} />
      <ContractList refreshKey={refreshKey} />
    </div>
  );
};

export default Contracts;