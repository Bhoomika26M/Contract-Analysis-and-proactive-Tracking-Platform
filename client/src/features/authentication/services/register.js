import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/auth';

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};