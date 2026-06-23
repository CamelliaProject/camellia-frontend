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
  changePassword: (newPassword: string) => apiClient.put('/auth/change-password', { newPassword }),
  forgotPassword: (username: string) => apiClient.post('/auth/forgot-password', { username }),
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
};

export const adminApi = {
  // Plantation Admin - Bookings
  getPlantationBookings: (plantationId: string) =>
    apiClient.get(`/admin/bookings/${plantationId}`),

  updateBookingStatus: (plantationId: string, bookingId: string, status: string, reason?: string) =>
    apiClient.put(`/admin/bookings/${plantationId}/${bookingId}`, { status, reason }),

  // Plantation Admin - Payments (derived from bookings)
  getPlantationPayments: (plantationId: string) =>
    apiClient.get(`/admin/payments/${plantationId}`),

  // Plantation Admin - Reviews
  getPlantationReviews: (plantationId: string) =>
    apiClient.get(`/admin/reviews/${plantationId}`),

  addReviewReply: (plantationId: string, reviewId: string, text: string) =>
    apiClient.post(`/admin/reviews/${plantationId}/${reviewId}/reply`, { text }),

  // Super Admin - All plantations (with publish & credential status)
  getAllPlantations: () =>
    apiClient.get('/admin/plantations'),

  // Super Admin - Requests
  getPendingRequests: () =>
    apiClient.get('/plantation-requests'),

  approvePlantationRequest: (requestId: string) =>
    apiClient.post(`/plantation-requests/${requestId}/approve`),

  rejectPlantationRequest: (requestId: string, reason: string) =>
    apiClient.post(`/plantation-requests/${requestId}/reject`, { reason }),

  // Super Admin - Subscriptions
  getSubscriptions: () => apiClient.get('/admin/subscriptions'),
  getSubscriptionEarnings: () => apiClient.get('/admin/subscription-earnings'),
};

export const plantationApi = {
  getAll: () => apiClient.get('/plantations'),
  getById: (id: string) => apiClient.get(`/plantations/${id}`),
  create: (data: FormData | Record<string, any>) => apiClient.post('/plantations', data),
  update: (id: string, data: FormData | Record<string, any>) => apiClient.put(`/plantations/${id}`, data),
  publish: (id: string) => apiClient.put(`/plantations/${id}/publish`),
  addGalleryImages: (id: string, data: FormData) => apiClient.post(`/plantations/${id}/gallery`, data),
  deleteGalleryImage: (id: string, imageUrl: string) =>
    apiClient.delete(`/plantations/${id}/gallery`, { data: { image_url: imageUrl } }),
};

export const bookingApi = {
  create: (data: Record<string, any>) => apiClient.post('/bookings', data),
  getAll: () => apiClient.get('/bookings'),
  getById: (id: string) => apiClient.get(`/bookings/${id}`),
  cancel: (id: string) => apiClient.delete(`/bookings/${id}`),
};

export const experienceApi = {
  getByPlantation: (plantationId: string) => apiClient.get(`/experiences/plantation/${plantationId}`),
  // Legacy per-date slots (kept for backward compat)
  getSlots: (id: string, date?: string) =>
    apiClient.get(`/experiences/${id}/slots`, { params: date ? { date } : undefined }),
  create: (data: FormData | Record<string, any>) => apiClient.post('/experiences', data),
  update: (id: string, data: FormData | Record<string, any>) => apiClient.put(`/experiences/${id}`, data),
  delete: (id: string) => apiClient.delete(`/experiences/${id}`),
  deleteImage: (id: string, imageUrl: string) =>
    apiClient.delete(`/experiences/${id}/images`, { data: { image_url: imageUrl } }),
  // Weekly recurring schedule
  getWeeklySlots: (id: string) => apiClient.get(`/experiences/${id}/weekly-slots`),
  createWeeklySlot: (id: string, data: { day_of_week: number; slot_time: string; capacity: number }) =>
    apiClient.post(`/experiences/${id}/weekly-slots`, data),
  updateWeeklySlot: (id: string, slotId: string, data: { capacity: number }) =>
    apiClient.put(`/experiences/${id}/weekly-slots/${slotId}`, data),
  deleteWeeklySlot: (id: string, slotId: string) =>
    apiClient.delete(`/experiences/${id}/weekly-slots/${slotId}`),
  // Computed availability for a specific date (uses weekly schedule + live booking counts)
  getAvailability: (id: string, date: string) =>
    apiClient.get(`/experiences/${id}/availability`, { params: { date } }),
};

