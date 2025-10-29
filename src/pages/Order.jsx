import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { getMyOrders, cancelOrder } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = true;
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getMyOrders();
        let fetchedData = [];

        if (res.data && typeof res.data === 'object' && res.data.data !== undefined) {
          fetchedData = res.data.data;
        } else if (Array.isArray(res.data)) {
          fetchedData = res.data;
        }

        setOrders(Array.isArray(fetchedData) ? fetchedData.reverse() : []);
        console.log("✅ Orders loaded:", fetchedData);
      } catch (err) {
        console.error("❌ Lỗi tải đơn hàng:", err);
        Swal.fire("Lỗi", "Không thể tải danh sách đơn hàng.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancel = async (id) => {
    Swal.fire({
      title: "Xác nhận hủy đơn hàng?",
      text: "Bạn sẽ không thể hoàn tác hành động này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Có, hủy đơn hàng!",
      cancelButtonText: "Không",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setCancellingId(id);
          await cancelOrder(id);
          Swal.fire("Thành công", "Đơn hàng đã được hủy.", "success");

          // Bắt đầu thay đổi ở đây:
          const res = await getMyOrders();
          let updatedOrders = [];
          if (res.data && typeof res.data === 'object' && res.data.data !== undefined) {
            updatedOrders = res.data.data;
          } else if (Array.isArray(res.data)) {
            updatedOrders = res.data;
          }
          setOrders(Array.isArray(updatedOrders) ? updatedOrders.reverse() : []);
          // Kết thúc thay đổi
        } catch (err) {
          Swal.fire(
            "Lỗi",
            err.response?.data?.message || "Không thể hủy đơn hàng.",
            "error"
          );
        } finally {
          setCancellingId(null);
        }
      }
    });
  };

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + "₫";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-orange-600 mb-6">
          📦 Đơn hàng của tôi
        </h1>

        {orders.length === 0 ? (
          <div className="text-center bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
            <Link
              to="/"
              className="px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              🛒 Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border rounded-lg shadow p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold text-lg">
                    {order.order_code || `Đơn #${order.id}`}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded text-sm ${order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "confirmed"
                        ? "bg-blue-100 text-blue-700"
                        : order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                  >
                    {order.status === "pending" && "Đang chờ"}
                    {order.status === "confirmed" && "Đã xác nhận"}
                    {order.status === "shipping" && "Đang giao"} {/* Đã thêm trạng thái shipping */}
                    {order.status === "delivered" && "Đã giao"}
                    {order.status === "cancelled" && "Đã hủy"}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-3">
                  Ngày đặt:{" "}
                  {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>

                {/* HIỂN THỊ MÃ COUPON NẾU CÓ */}
                {order.coupon_code && (
                  <p className="text-sm text-green-600 mb-2">
                    Mã giảm giá đã dùng: <span className="font-semibold">{order.coupon_code}</span>
                  </p>
                )}

                <div className="divide-y">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={`http://localhost:8000/storage/${item.product_image}`}
                          alt={item.product_name}
                          className="w-14 h-14 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">
                            SL: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="text-red-600 font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <p>Tạm tính: {formatPrice(order.subtotal_price)}</p>
                  <p>Phí giao hàng: {formatPrice(order.delivery_fee)}</p>
                  {/* ĐÃ CÓ: HIỂN THỊ GIẢM GIÁ NẾU CÓ */}
                  {order.discount_amount > 0 && (
                    <p className="text-green-600">Giảm giá: -{formatPrice(order.discount_amount)}</p>
                  )}
                </div>

                <div className="flex justify-between items-center mt-3 font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-red-600">
                    {formatPrice(order.total_price)}
                  </span>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={
                      cancellingId === order.id ||
                      ["cancelled", "delivered", "shipping"].includes(order.status) // Thêm 'shipping' vào đây
                    }
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
                  >
                    {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                  </button>

                  <Link
                    to={`/orders/${order.id}`}
                    className="px-4 py-2 text-sm text-blue-600 hover:underline"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}