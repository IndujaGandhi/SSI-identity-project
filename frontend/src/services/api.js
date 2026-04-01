import axios from 'axios';
import config from '../config';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  logout: () => API.post('/auth/logout')
};

// DID APIs
export const didAPI = {
  create: () => API.post('/did/create'),
  getMyDID: () => API.get('/did/me'),
  resolveDID: (did) => API.get(`/did/resolve/${did}`)
};

// Credential APIs
export const credentialAPI = {
  request: (data) => API.post('/credential/request', data),
  getMyCredentials: () => API.get('/credential/my-credentials'),
  getById: (id) => API.get(`/credential/${id}`),
  retrieve: (id) => API.get(`/credential/${id}/retrieve`)
};

// Issuer APIs
export const issuerAPI = {
  getRequests: () => API.get('/issuer/requests'),
  issueCredential: (id, data) => API.post(`/issuer/issue/${id}`, data),
  getIssued: () => API.get('/issuer/issued'),
  revoke: (id, reason) => API.post(`/issuer/revoke/${id}`, { reason })
};

// Holder APIs
export const holderAPI = {
  getDashboard: () => API.get('/holder/dashboard'),
  shareCredential: (id, data) => API.post(`/holder/share/${id}`, data),
  generateAgeProof: (id, minAge) => API.post(`/holder/proof/age/${id}`, { minAge })
};

// Verifier APIs
export const verifierAPI = {
  verify: (data) => API.post('/verifier/verify', data),
  getHistory: () => API.get('/verifier/history'),
  checkRevocation: (id) => API.get(`/verifier/check-revocation/${id}`),
  getSharedProofs: () => API.get('/verifier/shared-proofs') 
};

export default API;

// ✅ ADD THESE NEW FUNCTIONS AT THE END:

export const getIssuers = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/api/directory/issuers`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching issuers:', error);
    throw error;
  }
};

// Get issuer by DID
export const getIssuerByDID = async (did) => {
  try {
    const response = await axios.get(`${API_URL}/api/directory/issuers/${did}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching issuer:', error);
    throw error;
  }
};

// Get all categories
export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/directory/categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getVerifiers = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/api/directory/verifiers`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching verifiers:', error);
    throw error;
  }
};
