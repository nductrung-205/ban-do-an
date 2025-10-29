import React, { useEffect, useState } from "react";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { couponAPI } from "../api"; // Sử dụng API đã định nghĩa

// Custom Hook cho form
const useCouponForm = (initialForm, onSubmitCallback) => {
    const [form, setForm] = useState(initialForm);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingCoupon(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmitCallback(form, editingCoupon);
    };

    return { form, setForm, editingCoupon, setEditingCoupon, handleChange, resetForm, handleSubmit };
};

export default function Coupons() {
    const navigate = useNavigate(); // Khởi tạo useNavigate
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    const initialFormState = {
        code: "",
        discount_amount: "",
        discount_percent: "",
        valid_from: "",
        valid_to: "",
        usage_limit: 1,
    };

    const {
        form,
        setForm,
        editingCoupon,
        setEditingCoupon,
        handleChange,
        resetForm,
        handleSubmit,
    } = useCouponForm(initialFormState, async (currentForm, editingItem) => {
        // Client-side validation
        if (!currentForm.code.trim()) {
            toast.warning("Vui lòng nhập mã code!");
            return;
        }

        if (currentForm.valid_from && currentForm.valid_to && new Date(currentForm.valid_from) > new Date(currentForm.valid_to)) {
            toast.warning("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!");
            return;
        }

        try {
            // Chuẩn bị dữ liệu gửi đi, đảm bảo chỉ có một loại giảm giá
            const dataToSend = { ...currentForm };
            if (dataToSend.discount_amount && dataToSend.discount_percent) {
                // Ưu tiên giảm giá cố định nếu cả hai đều có
                dataToSend.discount_percent = "";
            } else if (!dataToSend.discount_amount && !dataToSend.discount_percent) {
                toast.warning("Vui lòng nhập giảm giá cố định hoặc phần trăm!");
                return;
            }

            if (editingItem) {
                await couponAPI.update(editingItem.id, dataToSend);
                toast.success("Cập nhật mã giảm giá thành công!");
            } else {
                await couponAPI.create(dataToSend);
                toast.success("Tạo mã giảm giá mới thành công!");
            }
            resetForm();
            fetchCoupons();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu mã giảm giá!");
        }
    });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await couponAPI.getAll();
            setCoupons(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách mã giảm giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setForm({
            code: coupon.code,
            discount_amount: coupon.discount_amount || "",
            discount_percent: coupon.discount_percent || "",
            valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : "", // Format date for input type="date"
            valid_to: coupon.valid_to ? coupon.valid_to.split('T')[0] : "",     // Format date for input type="date"
            usage_limit: coupon.usage_limit || 1,
        });
    };

    const handleDelete = async (id) => {
        const confirmResult = await Swal.fire({
            title: "Xóa mã giảm giá?",
            text: "Bạn có chắc muốn xóa mã này không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#e74c3c",
        });

        if (confirmResult.isConfirmed) {
            try {
                await couponAPI.delete(id);
                toast.success("Đã xóa mã giảm giá!");
                fetchCoupons();
            } catch (err) {
                console.error(err);
                toast.error("Không thể xóa mã giảm giá!");
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Không giới hạn";
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🎟️ Quản lý Mã giảm giá
            </h1>

            {/* Form tạo/sửa */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-md p-6 mb-8 grid md:grid-cols-3 gap-4"
            >
                <div>
                    <label className="font-semibold">Mã giảm giá *</label>
                    <input
                        type="text"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        placeholder="VD: SALE50"
                        className="w-full border rounded-lg p-2 mt-1"
                    />
                </div>

                <div>
                    <label className="font-semibold">Giảm cố định (VNĐ)</label>
                    <input
                        type="number"
                        name="discount_amount"
                        value={form.discount_amount}
                        onChange={handleChange}
                        placeholder="10000"
                        className="w-full border rounded-lg p-2 mt-1"
                        min="0"
                    />
                </div>

                <div>
                    <label className="font-semibold">Giảm phần trăm (%)</label>
                    <input
                        type="number"
                        name="discount_percent"
                        value={form.discount_percent}
                        onChange={handleChange}
                        placeholder="10"
                        className="w-full border rounded-lg p-2 mt-1"
                        min="0"
                        max="100"
                    />
                </div>

                <div>
                    <label className="font-semibold">Hiệu lực từ</label>
                    <input
                        type="date"
                        name="valid_from"
                        value={form.valid_from}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-2 mt-1"
                    />
                </div>

                <div>
                    <label className="font-semibold">Hiệu lực đến</label>
                    <input
                        type="date"
                        name="valid_to"
                        value={form.valid_to}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-2 mt-1"
                    />
                </div>

                <div>
                    <label className="font-semibold">Số lượt sử dụng</label>
                    <input
                        type="number"
                        name="usage_limit"
                        value={form.usage_limit}
                        onChange={handleChange}
                        min="1"
                        className="w-full border rounded-lg p-2 mt-1"
                    />
                </div>

                <div className="md:col-span-3 flex gap-2 mt-4">
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                        {editingCoupon ? <Edit size={18} /> : <PlusCircle size={18} />}
                        {editingCoupon ? "Cập nhật" : "Thêm mới"}
                    </button>

                    {editingCoupon && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-gray-600 hover:text-gray-800 underline"
                        >
                            Hủy chỉnh sửa
                        </button>
                    )}
                </div>
            </form>

            {/* Danh sách */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-500">
                    <Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    Chưa có mã giảm giá nào.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-xl">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Mã</th>
                                <th className="p-3 text-left">Giảm giá</th>
                                <th className="p-3 text-left">Thời gian</th>
                                <th className="p-3 text-left">Lượt</th>
                                <th className="p-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((c) => (
                                <tr key={c.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 font-semibold">{c.code}</td>
                                    <td className="p-3">
                                        {c.discount_amount
                                            ? `${Number(c.discount_amount).toLocaleString()}₫`
                                            : c.discount_percent
                                                ? `${c.discount_percent}%`
                                                : "-"}
                                    </td>
                                    <td className="p-3 text-sm">
                                        {c.valid_from
                                            ? `${formatDate(c.valid_from)} → ${c.valid_to ? formatDate(c.valid_to) : "∞"}`
                                            : "Không giới hạn"}
                                    </td>
                                    <td className="p-3">{c.usage_limit}</td>
                                    <td className="p-3 flex justify-center gap-3">
                                        <button
                                            onClick={() => handleEdit(c)}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            )}
            <div className="mt-8 text-center">
                <button
                    onClick={() => navigate("/admin")} // Sử dụng navigate hook
                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-lg flex items-center justify-center mx-auto gap-2"
                >
                    ← Trở về Dashboard
                </button>
            </div>
        </div>
    );
}