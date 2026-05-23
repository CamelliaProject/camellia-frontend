import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setApiAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export const adminApi = {
  // Plantation Admin - Bookings
  getPlantationBookings: (plantationId: string) =>
    api.get(`/admin/bookings/${plantationId}`),

  updateBookingStatus: (plantationId: string, bookingId: string, status: string) =>
    api.put(`/admin/bookings/${plantationId}/${bookingId}`, { status }),

  // Plantation Admin - Reviews
  getPlantationReviews: (plantationId: string) =>
    api.get(`/admin/reviews/${plantationId}`),

  addReviewReply: (plantationId: string, reviewId: string, text: string) =>
    api.post(`/admin/reviews/${plantationId}/${reviewId}/reply`, { text }),

  // Super Admin - Requests & Plantations
  getPendingRequests: () =>
    api.get('/plantation-requests'),

  approvePlantationRequest: (requestId: string, adminUsername: string, adminPassword: string) =>
    api.post(`/plantation-requests/${requestId}/approve`, { adminUsername, adminPassword }),
};

export const plantationApi = {
  getAll: () => api.get('/plantations'),
  getById: (id: string) => api.get(`/plantations/${id}`),
  create: (data: FormData | Record<string, any>) => api.post('/plantations', data),
  update: (id: string, data: FormData | Record<string, any>) => api.put(`/plantations/${id}`, data),
};

export const bookingApi = {
  create: (data: Record<string, any>) => api.post('/bookings', data),
  getAll: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
};

export const experienceApi = {
  getByPlantation: (plantationId: string) => api.get(`/experiences/plantation/${plantationId}`),
  create: (data: FormData | Record<string, any>) => api.post('/experiences', data),
  update: (id: string, data: FormData | Record<string, any>) => api.put(`/experiences/${id}`, data),
  createSlot: (id: string, data: Record<string, any>) => api.post(`/experiences/${id}/slots`, data),
};

export const paymentApi = {
  create: (data: Record<string, any>) => api.post('/payments', data),
  getAll: () => api.get('/payments'),
  updateStatus: (id: string, status: string) => api.patch(`/payments/${id}/status`, { status }),
};

export default api;
