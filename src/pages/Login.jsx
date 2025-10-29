import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChefHat, Mail, Lock, ArrowRight, Home } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(form);

      if (result?.success) {
        navigate("/");
      } else {
        setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Sai email hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <ChefHat className="w-20 h-20 mb-6" strokeWidth={1.5} />
          <h1 className="text-5xl font-bold mb-4 text-center">
            Chào mừng trở lại!
          </h1>
          <p className="text-xl text-center opacity-90 max-w-md">
            Khám phá hàng nghìn món ăn ngon từ các nhà hàng hàng đầu
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 opacity-80">
            <div className="w-24 h-24 bg-white/20 rounded-2xl backdrop-blur-sm"></div>
            <div className="w-24 h-24 bg-white/20 rounded-2xl backdrop-blur-sm"></div>
            <div className="w-24 h-24 bg-white/20 rounded-2xl backdrop-blur-sm"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">
              Đăng nhập
            </h2>
            <p className="text-gray-500 mb-8">
              Truy cập vào tài khoản của bạn
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
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
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

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
                  "Đang đăng nhập..."
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* 🚀 Nút quay lại trang chủ */}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-5 h-5" />
                Về trang chủ
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-orange-500 font-semibold hover:text-orange-600 transition"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <a href="#" className="text-orange-500 hover:underline">
              Điều khoản dịch vụ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
