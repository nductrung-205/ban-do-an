import React, { useEffect, useState } from "react";
import { notificationAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header"; // Giả định bạn có Header component
import Footer from "../components/Footer"; // Giả định bạn có Footer component
import { Link } from "react-router-dom"; // Import Link để điều hướng

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false); // Dừng loading nếu không có user
      setError("Bạn cần đăng nhập để xem thông báo.");
      return;
    }

    setLoading(true);
    setError(null);
    notificationAPI.getAll()
      .then(res => {
        setNotifications(res.data.data ? res.data.data.reverse() : []); // Đảo ngược để thông báo mới nhất lên đầu
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải thông báo:", err);
        setError("Không thể tải thông báo. Vui lòng thử lại sau.");
        setLoading(false);
      });
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Lỗi khi đánh dấu đã đọc:", err);
      alert("Không thể đánh dấu thông báo là đã đọc. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
      try {
        await notificationAPI.delete(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
      } catch (err) {
        console.error("Lỗi khi xóa thông báo:", err);
        alert("Không thể xóa thông báo. Vui lòng thử lại.");
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_success':
        return '🎉'; // Success/Order placed
      case 'order_cancel':
        return '❌'; // Order cancelled
      case 'promotion':
        return '🎁'; // Promotion
      case 'warning':
        return '⚠️'; // Warning
      case 'info':
        return 'ℹ️'; // General info
      default:
        return '🔔'; // Default bell
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4 mx-auto"></div>
            <p>Đang tải thông báo của bạn...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-3xl font-extrabold text-orange-600 flex items-center gap-3">
              <span className="text-4xl">📬</span> Thông báo của tôi
            </h1>
          
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Lỗi!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg mb-4">Bạn chưa có thông báo nào.</p>
              <span className="block text-6xl mb-4" role="img" aria-label="empty box">📦</span>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-transform transform hover:-translate-y-1 shadow-md"
              >
                <span role="img" aria-label="shopping cart" className="mr-2">🛍️</span> Bắt đầu mua sắm ngay!
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-5 rounded-xl shadow-sm transition-all duration-200 ease-in-out flex items-start gap-4
                    ${n.is_read ? "bg-white border border-gray-200 text-gray-700" : "bg-orange-50 border border-orange-200 text-gray-800 hover:shadow-md"}`}
                >
                  <div className={`flex-shrink-0 text-3xl ${n.is_read ? 'text-gray-400' : 'text-orange-500'}`}>
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${n.is_read ? 'text-gray-600' : 'text-orange-800'}`}>
                      {n.title}
                    </h3>
                    <p className="text-sm mt-1">{n.message}</p>
                    <span className="text-xs text-gray-400 mt-2 block">
                      {new Date(n.created_at).toLocaleString("vi-VN", {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex flex-shrink-0 gap-2 self-center">
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="px-4 py-2 text-sm bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                        title="Đánh dấu đã đọc"
                      >
                        Đã đọc
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                      title="Xóa thông báo"
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
     
    </div>
  );
}