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

// Jenjang Studi API
export const jenjangStudiAPI = {
  getAll: (params) => api.get('/jenjang-studi', { params }),
  getById: (id) => api.get(`/jenjang-studi/${id}`),
  create: (data) => api.post('/jenjang-studi', data),
  update: (id, data) => api.put(`/jenjang-studi/${id}`, data),
  delete: (id) => api.delete(`/jenjang-studi/${id}`),
};

// Bidang Studi API
export const bidangStudiAPI = {
  getAll: (params) => api.get('/bidang-studi', { params }),
  getById: (id) => api.get(`/bidang-studi/${id}`),
  create: (data) => api.post('/bidang-studi', data),
  update: (id, data) => api.put(`/bidang-studi/${id}`, data),
  delete: (id) => api.delete(`/bidang-studi/${id}`),
};

// Kelas API
export const kelasAPI = {
  getAll: (params) => api.get('/kelas', { params }),
  getById: (id) => api.get(`/kelas/${id}`),
  create: (data) => api.post('/kelas', data),
  update: (id, data) => api.put(`/kelas/${id}`, data),
  delete: (id) => api.delete(`/kelas/${id}`),
};

// Cities API
export const citiesAPI = {
  getAll: (params) => api.get('/cities', { params }),
  getById: (id) => api.get(`/cities/${id}`),
  create: (data) => api.post('/cities', data),
  update: (id, data) => api.put(`/cities/${id}`, data),
  delete: (id) => api.delete(`/cities/${id}`),
};

// Expeditions API
export const expeditionsAPI = {
  getAll: (params) => api.get('/expeditions', { params }),
  getById: (id) => api.get(`/expeditions/${id}`),
  create: (data) => api.post('/expeditions', data),
  update: (id, data) => api.put(`/expeditions/${id}`, data),
  delete: (id) => api.delete(`/expeditions/${id}`),
};
