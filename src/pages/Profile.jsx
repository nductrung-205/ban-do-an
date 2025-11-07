import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changePassword, getImageUrl, getMyOrders, updateProfile } from "../api"; // Đảm bảo 'api' chứa hàm getMyOrders
import Swal from "sweetalert2"; // Import Swal

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("info");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);

  const [editForm, setEditForm] = useState({
    fullname: user?.fullname || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]); // Thêm user vào dependency array nếu user có thể thay đổi trong quá trình dùng app mà không reload

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getMyOrders();
      let fetchedData = [];

      // ✅ LOGIC ĐỒNG BỘ VỚI MYORDERS.JS
      if (res.data && typeof res.data === 'object' && res.data.data !== undefined) {
        fetchedData = res.data.data;
      } else if (Array.isArray(res.data)) {
        fetchedData = res.data;
      }

      // Đảm bảo fetchedData là một mảng, và sắp xếp theo thứ tự mới nhất trước
      const data = Array.isArray(fetchedData) ? fetchedData : [];
      setOrders(data);

      // Tính toán thống kê
      const totalOrders = data.length;
      const totalSpent = data.reduce((sum, order) => sum + (order.total_price || 0), 0);
      const pendingOrders = data.filter(o => o.status === 'pending').length;
      const completedOrders = data.filter(o => o.status === 'delivered').length;
      const cancelledOrders = data.filter(o => o.status === 'cancelled').length;

      setStats({ totalOrders, totalSpent, pendingOrders, completedOrders, cancelledOrders });

      console.log("✅ Orders loaded in Profile:", data);
    } catch (error) {
      console.error("❌ Lỗi tải đơn hàng trong Profile:", error);
      Swal.fire("Lỗi", "Không thể tải danh sách đơn hàng của bạn.", "error"); // Thông báo lỗi cho người dùng
      setOrders([]); // Đảm bảo orders luôn là mảng khi có lỗi
      setStats({ totalOrders: 0, totalSpent: 0, pendingOrders: 0, completedOrders: 0, cancelledOrders: 0 }); // Reset stats
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setErrors({});
    setMessage("");

    try {
      const res = await updateProfile(editForm);
      updateUser(res.data.user);

      setMessage("Cập nhật thành công!");
      setTimeout(() => {
        setEditModal(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error(error);
      setErrors(error.response?.data?.errors || { general: "Có lỗi xảy ra. Vui lòng thử lại!" });
    }
  };

  const handleChangePassword = async () => {
    setErrors({});
    setMessage("");

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.new_password_confirmation
    ) {
      setErrors({ general: "Vui lòng nhập đầy đủ thông tin" });
      return;
    }

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setErrors({ new_password_confirmation: "Mật khẩu xác nhận không khớp" });
      return;
    }

    try {
      await changePassword(passwordForm);

      setMessage("Đổi mật khẩu thành công!");
      setTimeout(() => {
        setPasswordModal(false);
        setMessage("");
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      }, 1500);
    } catch (error) {
      console.error(error);
      setErrors(error.response?.data?.errors || { general: "Có lỗi xảy ra. Vui lòng thử lại!" });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const formatPrice = (value) => {
    const amount = Number(value);
    if (isNaN(amount)) return '0đ';
    return amount.toLocaleString('vi-VN') + 'đ';
  };


  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      confirmed: "bg-blue-100 text-blue-700 border-blue-300",
      delivered: "bg-green-100 text-green-700 border-green-300",
      cancelled: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "⏳ Đang chờ",
      confirmed: "✅ Đã xác nhận",
      delivered: "🎉 Đã giao",
      cancelled: "❌ Đã hủy",
    };
    return texts[status] || status;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl">
          <div className="text-6xl mb-4">🍔</div>
          <p className="mb-6 text-gray-600 text-lg">Bạn chưa đăng nhập</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition font-semibold"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-white font-semibold text-lg flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">🍔</span>
            <span>Trang chủ</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white text-sm hidden sm:block">
              Xin chào, <strong>{user.fullname}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="bg-white text-orange-500 px-4 py-2 rounded-xl font-semibold hover:bg-orange-50 transition shadow-md"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 hover:shadow-2xl transition-shadow">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg ring-4 ring-orange-200">
                {user.fullname?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg">
                ⭐ VIP
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {user.fullname}
              </h1>
              <p className="text-gray-500 mb-3">{user.email}</p>
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-sm rounded-full font-semibold border-2 border-orange-200">
                {user.role === 0 ? "👑 Quản trị viên" : "🍕 Khách hàng"}
              </span>

              {/* ✅ Stats từ Orders thực tế */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 text-center p-4 rounded-2xl border-2 border-orange-100">
                  <p className="text-2xl font-bold text-orange-500">{stats.totalOrders}</p>
                  <p className="text-sm text-gray-600">Tổng đơn</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 text-center p-4 rounded-2xl border-2 border-purple-100">
                  <p className="text-2xl font-bold text-purple-500">{stats.pendingOrders}</p>
                  <p className="text-sm text-gray-600">Đang chờ</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 text-center p-4 rounded-2xl border-2 border-purple-100">
                  <p className="text-2xl font-bold text-purple-500">{stats.cancelledOrders}</p>
                  <p className="text-sm text-gray-600">Đã hủy</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 text-center p-4 rounded-2xl border-2 border-blue-100">
                  <p className="text-2xl font-bold text-blue-500">{stats.completedOrders}</p>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 text-center p-4 rounded-2xl border-2 border-green-100">
                  <p className="text-xl font-bold text-green-500">{formatPrice(stats.totalSpent)}</p>
                  <p className="text-sm text-gray-600">Tổng chi</p>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setEditModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              ✏️ Chỉnh sửa
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${activeTab === "info"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
              }`}
            onClick={() => setActiveTab("info")}
          >
            📋 Thông tin
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${activeTab === "orders"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
              }`}
            onClick={() => setActiveTab("orders")}
          >
            🛍️ Đơn hàng ({stats.totalOrders})
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${activeTab === "settings"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
              }`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Cài đặt
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>👤</span>
                Thông tin cá nhân
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-orange-100">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Họ và tên</p>
                  <p className="text-lg font-bold text-gray-800">{user.fullname}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-100">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Email</p>
                  <p className="text-lg font-bold text-gray-800">{user.email}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Số điện thoại</p>
                  <p className="text-lg font-bold text-gray-800">
                    {user.phone || "Chưa cập nhật"}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Vai trò</p>
                  <p className="text-lg font-bold text-gray-800">
                    {user.role === 0 ? "Quản trị viên" : "Khách hàng"}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-100 md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Địa chỉ giao hàng</p>
                  <p className="text-lg font-bold text-gray-800">
                    {user.address || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Orders Tab - Hiển thị orders thực tế */}
          {activeTab === "orders" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>📦</span>
                Lịch sử đơn hàng
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-600 text-lg">Bạn chưa có đơn hàng nào.</p>
                  <Link
                    to="/"
                    className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
                  >
                    Đặt hàng ngay
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-6 border-2 border-gray-100 rounded-2xl hover:shadow-xl transition-all hover:border-orange-200 bg-gradient-to-r from-white to-orange-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">📦</span>
                            {order.order_code || `Đơn #${order.id}`}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      {/* ✅ Hiển thị sản phẩm trong đơn hàng */}
                      <div className="space-y-2 mb-4">
                        {(order.items && Array.isArray(order.items) ? order.items : []).slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            <img
                              src={getImageUrl(item.product_image)}
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/48?text=No+Image";
                              }}
                            />

                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{item.product_name}</p>
                              <p className="text-gray-500">SL: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-orange-600">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        ))}
                        {(order.items && Array.isArray(order.items) && order.items.length > 2) && (
                          <p className="text-sm text-gray-500 italic">
                            + {order.items.length - 2} sản phẩm khác...
                          </p>
                        )}
                      </div>

                      <div className="space-y-1 mb-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span className="font-medium">Địa chỉ:</span>
                          <span>{order.customer_address}, {order.customer_ward}, {order.customer_district}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📞</span>
                          <span className="font-medium">Liên hệ:</span>
                          <span>{order.customer_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>💳</span>
                          <span className="font-medium">Thanh toán:</span>
                          <span>{order.payment_method === "COD" ? "COD" : "Chuyển khoản"}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t-2 border-orange-100">
                        <span className="text-gray-600 font-medium">Tổng tiền:</span>
                        <span className="text-2xl font-bold text-orange-600">
                          {formatPrice(order.total_price)}
                        </span>
                      </div>

                      {/* ✅ Nút xem chi tiết */}
                      <div className="mt-4">
                        <Link
                          to={`/orders/${order.id}`}
                          className="w-full block text-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
                        >
                          Xem chi tiết →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>⚙️</span>
                Cài đặt tài khoản
              </h2>

              <div className="space-y-4">
                <button
                  onClick={() => setPasswordModal(true)}
                  className="w-full p-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl text-left hover:shadow-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🔒</span>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">Đổi mật khẩu</p>
                      <p className="text-sm text-gray-500">Cập nhật mật khẩu định kỳ để bảo mật</p>
                    </div>
                  </div>
                  <span className="text-3xl group-hover:translate-x-2 transition-transform">→</span>
                </button>

                <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🔔</span>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">Thông báo</p>
                      <p className="text-sm text-gray-500">Nhận thông báo về khuyến mãi</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal chỉnh sửa thông tin */}
      {editModal && (
        <Modal
          title="Chỉnh sửa thông tin cá nhân"
          onClose={() => {
            setEditModal(false);
            setErrors({});
            setMessage("");
          }}
          onSubmit={handleUpdateProfile}
          form={editForm}
          setForm={setEditForm}
          errors={errors}
          message={message}
        />
      )}

      {/* Modal đổi mật khẩu */}
      {passwordModal && (
        <PasswordModal
          form={passwordForm}
          setForm={setPasswordForm}
          onClose={() => {
            setPasswordModal(false);
            setErrors({});
            setMessage("");
          }}
          onSubmit={handleChangePassword}
          errors={errors}
          message={message}
        />
      )}
    </div>
  );
}

/* ===============================
   COMPONENT MODALS
================================= */
function Modal({ title, onClose, onSubmit, form, setForm, errors, message }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-slideUp">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <span>✏️</span>
          {title}
        </h3>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border-2 border-green-300 text-green-700 rounded-xl font-medium">
            ✅ {message}
          </div>
        )}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-xl font-medium">
            ❌ {errors.general}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">Họ và tên</label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">Số điện thoại</label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">Địa chỉ</label>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ form, setForm, onClose, onSubmit, errors, message }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-slideUp">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <span>🔒</span>
          Đổi mật khẩu
        </h3>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border-2 border-green-300 text-green-700 rounded-xl font-medium">
            ✅ {message}
          </div>
        )}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-xl font-medium">
            ❌ {errors.general}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            value={form.current_password}
            onChange={(e) =>
              setForm({ ...form, current_password: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Mật khẩu mới"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            value={form.new_password_confirmation}
            onChange={(e) =>
              setForm({ ...form, new_password_confirmation: e.target.value })
            }
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}