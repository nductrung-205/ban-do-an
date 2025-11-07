import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, CheckCircle, AlertCircle, Home, ChefHat, ArrowRight } from "lucide-react"; // Thêm ArrowRight

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Lấy token và email từ URL params
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get("email");
    const tokenParam = queryParams.get("token");

    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
    } else {
      setError("Liên kết đặt lại mật khẩu không hợp lệ.");
      setIsSuccess(false);
    }
  }, [location.search]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    setIsSuccess(false);

    if (!token || !email) {
      setError("Liên kết đặt lại mật khẩu không đầy đủ.");
      setLoading(false);
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword({
        email,
        token,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      if (result.success) {
        setMessage(result.message);
        setIsSuccess(true);
        // Tự động chuyển hướng sau 3 giây
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err.response?.data?.message ||
          "Đã có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <ChefHat className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800">
              Đặt lại mật khẩu
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Nhập mật khẩu mới của bạn bên dưới.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {message && isSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{message}</span>
              </div>
            )}

            {/* Chỉ hiển thị form nếu không có lỗi nghiêm trọng và chưa thành công */}
            {!(error && !isSuccess) && !isSuccess && (
              <>
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      name="password_confirmation"
                      value={form.password_confirmation}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    "Đang đặt lại..."
                  ) : (
                    <>
                      Đặt lại mật khẩu
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </>
            )}

            {/* Nút quay lại trang chủ / đăng nhập */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 flex items-center justify-center gap-2 transition-all mt-4" // Thêm mt-4 để tạo khoảng cách
            >
              <Home className="w-5 h-5" />
              Về trang đăng nhập
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Nếu bạn gặp sự cố, vui lòng liên hệ hỗ trợ.
        </p>
      </div>
    </div>
  );
}