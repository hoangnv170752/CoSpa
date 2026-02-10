import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', {
    method: config.method,
    url: config.url,
    data: config.data,
    headers: config.headers
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export interface UserData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  user: unknown;
  token: string;
}

export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (userData: UserData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  googleAuth: async (token: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', {
      token: token,
      role: 'USER'
    });
    return response.data;
  },

  sendOTP: async (email: string): Promise<unknown> => {
    const response = await api.post('/auth/otp/send', { email });
    return response.data;
  },

  verifyOTP: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/otp/verify', { email, otp });
    return response.data;
  },
};

export default api;
