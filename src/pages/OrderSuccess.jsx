import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    useEffect(() => {
        console.log('Order data:', order);
        console.log('Coupon code:', order.coupon_code);
        console.log('Coupon code type:', typeof order.coupon_code);
        console.log('Discount amount:', order.discount_amount);
    }, [order]);

    // Helper function to format price
    const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + "₫";

    const hasCoupon = (code) => {
        return code && typeof code === 'string' && code.trim() !== '';
    };

    const hasDiscount = (amount) => {
        return amount && parseFloat(amount) > 0;
    };

    if (!order) {
        // Nếu không có thông tin order, hiển thị thông báo lỗi hoặc chuyển hướng
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl p-8">
                        <p className="text-gray-600 mb-4 text-xl">
                            Không tìm thấy thông tin đơn hàng. Có thể đã có lỗi xảy ra hoặc bạn truy cập trực tiếp.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Nếu có thông tin order, hiển thị chi tiết
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Icon thành công */}
                    <div className="mb-6 text-8xl text-green-500">✅</div>

                    <h1 className="text-3xl font-bold text-green-600 mb-4">
                        Đặt hàng thành công!
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn.
                    </p>

                    {/* Thông tin đơn hàng */}
                    <div className="bg-orange-50 rounded-xl p-6 mb-8 text-left border border-orange-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-orange-500">📝</span> Thông tin đơn hàng
                        </h2>

                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <span className="font-semibold text-gray-900">{order.order_code || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <span className="text-gray-600">Người nhận:</span>
                                <span className="font-semibold text-gray-900">{order.customer_name || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-semibold text-gray-900">{order.customer_email || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <span className="text-gray-600">Số điện thoại:</span>
                                <span className="font-semibold text-gray-900">{order.customer_phone || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <span className="text-gray-600">Địa chỉ giao hàng:</span>
                                <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                                    {order.customer_address}, {order.customer_ward}, {order.customer_district}, {order.customer_city} ({order.customer_type})
                                </span>
                            </div>

                            {hasCoupon(order.coupon_code) && (
                                <div className="flex justify-between items-start">
                                    <span className="text-gray-600">Mã giảm giá đã dùng:</span>
                                    <span className="font-semibold text-green-600">{order.coupon_code}</span>
                                </div>
                            )}

                            {hasDiscount(order.discount_amount) && (
                                <div className="flex justify-between text-base text-green-600">
                                    <span>Giảm giá:</span>
                                    <span className="font-semibold">-{formatPrice(order.discount_amount)}</span>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-orange-500">🛒</span> Sản phẩm đã đặt
                                </h3>
                                <ul className="space-y-2">
                                    {order.items?.length > 0 ? (
                                        order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-center text-sm bg-orange-100 p-3 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    {item.product_image && (
                                                        <img
                                                            src={`http://localhost:8000/storage/${item.product_image}`}
                                                            alt={item.product_name}
                                                            className="w-10 h-10 object-cover rounded-md"
                                                        />
                                                    )}
                                                    <span className="font-medium text-gray-800">{item.product_name} x {item.quantity}</span>
                                                </div>
                                                <span className="font-bold text-orange-600">{formatPrice(item.price * item.quantity)}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">Không có sản phẩm nào trong đơn hàng này.</p>
                                    )}
                                </ul>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-700">Tạm tính:</span>
                                    <span className="font-semibold text-gray-800">{formatPrice(order.subtotal_price || 0)}</span>
                                </div>
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-700">Phí giao hàng:</span>
                                    <span className="font-semibold text-gray-800">{formatPrice(order.delivery_fee || 0)}</span>
                                </div>
                                {/* ĐÃ CÓ: HIỂN THỊ GIẢM GIÁ NẾU CÓ */}
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-base text-green-600">
                                        <span>Giảm giá:</span>
                                        <span className="font-semibold">-{formatPrice(order.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300">
                                    <span className="text-xl font-bold text-gray-800">Tổng tiền:</span>
                                    <span className="text-3xl font-bold text-orange-600">{formatPrice(order.total_price || 0)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700 mt-2">
                                    <span>Phương thức thanh toán:</span>
                                    <span className="font-semibold text-gray-800">{order.payment_method || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Trạng thái đơn hàng:</span>
                                    <span className="font-semibold text-orange-500">{order.status || 'Đang xử lý'}</span>
                                </div>
                                {order.customer_note && (
                                    <div className="flex justify-between text-gray-700">
                                        <span>Ghi chú:</span>
                                        <span className="font-semibold text-gray-800 text-right max-w-[60%]">{order.customer_note}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate("/orders")}
                            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition font-bold text-lg"
                        >
                            Xem đơn hàng của tôi
                        </button>

                        <button
                            onClick={() => navigate("/")}
                            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default OrderSuccess;