import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { login } = useAuth();

  useEffect(() => {
    if (user && user.role === 0) {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Sử dụng login từ AuthContext
      const result = await login({ email, password });

      if (!result.success) {
        setError("Đăng nhập thất bại!");
        setLoading(false);
        return;
      }

      const { user } = result;

      // ✅ Kiểm tra quyền admin
      if (!user || user.role !== 0) {
        setError("Bạn không có quyền truy cập trang quản trị!");
        setLoading(false);

        // Logout nếu không phải admin
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      // ✅ Đăng nhập thành công và là admin
      console.log("✅ Admin login successful:", user);
      navigate("/admin");

    } catch (err) {
      console.error("❌ Login error:", err);

      if (err.response) {
        if (err.response.status === 401) {
          setError("Sai email hoặc mật khẩu!");
        } else if (err.response.status === 422) {
          setError("Vui lòng nhập đầy đủ và chính xác thông tin!");
        } else {
          setError("Đăng nhập thất bại. Vui lòng thử lại!");
        }
      } else {
        setError("Không thể kết nối đến máy chủ!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 px-4">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-md border border-gray-100">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-4xl">⚙️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">Admin Login</h1>
          <p className="text-gray-600 mt-2">Đăng nhập vào bảng quản trị</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm animate-shake">
            <strong>⚠️ Lỗi:</strong> {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold text-lg transition transform ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-105"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang đăng nhập...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © {new Date().getFullYear()} Admin Dashboard – All rights reserved.
        </p>
      </div>
    </div>
  );
}