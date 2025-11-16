import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../api';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [errorLoadingOrder, setErrorLoadingOrder] = useState(null);

  useEffect(() => {
    if (vnpResponseCode === '00' && orderId) {
      clearCart(); // Clear the cart 1 lần

      const fetchOrderDetails = async () => {
        try {
          const res = await orderAPI.getById(orderId);
          setOrder(res.data.data);
        } catch (error) {
          console.error("Error fetching order details:", error);
          setErrorLoadingOrder("Không thể tải chi tiết đơn hàng.");
        } finally {
          setLoadingOrder(false);
        }
      };
      fetchOrderDetails();
    } else if (vnpResponseCode !== '00') {
      setErrorLoadingOrder("Thanh toán không thành công hoặc bị hủy.");
      setLoadingOrder(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ❌ Chỉ chạy 1 lần khi mount


  if (loadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-3xl font-bold text-gray-800">Đang tải chi tiết đơn hàng...</h2>
        <p className="text-gray-600">Vui lòng chờ trong giây lát.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-50">
      {vnpResponseCode === '00' ? (
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl">
          <span className="text-9xl mb-6">✅</span>
          <h1 className="text-5xl font-bold text-green-700 mb-4">Thanh toán thành công!</h1>
          <p className="text-xl text-gray-700 mb-6">Cảm ơn bạn đã mua hàng tại cửa hàng chúng tôi.</p>
          {order ? (
            <div className="border-t pt-4 mt-4">
              <p className="text-lg font-semibold">Mã đơn hàng: {order.id}</p>
              <p>Tổng tiền: {new Intl.NumberFormat("vi-VN").format(order.total_price)}₫</p>
              {/* Display more order details as needed */}
            </div>
          ) : (
            <p className="text-red-500">{errorLoadingOrder}</p>
          )}

        </div>
      ) : (
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl">
          <span className="text-9xl mb-6">❌</span>
          <h1 className="text-5xl font-bold text-red-700 mb-4">Thanh toán thất bại!</h1>
          <p className="text-xl text-gray-700 mb-6">Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.</p>
          {errorLoadingOrder && <p className="text-red-500">{errorLoadingOrder}</p>}
          <Link
            to="/checkout"
            className="mt-8 px-10 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl hover:shadow-2xl transition-all transform hover:scale-105 font-bold text-lg"
          >
            Thử lại
          </Link>
        </div>
      )}
      <Link
        to="/"
        className="mt-8 px-10 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl hover:shadow-2xl transition-all transform hover:scale-105 font-bold text-lg"
      >
        Về trang chủ
      </Link>
    </div>

  );
}

export default PaymentSuccess;