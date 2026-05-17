import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
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

export default api;
