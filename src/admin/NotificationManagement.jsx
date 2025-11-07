import React, { useEffect, useState } from "react";
import { PlusCircle, Edit, Trash2, Loader2, Bell, Eye, EyeOff } from "lucide-react"; // Import new icons
import Swal from "sweetalert2";
import { toast } from "react-toastify"; // Assume you have react-toastify setup
import { useNavigate } from "react-router-dom";
import { notificationAPI, userAPI } from "../api"; // Sử dụng API đã định nghĩa

// Custom Hook for form - similar to useCouponForm
const useNotificationForm = (initialForm, onSubmitCallback) => {
    const [form, setForm] = useState(initialForm);
    const [editingNotification, setEditingNotification] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prevForm) => ({
            ...prevForm,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingNotification(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmitCallback(form, editingNotification);
    };

    return { form, setForm, editingNotification, setEditingNotification, handleChange, resetForm, handleSubmit };
};

export default function NotificationManagement() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [isSendingToAll, setIsSendingToAll] = useState(false); // Trạng thái gửi cho tất cả

    const initialFormState = {
        user_id: "",
        title: "",
        message: "",
        type: "info",
        is_read: false,
        send_to_all: false,
    };

    const {
        form,
        setForm,
        editingNotification,
        setEditingNotification,
        handleChange,
        resetForm,
        handleSubmit,
    } = useNotificationForm(initialFormState, async (currentForm, editingItem) => {
        // Client-side validation
        if (!currentForm.title.trim()) {
            toast.warning("Vui lòng nhập tiêu đề thông báo!");
            return;
        }
        if (!currentForm.message.trim()) {
            toast.warning("Vui lòng nhập nội dung thông báo!");
            return;
        }
        if (!currentForm.send_to_all && !editingItem && !currentForm.user_id) {
             toast.warning("Vui lòng chọn người nhận hoặc chọn gửi đến tất cả!");
             return;
        }


        Swal.fire({
            title: editingItem ? "Cập nhật thông báo?" : "Tạo thông báo?",
            text: "Bạn có chắc chắn muốn thực hiện hành động này?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Có, tiếp tục!",
            cancelButtonText: "Hủy",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const dataToSend = { ...currentForm };

                    if (dataToSend.send_to_all) {
                        setIsSendingToAll(true);
                        await notificationAPI.sendToAllUsersAdmin({
                            title: dataToSend.title,
                            message: dataToSend.message,
                            type: dataToSend.type,
                        });
                        toast.success("Thông báo đã được gửi tới tất cả người dùng!");
                    } else if (editingItem) {
                        // When editing, user_id is already set from the notification object
                        // or it remains null if it was a broadcast (not editable as a specific user's notification)
                        await notificationAPI.updateAdmin(editingItem.id, dataToSend);
                        toast.success("Thông báo đã được cập nhật!");
                    } else {
                        // When creating a specific notification, ensure user_id is present
                        if (!dataToSend.user_id) {
                            toast.warning("Vui lòng chọn người dùng cụ thể hoặc gửi đến tất cả.");
                            return;
                        }
                        await notificationAPI.createAdmin(dataToSend);
                        toast.success("Thông báo đã được tạo!");
                    }
                    resetForm();
                    fetchNotifications();
                } catch (err) {
                    console.error(err);
                    toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu thông báo!");
                } finally {
                    setIsSendingToAll(false);
                }
            }
        });
    });

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationAPI.getAllAdmin();
            setNotifications(res.data.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách thông báo.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await userAPI.getAll();
            setUsers(res.data.data || []);
        } catch (err) {
            console.error("Error fetching users:", err);
            toast.error("Không thể tải danh sách người dùng.");
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchUsers();
    }, []);

    const handleEdit = (notification) => {
        setEditingNotification(notification);
        setForm({
            user_id: notification.user_id || "",
            title: notification.title,
            message: notification.message,
            type: notification.type || "info",
            is_read: notification.is_read,
            send_to_all: false, // Always false when editing a specific notification
        });
    };

    const handleDelete = async (id) => {
        const confirmResult = await Swal.fire({
            title: "Xóa thông báo?",
            text: "Bạn có chắc muốn xóa thông báo này không? Hành động này không thể hoàn tác!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#e74c3c",
        });

        if (confirmResult.isConfirmed) {
            try {
                await notificationAPI.deleteAdmin(id);
                toast.success("Đã xóa thông báo!");
                fetchNotifications();
            } catch (err) {
                console.error(err);
                toast.error("Không thể xóa thông báo!");
            }
        }
    };

    const handleToggleReadStatus = async (id, currentStatus) => {
        try {
            await notificationAPI.toggleReadStatusAdmin(id);
            toast.success(`Trạng thái đã đọc của thông báo đã được chuyển đổi thành ${currentStatus ? 'chưa đọc' : 'đã đọc'}.`);
            fetchNotifications();
        } catch (err) {
            console.error("Toggle read status error:", err);
            toast.error("Không thể chuyển đổi trạng thái.");
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_success': return '🎉';
            case 'order_cancel': return '❌';
            case 'promotion': return '🎁';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Bell size={32} /> Quản lý Thông báo
            </h1>

            {/* Form tạo/sửa */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-md p-6 mb-8 grid md:grid-cols-2 gap-4"
            >
                {/* Tiêu đề */}
                <div>
                    <label className="font-semibold">Tiêu đề *</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="VD: Khuyến mãi mới!"
                        className="w-full border rounded-lg p-2 mt-1"
                        required
                    />
                </div>

                {/* Loại thông báo */}
                <div>
                    <label className="font-semibold">Loại thông báo</label>
                    <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-2 mt-1"
                    >
                        <option value="info">Thông tin chung (Info)</option>
                        <option value="promotion">Khuyến mãi (Promotion)</option>
                        <option value="order_success">Đặt hàng thành công</option>
                        <option value="order_cancel">Hủy đơn hàng</option>
                        <option value="warning">Cảnh báo (Warning)</option>
                    </select>
                </div>

                {/* Nội dung */}
                <div className="md:col-span-2">
                    <label className="font-semibold">Nội dung *</label>
                    <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Nội dung chi tiết của thông báo..."
                        rows="3"
                        className="w-full border rounded-lg p-2 mt-1"
                        required
                    ></textarea>
                </div>

                {/* Gửi đến tất cả người dùng */}
                <div className="md:col-span-2 flex items-center mt-2">
                    <input
                        type="checkbox"
                        id="send_to_all"
                        name="send_to_all"
                        checked={form.send_to_all}
                        onChange={handleChange}
                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={!!editingNotification} // Disable if editing an existing notification
                    />
                    <label htmlFor="send_to_all" className="font-semibold text-gray-700">
                        Gửi đến tất cả người dùng (Áp dụng khi tạo mới)
                    </label>
                </div>

                {/* Chọn người dùng cụ thể (chỉ hiện khi tạo mới và không gửi cho tất cả) */}
                {!form.send_to_all && !editingNotification && (
                    <div className="md:col-span-2">
                        <label className="font-semibold">Chọn người dùng cụ thể</label>
                        <select
                            name="user_id"
                            value={form.user_id}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-2 mt-1"
                        >
                            <option value="">-- Chọn người dùng --</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.fullname} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                 {/* Người nhận khi chỉnh sửa */}
                 {!!editingNotification && (
                    <div className="md:col-span-2">
                        <label className="font-semibold">Người nhận</label>
                        <input
                            type="text"
                            value={editingNotification.user ? `${editingNotification.user.fullname} (${editingNotification.user.email})` : "Tất cả / Chưa gán"}
                            disabled
                            className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
                        />
                    </div>
                )}

                {/* Đánh dấu đã đọc (chỉ hiện khi tạo mới và không gửi cho tất cả) */}
                {!form.send_to_all && (
                    <div className="md:col-span-2 flex items-center mt-2">
                        <input
                            type="checkbox"
                            id="is_read"
                            name="is_read"
                            checked={form.is_read}
                            onChange={handleChange}
                            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_read" className="font-semibold text-gray-700">
                            Đánh dấu là đã đọc
                        </label>
                    </div>
                )}


                <div className="md:col-span-2 flex gap-2 mt-4">
                    <button
                        type="submit"
                        className={`flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all
                            ${isSendingToAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSendingToAll}
                    >
                        {isSendingToAll ? (
                            <> <Loader2 size={18} className="animate-spin" /> Đang gửi...</>
                        ) : editingNotification ? (
                            <> <Edit size={18} /> Cập nhật</>
                        ) : (
                            <> <PlusCircle size={18} /> Thêm mới</>
                        )}
                    </button>

                    {editingNotification && (
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
            ) : notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    Chưa có thông báo nào.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-xl">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">ID</th>
                                <th className="p-3 text-left">Người nhận</th>
                                <th className="p-3 text-left">Tiêu đề</th>
                                <th className="p-3 text-left">Nội dung</th>
                                <th className="p-3 text-left">Loại</th>
                                <th className="p-3 text-left">Trạng thái</th>
                                <th className="p-3 text-left">Ngày tạo</th>
                                <th className="p-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map((n) => (
                                <tr key={n.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 text-sm">{n.id}</td>
                                    <td className="p-3 text-sm">
                                        {n.user ? `${n.user.fullname} (${n.user.email})` : "Tất cả / Chưa gán"}
                                    </td>
                                    <td className="p-3 font-semibold flex items-center gap-1">
                                        {getNotificationIcon(n.type)} {n.title}
                                    </td>
                                    <td className="p-3 text-sm max-w-xs truncate">{n.message}</td>
                                    <td className="p-3 text-sm">{n.type}</td>
                                    <td className="p-3 text-sm">
                                        <span
                                            className={`inline-flex px-2 py-1 leading-5 font-semibold rounded-full text-xs
                                                ${n.is_read ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                                        >
                                            {n.is_read ? "Đã đọc" : "Chưa đọc"}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm">
                                        {new Date(n.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="p-3 flex justify-center gap-3">
                                        <button
                                            onClick={() => handleEdit(n)}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleReadStatus(n.id, n.is_read)}
                                            className="text-gray-600 hover:text-gray-800"
                                            title={n.is_read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                                        >
                                            {n.is_read ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(n.id)}
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
                    onClick={() => navigate("/admin")}
                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-lg flex items-center justify-center mx-auto gap-2"
                >
                    ← Trở về Dashboard
                </button>
            </div>
        </div>
    );
}