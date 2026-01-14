import api from './axios';

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/me'),
  updateMe: (data) => api.put('/me', data),
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

// Books API
export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

// Sales Associates API
export const salesAssociatesAPI = {
  getAll: (params) => api.get('/sales-associates', { params }),
  getById: (id) => api.get(`/sales-associates/${id}`),
  create: (data) => api.post('/sales-associates', data),
  update: (id, data) => api.put(`/sales-associates/${id}`, data),
  delete: (id) => api.delete(`/sales-associates/${id}`),
};

// Sales Transactions API
// Sales Transactions API
export const salesTransactionsAPI = {
  getAll: (params) => api.get('/sales-transactions', { params }),
  getById: (id) => api.get(`/sales-transactions/${id}`),
  create: (data) => api.post('/sales-transactions', data),
  update: (id, data) => api.put(`/sales-transactions/${id}`, data),
  delete: (id) => api.delete(`/sales-transactions/${id}`),
  
  // Payments (New)
  getPayments: (transactionId) => api.get(`/sales-transactions/${transactionId}/payments`),
  createPayment: (transactionId, data) => api.post(`/sales-transactions/${transactionId}/payments`, data),
  deletePayment: (transactionId, paymentId) => api.delete(`/sales-transactions/${transactionId}/payments/${paymentId}`),

  // Shippings (New)
  getShippings: (transactionId) => api.get(`/sales-transactions/${transactionId}/shippings`),
  createShipping: (transactionId, data) => api.post(`/sales-transactions/${transactionId}/shippings`, data),
  updateShipping: (transactionId, shippingId, data) => api.put(`/sales-transactions/${transactionId}/shippings/${shippingId}`, data),
  deleteShipping: (transactionId, shippingId) => api.delete(`/sales-transactions/${transactionId}/shippings/${shippingId}`),
};

// Billers API
export const billersAPI = {
  getAll: (params) => api.get('/billers', { params }),
  getById: (id) => api.get(`/billers/${id}`),
  create: (data) => api.post('/billers', data),
  update: (id, data) => api.put(`/billers/${id}`, data),
  delete: (id) => api.delete(`/billers/${id}`),
};

// Curriculums API
export const curriculumsAPI = {
  getAll: (params) => api.get('/curriculums', { params }),
  getById: (id) => api.get(`/curriculums/${id}`),
  create: (data) => api.post('/curriculums', data),
  update: (id, data) => api.put(`/curriculums/${id}`, data),
  delete: (id) => api.delete(`/curriculums/${id}`),
};

// Purchase Transactions API
export const purchaseTransactionsAPI = {
  getAll: (params) => api.get('/purchase-transactions', { params }),
  getById: (id) => api.get(`/purchase-transactions/${id}`),
  create: (data) => api.post('/purchase-transactions', data),
  update: (id, data) => api.put(`/purchase-transactions/${id}`, data),
  delete: (id) => api.delete(`/purchase-transactions/${id}`),
  complete: (id) => api.post(`/purchase-transactions/${id}/complete`),
  cancel: (id) => api.post(`/purchase-transactions/${id}/cancel`),
  uploadReceipt: (id, data) => api.put(`/purchase-transactions/${id}/receipt`, data),
};

// Reports API
export const reportsAPI = {
  getBooksStock: (params) => api.get('/reports/books-stock', { params }),
  getCredits: (params) => api.get('/reports/credits', { params }),
  getPurchases: (params) => api.get('/reports/purchases', { params }),
  getSales: (params) => api.get('/reports/sales', { params }),
};
