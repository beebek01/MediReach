const API_BASE = "/api";

async function request(
  endpoint,
  { method = "GET", body, token, headers: extra } = {},
) {
  const headers = { ...extra };
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || res.statusText || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload }),

  refreshToken: (refreshToken) =>
    request("/auth/refresh-token", { method: "POST", body: { refreshToken } }),

  logout: (refreshToken, token) =>
    request("/auth/logout", { method: "POST", body: { refreshToken }, token }),

  getProfile: (token) => request("/auth/me", { token }),

  changePassword: (body, token) =>
    request("/auth/change-password", { method: "POST", body, token }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),

  verifyResetCode: (email, code) =>
    request("/auth/verify-reset-code", {
      method: "POST",
      body: { email, code },
    }),

  resetPassword: (email, code, newPassword) =>
    request("/auth/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
    }),

  googleAuth: (idToken) =>
    request("/auth/google", { method: "POST", body: { idToken } }),

  appleAuth: ({ idToken, authorizationCode, fullName }) =>
    request("/auth/apple", {
      method: "POST",
      body: { idToken, authorizationCode, fullName },
    }),

  // Medicines
  getMedicines: (params = "") =>
    request(`/medicines${params ? "?" + params : ""}`),
  getMedicine: (id) => request(`/medicines/${id}`),
  createMedicine: (body, token) =>
    request("/medicines", { method: "POST", body, token }),
  updateMedicine: (id, body, token) =>
    request(`/medicines/${id}`, { method: "PUT", body, token }),
  deleteMedicine: (id, token) =>
    request(`/medicines/${id}`, { method: "DELETE", token }),

  // ─── Stats / Dashboard ───
  getPublicStats: () => request("/stats/public"),
  getAdminStats: (token) => request("/stats/admin", { token }),
  getCustomerStats: (token) => request("/stats/customer", { token }),
  getPharmacistStats: (token) => request("/stats/pharmacist", { token }),

  // ─── Cart ───
  getCart: (token) => request("/cart", { token }),

  addToCart: (body, token) =>
    request("/cart/items", { method: "POST", body, token }),

  updateCartItem: (medicineId, body, token) =>
    request(`/cart/items/${medicineId}`, { method: "PUT", body, token }),

  removeCartItem: (medicineId, token) =>
    request(`/cart/items/${medicineId}`, { method: "DELETE", token }),

  clearCart: (token) => request("/cart", { method: "DELETE", token }),

  // ─── Wishlist ───
  getWishlist: (token) => request("/wishlist", { token }),

  getWishlistIds: (token) => request("/wishlist/ids", { token }),

  addToWishlist: (body, token) =>
    request("/wishlist/items", { method: "POST", body, token }),

  toggleWishlist: (body, token) =>
    request("/wishlist/toggle", { method: "POST", body, token }),

  removeFromWishlist: (medicineId, token) =>
    request(`/wishlist/items/${medicineId}`, { method: "DELETE", token }),

  clearWishlist: (token) => request("/wishlist", { method: "DELETE", token }),

  // ─── Orders ───
  checkout: (body, token) =>
    request("/orders/checkout", { method: "POST", body, token }),

  getMyOrders: (params, token) =>
    request(`/orders/my${params ? "?" + params : ""}`, { token }),

  getOrder: (id, token) => request(`/orders/${id}`, { token }),

  getOrderTracking: (id, token) => request(`/orders/${id}/tracking`, { token }),

  updateDeliveryLocation: (id, body, token) =>
    request(`/orders/${id}/location`, { method: "PATCH", body, token }),

  setOrderDestination: (id, body, token) =>
    request(`/orders/${id}/destination`, { method: "PATCH", body, token }),

  getAllOrders: (params, token) =>
    request(`/orders${params ? "?" + params : ""}`, { token }),

  updateOrderStatus: (id, body, token) =>
    request(`/orders/${id}/status`, { method: "PATCH", body, token }),

  cancelOrder: (id, token) =>
    request(`/orders/${id}/cancel`, { method: "POST", token }),

  // ─── Payments ───
  initiateImepay: (body, token) =>
    request("/payments/imepay/initiate", { method: "POST", body, token }),

  verifyImepay: (body, token) =>
    request("/payments/imepay/verify", { method: "POST", body, token }),

  getOrderPayments: (orderId, token) =>
    request(`/payments/order/${orderId}`, { token }),

  // ─── Users (Admin) ───
  getAllUsers: (params, token) =>
    request(`/users${params ? "?" + params : ""}`, { token }),

  getUser: (id, token) => request(`/users/${id}`, { token }),

  updateUserStatus: (id, body, token) =>
    request(`/users/${id}/status`, { method: "PATCH", body, token }),

  createPharmacist: (body, token) =>
    request("/users/pharmacist", { method: "POST", body, token }),

  deleteUser: (id, token) =>
    request(`/users/${id}`, { method: "DELETE", token }),

  // ─── Prescriptions ───
  uploadPrescription: (file, notes, token) => {
    const fd = new FormData();
    fd.append("prescription", file);
    if (notes) fd.append("notes", notes);
    return request("/prescriptions", { method: "POST", body: fd, token });
  },

  getMyPrescriptions: (token) => request("/prescriptions/my", { token }),

  getApprovedPrescriptions: (token) =>
    request("/prescriptions/approved", { token }),

  getAllPrescriptions: (status, token) =>
    request(`/prescriptions${status ? "?status=" + status : ""}`, { token }),

  getPrescription: (id, token) => request(`/prescriptions/${id}`, { token }),

  reviewPrescription: (id, body, token) =>
    request(`/prescriptions/${id}/review`, { method: "PATCH", body, token }),

  // ─── Chat (MediBot) ───
  chatWithBot: (message, history, { image, audio, language } = {}) =>
    request("/chat", {
      method: "POST",
      body: { message, history, image, audio, language },
    }),

  transcribeAudio: (audio, language) =>
    request("/chat/transcribe", {
      method: "POST",
      body: { audio, language },
    }),
};

export default api;
