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
  togglePlantationDisabled: (plantationId: string, disabled: boolean) =>
    apiClient.put(`/admin/plantations/${plantationId}/toggle-disabled`, { disabled }),
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
  getSlots: (id: string) => apiClient.get(`/experiences/${id}/slots`),
  create: (data: FormData | Record<string, any>) => apiClient.post('/experiences', data),
  update: (id: string, data: FormData | Record<string, any>) => apiClient.put(`/experiences/${id}`, data),
  delete: (id: string) => apiClient.delete(`/experiences/${id}`),
  deleteImage: (id: string, imageUrl: string) =>
    apiClient.delete(`/experiences/${id}/images`, { data: { image_url: imageUrl } }),
  createSlot: (id: string, data: Record<string, any>) => apiClient.post(`/experiences/${id}/slots`, data),
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
  create: (data: Record<string, any>) => apiClient.post('/payments', data),
  getAll: () => apiClient.get('/payments'),
  updateStatus: (id: string, status: string) => apiClient.patch(`/payments/${id}/status`, { status }),
  payhereInitiate: (data: Record<string, any>) => apiClient.post('/payments/payhere/initiate', data),
  payheresSavePayment: (bookingReference: string, paymentId: string) =>
    apiClient.post('/payments/payhere/save-payment', { booking_reference: bookingReference, payment_id: paymentId }),
};

export const contactApi = {
  submit: (data: Record<string, string>) => apiClient.post('/contact', data),
  getAll: () => apiClient.get('/contact'),
  resolve: (id: string, resolved_message?: string) =>
    apiClient.patch(`/contact/${id}/resolve`, { resolved_message }),
};

export default apiClient;
