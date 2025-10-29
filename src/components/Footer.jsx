import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-4xl">🍜</span>
              <h3 className="text-xl font-bold">Nguyễn Đức Trung</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Chuyên cung cấp các món ăn ngon, chất lượng. 
              Giao hàng nhanh chóng, tận tâm phục vụ.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="/" className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition">
                📘
              </a>
              <a href="/" className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition">
                📷
              </a>
              <a href="/" className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition">
                🐦
              </a>
            </div>
          </div>

       
          <div>
            <h4 className="font-bold text-lg mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-orange-500 transition">Trang chủ</Link></li>
              <li><Link to="/menu" className="hover:text-orange-500 transition">Thực đơn</Link></li>
              <li><Link to="/cart" className="hover:text-orange-500 transition">Giỏ hàng</Link></li>
              <li><Link to="/profile" className="hover:text-orange-500 transition">Tài khoản</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-orange-500 transition">Chính sách giao hàng</a></li>
              <li><a href="/" className="hover:text-orange-500 transition">Chính sách đổi trả</a></li>
              <li><a href="/" className="hover:text-orange-500 transition">Phương thức thanh toán</a></li>
              <li><a href="/" className="hover:text-orange-500 transition">Câu hỏi thường gặp</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <a href="tel:0123456789" className="hover:text-orange-500 transition">0123 456 789</a>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:contact@example.com" className="hover:text-orange-500 transition">contact@example.com</a>
              </li>
              <li className="flex items-center gap-2">
                <span>🕐</span>
                <span>8:00 - 22:00 hàng ngày</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2025 Nguyễn Đức Trung. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="/" className="hover:text-orange-500 transition">Điều khoản sử dụng</a>
            <a href="/" className="hover:text-orange-500 transition">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}