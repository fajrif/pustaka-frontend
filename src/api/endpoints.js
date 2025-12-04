import api from './axios';

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/me'),
  updateMe: (data) => api.put('/me', data),
};

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Budget Items API
export const budgetItemsAPI = {
  getAll: (params) => api.get('/budget-items', { params }),
  getById: (id) => api.get(`/budget-items/${id}`),
  create: (data) => api.post('/budget-items', data),
  update: (id, data) => api.put(`/budget-items/${id}`, data),
  delete: (id) => api.delete(`/budget-items/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Cost Types API
export const costTypesAPI = {
  getAll: () => api.get('/cost-types'),
  getById: (id) => api.get(`/cost-types/${id}`),
  create: (data) => api.post('/cost-types', data),
  update: (id, data) => api.put(`/cost-types/${id}`, data),
  delete: (id) => api.delete(`/cost-types/${id}`),
};
