import axios from 'axios';

// Create an Axios instance with baseURL and credentials
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Request interceptor for Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API response error:', error?.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const register = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Profile API
export const getUserProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  console.log('Sending profile payload:', JSON.stringify(profileData, null, 2));
  const response = await api.put('/profile', profileData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

export const uploadResume = async (fileData) => {
  console.log('Sending resume payload:', JSON.stringify(fileData, null, 2));
  const response = await api.post('/profile/resume', fileData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

export const getPublicProfile = async (userId) => {
  const response = await api.get(`/profile/public/${userId}`);
  return response.data;
};

// Export the Axios instance for use in jobsApi.js etc.
export default api;