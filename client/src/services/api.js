import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Materials API
export const materialAPI = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  getLowStock: () => api.get('/materials/low-stock'),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getByMaterial: (materialId) => api.get(`/inventory/material/${materialId}`),
  getExpiring: (days = 7) => api.get('/inventory/expiring', { params: { days } }),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  consume: (data) => api.post('/inventory/consume', data),
  markExpired: () => api.put('/inventory/mark-expired'),
};

// Production API
export const productionAPI = {
  getAll: (params) => api.get('/production', { params }),
  getById: (id) => api.get(`/production/${id}`),
  getByDateRange: (start, end) => api.get('/production/date-range', { params: { start, end } }),
  create: (data) => api.post('/production', data),
  update: (id, data) => api.put(`/production/${id}`, data),
  delete: (id) => api.delete(`/production/${id}`),
};

// Waste API
export const wasteAPI = {
  getAll: (params) => api.get('/waste', { params }),
  getSummary: () => api.get('/waste/summary'),
  getByCategory: () => api.get('/waste/by-category'),
  getByLine: () => api.get('/waste/by-line'),
  create: (data) => api.post('/waste', data),
};

// Forecast API
export const forecastAPI = {
  getAll: () => api.get('/forecasts'),
  getBySku: (sku) => api.get(`/forecasts/${sku}`),
  getDemandVsInventory: () => api.get('/forecasts/demand-vs-inventory'),
  generate: (data) => api.post('/forecasts/generate', data),
  generateAll: () => api.post('/forecasts/generate-all'),
};

// Alert API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getUnreadCount: () => api.get('/alerts/unread-count'),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/mark-all-read'),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export default api;
