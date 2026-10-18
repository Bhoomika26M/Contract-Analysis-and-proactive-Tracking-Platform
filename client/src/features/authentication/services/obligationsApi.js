import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/obligations';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getObligations = async (contractId) => {
  const response = await axios.get(`${API_URL}/contract/${contractId}`, getAuthHeaders());
  return response.data;
};

export const createObligation = async (obligationData) => {
  const response = await axios.post(API_URL, obligationData, getAuthHeaders());
  return response.data;
};

export const updateObligationStatus = async (obligationId, status) => {
  const response = await axios.patch(`${API_URL}/${obligationId}/status`, { status }, getAuthHeaders());
  return response.data;
};