import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý lỗi chung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      // ✅ Chỉ redirect nếu đã có token (tức là user đang login rồi)
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);


export const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/60";
  return imagePath.startsWith("http")
    ? imagePath
    : `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}/storage/${imagePath}`;
};


// ==================== USERS ====================
export const userAPI = {
  getAll: (params) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  bulkDelete: (ids) => api.post('/admin/users/bulk-delete', { ids }),
};

// ==================== PRODUCTS ====================
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getAllAdmin: (params) => api.get('/admin/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data, config = {}) => api.post("/admin/products", data, config),
  update: (id, data) => api.post(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
  updateStock: (id, stock) => api.put(`/admin/products/${id}/stock`, { stock }),
  toggleStatus: (id) => api.put(`/admin/products/${id}/toggle-status`),
  bulkDelete: (ids) => api.post('/admin/products/bulk-delete', { ids }),
  getByCategory: (categoryId) => api.get(`/categories/${categoryId}/products`),

  importProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ==================== ORDERS ====================
export const orderAPI = {
  getAll: (params) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/admin/orders/${id}`, data),
  updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/admin/orders/${id}`),
  bulkDelete: (ids) => api.post('/admin/orders/bulk-delete', { ids }),
  getStatistics: (period = 'month') => api.get('/admin/orders/statistics', { params: { period } }),
};

// ==================== USER ORDERS ====================
export const getMyOrders = async () => {
  return await api.get('/orders/my-orders');
};

export const cancelOrder = async (orderId) => {
  return await api.put(`/orders/${orderId}/cancel`);
};

// ==================== CATEGORIES ====================
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/admin/categories/${id}`),
  create: (data) => api.post('/admin/categories', data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/categories/${id}`),
};

// ==================== AUTH ====================
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (data) => api.post('/register', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  updateProfile: (data) => api.put('/update-profile', data),
  changePassword: (data) => api.post('/change-password', data),
};

// ==================== BANNERS ====================
export const bannerAPI = {
  getAll: () => api.get('/banners'),
  create: (data) => api.post('/admin/banners', data),
  update: (id, data) => api.put(`/admin/banners/${id}`, data),
  delete: (id) => api.delete(`/admin/banners/${id}`),
};

// ==================== COUPONS ====================
export const couponAPI = {
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/admin/coupons', data),
  update: (id, data) => api.put(`/admin/coupons/${id}`, data),
  delete: (id) => api.delete(`/admin/coupons/${id}`),
  apply: (data) => api.post('/apply-coupon', data),
};

// ==================== LEGACY EXPORTS ====================
export const updateProfile = (data) => api.put("/update-profile", data);
export const changePassword = (data) => api.post("/change-password", data);
export const getProductDetail = (id) => api.get(`/products/${id}`);
export const getProductsByCategory = (category_id) => api.get(`/categories/${category_id}/products`);
export const getCategories = () => api.get("/categories");
export const getProductsByCategorySlug = (slug) => api.get(`/categories/${slug}/products`);

// ==================== REVIEWS ====================
export const reviewAPI = {
  getAll: (params) => api.get('/admin/reviews', { params }),
  getByProduct: (productId) => api.get(`/products/${productId}/reviews`),
  create: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  toggle: (id) => api.put(`/admin/reviews/${id}/toggle`),
};

export const notificationAPI = {
  getAll: () => api.get("/notifications"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
  create: (data) => api.post("/notifications", data),
  getUnreadCount: () => api.get("/notifications/unread-count"),

  getAllAdmin: (params) => api.get("/admin/notifications/all", { params }), // Lấy TẤT CẢ thông báo (cho admin)
  createAdmin: (data) => api.post("/admin/notifications", data), // Admin tạo thông báo cho user cụ thể
  updateAdmin: (id, data) => api.put(`/admin/notifications/${id}`, data), // Admin sửa thông báo
  deleteAdmin: (id) => api.delete(`/admin/notifications/${id}`), // Admin xóa thông báo
  toggleReadStatusAdmin: (id) => api.put(`/admin/notifications/${id}/toggle-read`), // Admin chuyển đổi trạng thái đọc
  sendToAllUsersAdmin: (data) => api.post("/admin/notifications/send-to-all", data),
};

export const vnpayAPI = {
  createPayment: (data) => api.post('/vnpay/create-payment', data),
};

export const momoAPI = {
  // Nhận một đối tượng chứa amount và your_internal_order_id
  createPayment: (data) => api.post('/momo/create-payment', data),
  transactionStatus: (orderId) => api.get(`/momo/status/${orderId}`),
};

export default api;