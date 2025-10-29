import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getMyOrders } from "../api";
import Swal from "sweetalert2";

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

        setOrders(Array.isArray(fetchedData) ? fetchedData : []); // Lưu ý không có .reverse() ở đây nếu bạn muốn thứ tự mặc định từ API
        console.log("✅ Orders loaded:", fetchedData);
      } catch (err) {
        console.error("❌ Lỗi tải đơn hàng:", err);
        Swal.fire("Lỗi", "Không thể tải danh sách đơn hàng.", "error");
        // if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <p className="text-gray-600">Đang tải đơn hàng của bạn...</p>
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-orange-600 mb-8 text-center">
          Đơn hàng của tôi
        </h1>

        {orders.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào.</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Mua ngay
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row justify-between md:items-center"
              >
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {order.order_code || `Đơn #${order.id}`}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Ngày đặt:{" "}
                    {new Date(order.created_at).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Tổng tiền:{" "}
                    <span className="font-bold text-red-600">
                      {order.total_price?.toLocaleString()}₫
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "pending"
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
                    {order.status === "delivered" && "Đã giao"}
                    {order.status === "cancelled" && "Đã hủy"}
                  </span>

                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Xem chi tiết
                  </button>
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