export const availabilityApi = {
  getSettings: (plantationId: string) =>
    apiClient.get(`/plantations/${plantationId}/availability-settings`),
  updateUnavailableDays: (plantationId: string, days: number[]) =>
    apiClient.put(`/plantations/${plantationId}/unavailable-days`, { days }),
  addClosingDate: (plantationId: string, close_date: string, reason?: string) =>
    apiClient.post(`/plantations/${plantationId}/closing-dates`, { close_date, reason }),
  removeClosingDate: (plantationId: string, closeId: string) =>
    apiClient.delete(`/plantations/${plantationId}/closing-dates/${closeId}`),
  // Plantation-level time slots
  getTimeSlots: (plantationId: string) =>
    apiClient.get(`/plantations/${plantationId}/time-slots`),
  getSlotAvailability: (plantationId: string, date: string) =>
    apiClient.get(`/plantations/${plantationId}/time-slots/availability`, { params: { date } }),
  createTimeSlot: (plantationId: string, data: { day_of_week: number; slot_time: string; capacity: number }) =>
    apiClient.post(`/plantations/${plantationId}/time-slots`, data),
  updateTimeSlot: (plantationId: string, slotId: string, data: { capacity: number }) =>
    apiClient.put(`/plantations/${plantationId}/time-slots/${slotId}`, data),
  deleteTimeSlot: (plantationId: string, slotId: string) =>
    apiClient.delete(`/plantations/${plantationId}/time-slots/${slotId}`),
};

export const reviewApi = {
  getByPlantation: (plantationId: string) => apiClient.get(`/reviews/plantation/${plantationId}`),
  getMyReviews: () => apiClient.get('/reviews/my-reviews'),
  create: (data: Record<string, any>) => apiClient.post('/reviews', data),
  uploadImage: (formData: FormData) =>
    apiClient.post('/reviews/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addReply: (reviewId: string, content: string) =>
    apiClient.post(`/reviews/${reviewId}/replies`, { content }),
  deleteReply: (reviewId: string, replyId: string) =>
    apiClient.delete(`/reviews/${reviewId}/replies/${replyId}`),
  reactToReview: (reviewId: string) =>
    apiClient.patch(`/reviews/${reviewId}/helpful`),
  reactToReply: (reviewId: string, replyId: string) =>
    apiClient.patch(`/reviews/${reviewId}/replies/${replyId}/helpful`),
};

export const paymentApi = {
  getAll: () => apiClient.get('/payments'),
  updateStatus: (id: string, status: string) => apiClient.patch(`/payments/${id}/status`, { status }),
  payhereInitiate: (data: Record<string, any>) => apiClient.post('/payments/payhere/initiate', data),
  payheresSavePayment: (bookingReference: string, paymentId: string) =>
    apiClient.post('/payments/payhere/save-payment', { booking_reference: bookingReference, payment_id: paymentId }),
};

export const settingsApi = {
  getExchangeRate: () => apiClient.get<{ usd_to_lkr: number }>('/settings/exchange-rate'),
};

export const contactApi = {
  submit: (data: Record<string, string>) => apiClient.post('/contact', data),
  getAll: () => apiClient.get('/contact'),
  resolve: (id: string, resolved_message?: string) =>
    apiClient.patch(`/contact/${id}/resolve`, { resolved_message }),
};

export default apiClient;
