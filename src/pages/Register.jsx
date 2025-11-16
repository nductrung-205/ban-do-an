import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Xử lý thay đổi input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateRegister = () => {
    setError("");

    // Fullname
    if (!form.fullname) {
      setError("Vui lòng nhập họ tên.");
      return false;
    }

    if (form.fullname.length > 255) {
      setError("Họ tên không được quá 255 ký tự.");
      return false;
    }

    // Email
    if (!form.email) {
      setError("Vui lòng nhập email.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Email không hợp lệ.");
      return false;
    }

    if (form.email.length > 255) {
      setError("Email không được quá 255 ký tự.");
      return false;
    }

    // Password
    if (!form.password) {
      setError("Vui lòng nhập mật khẩu.");
      return false;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }

    if (form.password.length > 64) {
      setError("Mật khẩu không được vượt quá 64 ký tự.");
      return false;
    }

    // Confirm password
    if (form.password !== form.password_confirmation) {
      setError("Xác nhận mật khẩu không khớp.");
      return false;
    }

    return true;
  };


  // Gửi form đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateRegister()) return;
    
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await register(form);

      if (res?.user) {
        // ✅ Hiển thị confirm sau khi đăng ký
        const confirmLogin = window.confirm(
          "🎉 Đăng ký thành công! Bạn có muốn đăng nhập ngay không?"
        );

        if (confirmLogin) {
          // Nếu đồng ý → đăng nhập ngay luôn
          const loginResult = await login({
            email: form.email,
            password: form.password,
          });

          if (loginResult?.success) {
            navigate("/");
          } else {
            setMessage("Đăng ký thành công, nhưng đăng nhập thất bại. Hãy thử lại!");
          }
        } else {
          // Nếu không đăng nhập ngay
          setMessage("🎉 Bạn đã đăng ký thành công! Vui lòng đăng nhập khi sẵn sàng.");
        }
      } else {
        setError("Đăng ký thất bại, vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Register error:", err);
      const apiError = err.response?.data?.message || "Lỗi không xác định";
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Đăng ký tài khoản
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ tên */}
          <div>
            <label className="block text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              placeholder="Nhập họ tên của bạn"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"

            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Nhập email"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"

            />
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"

            />
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"

            />
          </div>

          {/* Hiển thị lỗi hoặc thông báo */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}

          {/* Nút đăng ký */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 mt-2 text-white rounded-md transition-all ${loading
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
              }`}
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        {/* Liên kết đăng nhập */}
        <p className="text-sm mt-6 text-center text-gray-600">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-orange-500 font-medium hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
