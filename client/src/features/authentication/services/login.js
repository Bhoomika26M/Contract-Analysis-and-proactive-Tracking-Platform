import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/auth';

export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email: email,
    password: password
  });
  return response.data;
};