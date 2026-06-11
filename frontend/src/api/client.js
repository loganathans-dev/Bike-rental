import { getTokenForApi } from '../utils/auth.js';

// Use Vite proxy (/api → localhost:5000) in dev; override with VITE_API_URL if needed
const API_BASE = import.meta.env.VITE_API_URL || 'https://bike-rental-2lml.onrender.com/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const { auth = true, ...fetchOptions } = options;
  const headers = { 'Content-Type': 'application/json', ...fetchOptions.headers };

  if (auth) {
    const token = getTokenForApi();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }

  return data;
}
