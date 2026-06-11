import { apiRequest } from './client.js';

export const authApi = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body), auth: false }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body), auth: false }),
  me: () => apiRequest('/auth/me'),
};

export const bikesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return apiRequest(`/bikes${query ? `?${query}` : ''}`, { auth: false });
  },
  listAuth: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return apiRequest(`/bikes${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/bikes/${id}`, { auth: false }),
  create: (body) => apiRequest('/bikes', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/bikes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggle: (id) => apiRequest(`/bikes/${id}/toggle`, { method: 'PATCH' }),
  delete: (id) => apiRequest(`/bikes/${id}`, { method: 'DELETE' }),
  setVerification: (id, status) =>
    apiRequest(`/bikes/${id}/verification`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const bookingsApi = {
  list: () => apiRequest('/bookings'),
  create: (body) => apiRequest('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id, status) =>
    apiRequest(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignStaff: (id, staffId) =>
    apiRequest(`/bookings/${id}/assign-staff`, { method: 'PATCH', body: JSON.stringify({ staffId }) }),
  requestPickup: (id) =>
    apiRequest(`/bookings/${id}/request-pickup`, { method: 'PATCH' }),
};

export const shopsApi = {
  list: () => apiRequest('/shops'),
  getMine: () => apiRequest('/shops/mine'),
  register: (body) => apiRequest('/shops', { method: 'POST', body: JSON.stringify(body) }),
  updateMine: (body) => apiRequest('/shops/mine', { method: 'PUT', body: JSON.stringify(body) }),
  updateStatus: (id, status) =>
    apiRequest(`/shops/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const paymentsApi = {
  list: () => apiRequest('/payments'),
  createRazorpayOrder: (body) =>
    apiRequest('/payments/razorpay/order', { method: 'POST', body: JSON.stringify(body) }),
  verifyRazorpay: (body) =>
    apiRequest('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(body) }),
};

export const adminApi = {
  stats: () => apiRequest('/admin/stats'),
  shopPayments: () => apiRequest('/admin/shop-payments'),
  payShop: (shopId) => apiRequest(`/admin/shop-payments/${shopId}/pay`, { method: 'POST' }),
  createPayoutOrder: (shopId) => apiRequest(`/admin/shop-payments/${shopId}/razorpay-order`, { method: 'POST' }),
};

export const staffApi = {
  list: () => apiRequest('/staff'),
  create: (body) => apiRequest('/staff', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiRequest(`/staff/${id}`, { method: 'DELETE' }),
};

export const cancellationsApi = {
  listRefunds: () => apiRequest('/refunds'),
  cancelBooking: (body) => apiRequest('/cancel-booking', { method: 'POST', body: JSON.stringify(body) }),
  decideRefund: (id, action) => apiRequest(`/refunds/${id}/decision`, { method: 'POST', body: JSON.stringify({ action }) }),
  acceptAllRefunds: () => apiRequest(`/refunds/accept-all`, { method: 'POST' }),
};

export const extensionsApi = {
  list: () => apiRequest('/extensions'),
  respond: (id, body) => apiRequest(`/extensions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

export const inspectionsApi = {
  list: () => apiRequest('/inspections'),
};

export const reviewsApi = {
  list: () => apiRequest('/reviews'),
};
