import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem("token");
  const location = useLocation();

  // Chờ AuthContext load xong
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Đang kiểm tra quyền truy cập...</p>
          <p className="text-gray-500 text-sm mt-2">Vui lòng đợi</p>
        </div>
      </div>
    );
  }

  // ✅ Nếu đang ở ngoài /admin, KHÔNG redirect về /admin/login
  if (!location.pathname.startsWith("/admin")) {
    return children;
  }

  // Nếu chưa đăng nhập → chỉ lúc vào admin thì mới chuyển hướng
  if (!user || !token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Nếu không phải admin
  if (user.role !== 0) {
    return <Navigate to="/" replace />;
  }

  return children;
}
