import React, { createContext, useContext, useState, useEffect } from "react";
import {
  loginUser,
  registerUser,
  getProfile,
  logoutUser,
  updateProfile,
  changePassword,
  forgotPasswordRequest, // Import
  resetPasswordRequest, // Import
} from "../api/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // ✅ Kiểm tra token khi app khởi động
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        // ✅ Nếu là admin và có token, set user luôn không cần gọi API
        if (parsedUser.role === 0) {
          setUser(parsedUser);
          setLoading(false);
          console.log("✅ Admin auto-login from localStorage");
          return;
        }

        // ✅ Nếu là user thường, verify với API
        getProfile()
          .then((res) => {
            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
            console.log("✅ User verified from API");
          })
          .catch((error) => {
            console.error("❌ Token invalid, clearing auth:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (error) {
        console.error("❌ Error parsing user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ Đăng ký
  const register = async (formData) => {
    try {
      const res = await registerUser(formData);
      const data = res.data;

      if (data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error };
    }
  };

  // ✅ Đăng nhập
  const login = async (credentials) => {
    try {
      const res = await loginUser(credentials);
      const data = res.data;

      if (data?.token && data?.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);

        console.log("✅ Login successful:", data.user);
        return { success: true, user: data.user };
      }

      return { success: false };
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error; // Throw để AdminLogin có thể catch
    }
  };

  // ✅ Đăng xuất
  const logout = async () => {
    try {
      await logoutUser();
      console.log("✅ Logout API called");
    } catch (e) {
      console.error("❌ Logout API failed:", e);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      console.log("✅ User logged out");
    }
  };

  // ✅ Cập nhật thông tin user
  const updateUser = async (data) => {
    try {
      const res = await updateProfile(data);
      const updated = res.data.user;
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      console.log("✅ Profile updated:", updated);
      return { success: true, user: updated };
    } catch (error) {
      console.error("❌ Update profile error:", error);
      return { success: false, error };
    }
  };

  // ✅ Đổi mật khẩu
  const changeUserPassword = async (data) => {
    try {
      const res = await changePassword(data);
      console.log("✅ Password changed successfully");
      return { success: true, message: res.data.message };
    } catch (error) {
      console.error("❌ Change password failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể đổi mật khẩu"
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await forgotPasswordRequest(email);
      console.log("✅ Forgot password request sent:", res.data);

      // 👇 Trả thêm dev_reset_url (nếu Laravel có gửi)
      return {
        success: true,
        message: res.data.message,
        dev_reset_url: res.data.dev_reset_url || null, // 👈 thêm dòng này
      };
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể gửi yêu cầu.",
      };
    }
  };


  // ✅ Đặt lại mật khẩu
  const resetPassword = async (data) => {
    try {
      const res = await resetPasswordRequest(data);
      console.log("✅ Password reset successfully:", res.data.message);
      return { success: true, message: res.data.message };
    } catch (error) {
      console.error("❌ Reset password error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Không thể đặt lại mật khẩu. Vui lòng kiểm tra liên kết hoặc email.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        changeUserPassword,
        forgotPassword, // Thêm vào đây
        resetPassword, // Thêm vào đây
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}