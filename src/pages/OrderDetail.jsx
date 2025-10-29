import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Swal from "sweetalert2";
import api, { getImageUrl } from "../api";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
        console.log("✅ Order detail loaded:", res.data);
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết đơn hàng:", err);
        if (err.response?.status === 401) {
          Swal.fire("Lỗi", "Vui lòng đăng nhập để xem đơn hàng.", "error");
          navigate("/login");
        } else if (err.response?.status === 404) {
          Swal.fire("Lỗi", "Không tìm thấy đơn hàng.", "error");
          navigate("/orders");
        } else {
          Swal.fire("Lỗi", "Không thể tải chi tiết đơn hàng.", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id, navigate]);

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + "₫";

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "delivered":
        return "bg-green-100 text-green-700 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Đang chờ xử lý";
      case "confirmed":
        return "Đã xác nhận";
      case "delivered":
        return "Đã giao hàng";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 mb-4">Không tìm thấy đơn hàng.</p>
            <button
              onClick={() => navigate("/orders")}
              className="px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Quay lại danh sách đơn hàng
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header với nút quay lại */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/orders")}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Thông tin đơn hàng */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {order.order_code || `Đơn hàng #${order.id}`}
                </h2>
                <p className="text-sm text-gray-500">
                  Ngày đặt: {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-lg border font-semibold ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>💳</span> Phương thức thanh toán
                </h3>
                <p className="text-gray-600">{order.payment_method === "COD" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản ngân hàng"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>📦</span> Trạng thái
                </h3>
                <p className="text-gray-600">{getStatusText(order.status)}</p>
              </div>
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span> Thông tin người nhận
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Họ tên</p>
                <p className="font-medium text-gray-800">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium text-gray-800">{order.customer_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Loại địa chỉ</p>
                <p className="font-medium text-gray-800">{order.customer_type}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                <p className="font-medium text-gray-800">
                  {order.customer_address}, {order.customer_ward}, {order.customer_district}, {order.customer_city}
                </p>
              </div>
              {order.customer_note && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Ghi chú</p>
                  <p className="font-medium text-gray-800">{order.customer_note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <span>🛒</span> Sản phẩm ({order.items?.length || 0})
            </h3>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                  <img
                    src={getImageUrl(item.product_image)}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80?text=No+Image";
                    }}
                  />

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.product_name}</h4>
                    <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatPrice(item.price)} x {item.quantity}</p>
                    <p className="font-bold text-orange-600">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính:</span>
              <span className="font-medium">{formatPrice(order.subtotal_price)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Phí giao hàng:</span>
              <span className="font-medium">{formatPrice(order.delivery_fee)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá:</span>
                <span className="font-medium">-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Tổng cộng:</span>
              <span className="text-2xl font-bold text-orange-600">{formatPrice(order.total_price)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {order.status === "pending" && (
              <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: "Xác nhận hủy đơn hàng?",
                    text: "Bạn sẽ không thể hoàn tác hành động này!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Có, hủy đơn!",
                    cancelButtonText: "Không",
                  });

                  if (result.isConfirmed) {
                    try {
                      await api.put(`/orders/${order.id}/cancel`);
                      Swal.fire("Thành công!", "Đơn hàng đã được hủy.", "success");
                      navigate("/orders");
                    } catch (err) {
                      Swal.fire(
                        "Lỗi!",
                        err.response?.data?.message || "Không thể hủy đơn hàng.",
                        "error"
                      );
                    }
                  }
                }}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
              >
                Hủy đơn hàng
              </button>
            )}
            <button
              onClick={() => navigate("/orders")}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}