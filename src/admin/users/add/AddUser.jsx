// src/pages/admin/AddUser.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../../api";
import { UserPlus, Save, ArrowLeft, Loader2 } from "lucide-react";

export default function AddUser() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        role: 1, // Mặc định là User (1)
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }
    const [errors, setErrors] = useState({});

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000); // Ẩn thông báo sau 5 giây
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        // Clear error for the field being edited
        if (errors[name]) {
            setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
    };

    const validateForm = () => {
        let newErrors = {};

        // fullname
        if (!formData.fullname.trim()) newErrors.fullname = "Họ tên không được để trống.";
        else if (formData.fullname.length > 255) newErrors.fullname = "Họ tên không được quá 255 ký tự.";

        // email
        if (!formData.email.trim()) newErrors.email = "Email không được để trống.";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email không hợp lệ.";
        else if (formData.email.length > 255) newErrors.email = "Email không được quá 255 ký tự.";

        // phone
        if (formData.phone) {
            if (!/^\d{10}$/.test(formData.phone))
                newErrors.phone = "Số điện thoại phải đúng 10 chữ số.";
        }

        // password
        if (!formData.password.trim()) newErrors.password = "Mật khẩu không được để trống.";
        else if (formData.password.length < 6)
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
        else if (formData.password.length > 255)
            newErrors.password = "Mật khẩu không được quá 255 ký tự.";

        // address
        if (formData.address && formData.address.length > 500)
            newErrors.address = "Địa chỉ không được quá 500 ký tự.";

        // role
        if (![0, 1].includes(parseInt(formData.role)))
            newErrors.role = "Quyền hạn không hợp lệ.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({}); // Clear previous errors

        if (!validateForm()) {
            showMessage("error", "Vui lòng kiểm tra lại thông tin đã nhập.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                role: parseInt(formData.role), // Đảm bảo role là số nguyên
            };
            await userAPI.create(payload);
            showMessage("success", "✅ Thêm người dùng mới thành công!");
            setFormData({ // Reset form after successful creation
                fullname: "",
                email: "",
                phone: "",
                password: "",
                address: "",
                role: 1,
            });
            // Optionally navigate back to user list or show success message
            setTimeout(() => navigate("/admin/users"), 2000);
        } catch (err) {
            console.error("Error creating user:", err);
            const serverErrors = err.response?.data?.errors;
            const errorMessage = err.response?.data?.message || "❌ Lỗi khi thêm người dùng!";
            if (serverErrors) {
                setErrors(serverErrors); // Set errors from API response
                showMessage("error", "Dữ liệu không hợp lệ. Vui lòng kiểm tra các trường.");
            } else {
                showMessage("error", errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const messageClasses = {
        success: "bg-green-50 border-green-200 text-green-700",
        error: "bg-red-50 border-red-200 text-red-700",
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <UserPlus size={30} className="text-emerald-600" />
                        Thêm người dùng mới
                    </h1>
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 font-medium"
                    >
                        <ArrowLeft size={18} />
                        Quay lại
                    </button>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${messageClasses[message.type]} border`}>
                        {message.type === "success" && <span className="text-xl">🎉</span>}
                        {message.type === "error" && <span className="text-xl">🔥</span>}
                        <p className="font-medium">{message.text}</p>
                    </div>
                )}

                {/* User Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${errors.fullname ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Nguyễn Văn A"
                                
                            />
                            {errors.fullname && <p className="mt-1 text-sm text-red-600">{errors.fullname}</p>}
                        </div>

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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${errors.email ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="example@gmail.com"
                                
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${errors.phone ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="0912345678"
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${errors.password ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="********"
                                
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>

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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${errors.address ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                            ></textarea>
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                Quyền hạn
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white appearance-none pr-8 transition ${errors.role ? "border-red-500" : "border-gray-300"
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
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {loading ? "Đang lưu..." : "Lưu người dùng"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}