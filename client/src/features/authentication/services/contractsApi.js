import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/contracts';

export const getContracts = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
export const createContract = async (contractData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(API_URL, contractData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};