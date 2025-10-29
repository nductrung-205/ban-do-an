// src/pages/admin/EditUser.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userAPI } from "../../../../api";
import { User, Save, ArrowLeft, Loader2, Info } from "lucide-react";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    role: 1,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }
  const [errors, setErrors] = useState({});
  const [userStats, setUserStats] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userAPI.getById(id);
      const userData = response.data.data;
      setFormData({
        fullname: userData.fullname || "",
        email: userData.email || "",
        phone: userData.phone || "",
        password: "",
        address: userData.address || "",
        role: userData.role,
      });
      setUserStats(userData.stats);
    } catch (err) {
      console.error("Error fetching user:", err);
      showMessage("error", "❌ Lỗi khi tải thông tin người dùng!");
      setTimeout(() => navigate("/admin/users"), 3000);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // ------------------ FE Validation tiếng Việt ------------------
  const validateForm = () => {
    let newErrors = {};

    // fullname
    if (!formData.fullname.trim()) newErrors.fullname = "Họ tên không được để trống.";
    else if (formData.fullname.length > 255) newErrors.fullname = "Họ tên không được quá 255 ký tự.";

    // email
    if (!formData.email.trim()) newErrors.email = "Email không được để trống.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email không hợp lệ.";
    else if (formData.email.length > 255) newErrors.email = "Email không được quá 255 ký tự.";

    // phone (optional)
    if (formData.phone && !/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Số điện thoại không hợp lệ (không đúng 10 chữ số).";

    // password (optional)
    if (formData.password) {
      if (formData.password.length < 6)
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      else if (formData.password.length > 255)
        newErrors.password = "Mật khẩu không được quá 255 ký tự.";
    }

    // address (optional)
    if (formData.address && formData.address.length > 500)
      newErrors.address = "Địa chỉ không được quá 500 ký tự.";

    // role
    if (![0, 1].includes(parseInt(formData.role)))
      newErrors.role = "Quyền hạn không hợp lệ.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // ----------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      showMessage("error", "Vui lòng kiểm tra lại thông tin đã nhập.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, role: parseInt(formData.role) };
      if (!payload.password) delete payload.password;
      if (!payload.phone) payload.phone = null;

      await userAPI.update(id, payload);
      showMessage("success", "✅ Cập nhật người dùng thành công!");
      fetchUser();
    } catch (err) {
      console.error("Error updating user:", err);
      const serverErrors = err.response?.data?.errors;
      const errorMessage = err.response?.data?.message || "❌ Lỗi khi cập nhật người dùng!";
      if (serverErrors) {
        setErrors(serverErrors);
        showMessage("error", "Dữ liệu không hợp lệ. Vui lòng kiểm tra các trường.");
      } else {
        showMessage("error", errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const messageClasses = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
        <p className="ml-4 text-xl text-gray-700">Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <User size={30} className="text-blue-600" />
            Chỉnh sửa người dùng #{id}
          </h1>
          <button
            onClick={() => navigate("/admin/users")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 font-medium"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${messageClasses[message.type]} border`}>
            {message.type === "success" && <span className="text-xl">🎉</span>}
            {message.type === "error" && <span className="text-xl">🔥</span>}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md p-5 text-white">
              <p className="text-sm opacity-90 mb-1 font-light">Tổng số đơn hàng</p>
              <p className="text-3xl font-extrabold">{userStats.total_orders}</p>
              <Info size={18} className="absolute top-3 right-3 opacity-70" />
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md p-5 text-white">
              <p className="text-sm opacity-90 mb-1 font-light">Tổng chi tiêu</p>
              <p className="text-3xl font-extrabold">{userStats.total_spent?.toLocaleString('vi-VN')} VND</p>
              <Info size={18} className="absolute top-3 right-3 opacity-70" />
            </div>
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-md p-5 text-white">
              <p className="text-sm opacity-90 mb-1 font-light">Đơn hàng chờ xử lý</p>
              <p className="text-3xl font-extrabold">{userStats.pending_orders}</p>
              <Info size={18} className="absolute top-3 right-3 opacity-70" />
            </div>
          </div>
        )}

        {/* User Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* fullname */}
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.fullname ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.fullname && <p className="mt-1 text-sm text-red-600">{errors.fullname}</p>}
            </div>

            {/* email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới (Để trống nếu không đổi)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              ></textarea>
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            {/* role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Quyền hạn
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none pr-8 transition ${
                  errors.role ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value={1}>User</option>
                <option value={0}>Admin</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-300 transition font-semibold flex items-center gap-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? "Đang lưu..." : "Cập nhật người dùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
