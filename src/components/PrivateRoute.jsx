import React from "react";
import { Navigate } from "react-router-dom";

/**
 * @deprecated Sử dụng ProtectedRoute hoặc AdminRoute thay thế
 * Component này không sử dụng AuthContext nên không đồng bộ với hệ thống
 */
export default function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  console.warn("⚠️ PrivateRoute is deprecated. Use ProtectedRoute or AdminRoute instead.");

  // Kiểm tra đăng nhập và role admin
  if (!user || !token || user.role !== 0) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}