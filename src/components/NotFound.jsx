import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-lg">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 animate-bounce">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="text-6xl mb-6 animate-pulse">🍔❌</div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Oops! Trang không tồn tại
        </h2>
        <p className="text-gray-600 mb-8 text-lg">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa. 
          <br />
          Hãy quay về trang chủ để tiếp tục mua sắm nhé!
        </p>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            ← Quay lại
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            🏠 Về trang chủ
          </button>
        </div>

        {/* Additional Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Hoặc xem các trang khác:</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate("/products")}
              className="text-orange-600 hover:underline text-sm font-medium"
            >
              Sản phẩm
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigate("/orders")}
              className="text-orange-600 hover:underline text-sm font-medium"
            >
              Đơn hàng
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigate("/profile")}
              className="text-orange-600 hover:underline text-sm font-medium"
            >
              Tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}