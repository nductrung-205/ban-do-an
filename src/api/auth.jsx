import api from "./index";

// Gửi yêu cầu đăng ký tài khoản
export const registerUser = (data) => api.post("/register", data);

// Đăng nhập lấy token
export const loginUser = (credentials) => api.post("/login", credentials);

// Lấy thông tin user hiện tại (qua token)
export const getProfile = () => api.get("/me");

// Đăng xuất
export const logoutUser = () => api.post("/logout");

// Cập nhật hồ sơ
export const updateProfile = (data) => api.put("/update-profile", data);

// Đổi mật khẩu
export const changePassword = (data) => api.post("/change-password", data);

export const forgotPasswordRequest = (email) =>  api.post("/forgot-password", { email });

export const resetPasswordRequest = (data) =>  api.post("/reset-password", data);
