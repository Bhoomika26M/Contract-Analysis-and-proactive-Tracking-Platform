import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/contracts';

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export const getPendingContracts = async () => {
  const response = await axios.get(`${API_URL}/pending`, authConfig());
  return response.data;
};

export const approveContract = async (contractId) => {
  const response = await axios.post(
    `${API_URL}/${contractId}/approve`,
    {},
    authConfig()
  );
  return response.data;
};

export const rejectContract = async (contractId) => {
  const response = await axios.post(
    `${API_URL}/${contractId}/reject`,
    {},
    authConfig()
  );
  return response.data;
};
