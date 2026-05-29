import apiClient from './apiClient';

export function setApiAuthToken(token?: string) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export const authApi = {
  adminLogin: (data: Record<string, any>) => apiClient.post('/auth/admin-login', data),
};

export const adminApi = {
  // Plantation Admin - Bookings
  getPlantationBookings: (plantationId: string) =>
    apiClient.get(`/admin/bookings/${plantationId}`),

  updateBookingStatus: (plantationId: string, bookingId: string, status: string) =>
    apiClient.put(`/admin/bookings/${plantationId}/${bookingId}`, { status }),

  // Plantation Admin - Reviews
  getPlantationReviews: (plantationId: string) =>
    apiClient.get(`/admin/reviews/${plantationId}`),

  addReviewReply: (plantationId: string, reviewId: string, text: string) =>
    apiClient.post(`/admin/reviews/${plantationId}/${reviewId}/reply`, { text }),

  // Super Admin - Requests & Plantations
  getPendingRequests: () =>
    apiClient.get('/plantation-requests'),

  approvePlantationRequest: (requestId: string, adminUsername: string, adminPassword: string) =>
    apiClient.post(`/plantation-requests/${requestId}/approve`, { adminUsername, adminPassword }),
};

export const plantationApi = {
  getAll: () => apiClient.get('/plantations'),
  getById: (id: string) => apiClient.get(`/plantations/${id}`),
  create: (data: FormData | Record<string, any>) => apiClient.post('/plantations', data),
  update: (id: string, data: FormData | Record<string, any>) => apiClient.put(`/plantations/${id}`, data),
};

export const bookingApi = {
  create: (data: Record<string, any>) => apiClient.post('/bookings', data),
  getAll: () => apiClient.get('/bookings'),
  getById: (id: string) => apiClient.get(`/bookings/${id}`),
  cancel: (id: string) => apiClient.delete(`/bookings/${id}`),
};

export const experienceApi = {
  getByPlantation: (plantationId: string) => apiClient.get(`/experiences/plantation/${plantationId}`),
  create: (data: FormData | Record<string, any>) => apiClient.post('/experiences', data),
  update: (id: string, data: FormData | Record<string, any>) => apiClient.put(`/experiences/${id}`, data),
  createSlot: (id: string, data: Record<string, any>) => apiClient.post(`/experiences/${id}/slots`, data),
};

export const paymentApi = {
  create: (data: Record<string, any>) => apiClient.post('/payments', data),
  getAll: () => apiClient.get('/payments'),
  updateStatus: (id: string, status: string) => apiClient.patch(`/payments/${id}/status`, { status }),
};

export default apiClient;
