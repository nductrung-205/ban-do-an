import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [result, setResult] = useState(null); // ✅ thêm state để lưu kết quả API

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccess(false);
    setResult(null); // reset kết quả cũ

    try {
      const res = await forgotPassword(email);
      setResult(res); // ✅ lưu kết quả API để dùng trong JSX

      if (res.success) {
        setMessage(res.message);
        setIsSuccess(true);
      } else {
        setMessage(res.message || "Gửi liên kết thất bại.");
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Forgot password submit error:", error);
      setMessage("Đã có lỗi xảy ra. Vui lòng thử lại.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAndReset = () => {
    setEmail("");
    setMessage("");
    setIsSuccess(false);
    setResult(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={handleCloseAndReset}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <Mail className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-800">Quên mật khẩu?</h3>
          <p className="text-gray-500 text-sm mt-2">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              required
            />
          </div>

          {/* Thông báo */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                isSuccess
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {isSuccess ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message}</span>
            </div>
          )}

         
          {isSuccess && result?.dev_reset_url && (
            <p className="text-sm text-gray-600 mt-2">
              Link đặt lại (DEV):{" "}
              <a
                href={result.dev_reset_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 underline"
              >
                Mở liên kết
              </a>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Gửi liên kết
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
