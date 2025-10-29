import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";

function Cart() {
    const navigate = useNavigate();
    const { cart, removeFromCart, clearCart, increaseQty, decreaseQty } = useCart();

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");

    // Tính toán giá
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = cart.length > 0 ? (subtotal >= 200000 ? 0 : 15000) : 0;

    // Logic giảm giá
    let discount = 0;
    if (appliedCoupon) {
        discount = appliedCoupon.value;
    } else if (subtotal >= 500000) {
        discount = 50000;
    } else if (subtotal >= 300000) {
        discount = 30000;
    }

    const total = subtotal + deliveryFee - discount;

    // Format tiền tệ
    const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + "₫";

    // Xử lý xóa món
    const handleRemove = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa món này khỏi giỏ hàng?")) {
            removeFromCart(id);
        }
    };

    // Xử lý xóa tất cả
    const handleClearCart = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tất cả món ăn trong giỏ hàng?")) {
            clearCart();
            setAppliedCoupon(null);
            setCouponCode("");
        }
    };

    // Áp dụng mã giảm giá (demo)
    const handleApplyCoupon = () => {
        setCouponError("");

        const validCoupons = {
            "FOOD50": { value: 50000, minOrder: 200000, name: "Giảm 50K" },
            "WELCOME": { value: 30000, minOrder: 100000, name: "Chào mừng" },
            "VIP100": { value: 100000, minOrder: 500000, name: "VIP 100K" },
        };

        const coupon = validCoupons[couponCode.toUpperCase()];

        if (!coupon) {
            setCouponError("Mã giảm giá không hợp lệ");
            return;
        }

        if (subtotal < coupon.minOrder) {
            setCouponError(`Đơn hàng tối thiểu ${formatPrice(coupon.minOrder)}`);
            return;
        }

        setAppliedCoupon(coupon);
        setCouponCode("");
    };

    // Xóa mã giảm giá
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponError("");
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header giỏ hàng */}
                    <div className="text-center mb-8">
                        <div className="inline-block mb-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-4xl">🛒</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                            Giỏ hàng của bạn
                        </h1>
                        <p className="text-gray-600 text-lg">
                            {cart.length > 0
                                ? `${cart.length} món ăn đang chờ bạn`
                                : "Chưa có món ăn nào"}
                        </p>
                    </div>

                    {cart.length === 0 ? (
                        /* Giỏ hàng trống */
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative mb-8">
                                <div className="w-72 h-72 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center animate-pulse">
                                    <span className="text-9xl">🍽️</span>
                                </div>
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-5xl">😋</span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-3">
                                Giỏ hàng trống rỗng
                            </h2>
                            <p className="text-gray-600 mb-8 text-center max-w-md text-lg">
                                Khám phá hàng trăm món ăn ngon đang chờ bạn!<br />
                                Thêm món yêu thích vào giỏ và bắt đầu hành trình ẩm thực
                            </p>
                            <Link
                                to="/menu"
                                className="group relative px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold text-lg"
                            >
                                <span className="flex items-center gap-2">
                                    <span>🍕</span>
                                    Khám phá thực đơn
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </span>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Danh sách sản phẩm */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Card món ăn */}
                                <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-orange-500">🍔</span>
                                            Món đã chọn
                                            <span className="text-sm font-normal text-gray-500">({cart.length})</span>
                                        </h2>
                                        <button
                                            onClick={handleClearCart}
                                            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-semibold transition-all"
                                        >
                                            <span>🗑️</span>
                                            Xóa tất cả
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {cart.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group relative flex gap-4 p-5 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-100"
                                            >
                                                {/* Hình ảnh */}
                                                <div className="flex-shrink-0 relative">
                                                    {item.image ? (
                                                        <img
                                                            src={`http://localhost:8000/storage/${item.image}`}
                                                            alt={item.name}
                                                            className="w-28 h-28 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://via.placeholder.com/112x112?text=No+Image";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-28 h-28 bg-gradient-to-br from-orange-200 to-red-200 rounded-xl flex items-center justify-center">
                                                            <span className="text-5xl">🍜</span>
                                                        </div>
                                                    )}
                                                    {item.stock <= 10 && item.stock > 0 && (
                                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                                                            Sắp hết
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Thông tin món ăn */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800 text-lg mb-1 truncate group-hover:text-orange-600 transition-colors">
                                                        {item.name}
                                                    </h3>

                                                    {item.description && (
                                                        <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                                                            {item.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-orange-600 font-bold text-xl">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">/món</span>
                                                    </div>

                                                    {/* Điều chỉnh số lượng */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center bg-white rounded-xl shadow-md border-2 border-gray-100">
                                                            <button
                                                                onClick={() => {
                                                                    if (item.quantity === 1) {
                                                                        handleRemove(item.id);
                                                                    } else {
                                                                        decreaseQty(item.id);
                                                                    }
                                                                }}
                                                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-l-xl transition-all font-bold"
                                                            >
                                                                {item.quantity === 1 ? "🗑️" : "−"}
                                                            </button>
                                                            <div className="w-14 h-10 flex items-center justify-center">
                                                                <span className="font-bold text-gray-800 text-lg">
                                                                    {item.quantity}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => increaseQty(item.id)}
                                                                disabled={item.quantity >= item.stock}
                                                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-r-xl transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm text-gray-500">Tổng:</span>
                                                            <span className="text-orange-600 font-bold">
                                                                {formatPrice(item.price * item.quantity)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Nút xóa */}
                                                <button
                                                    onClick={() => handleRemove(item.id)}
                                                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                    title="Xóa món"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mã giảm giá */}
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl shadow-xl p-6 border-2 border-orange-200">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                        <span className="text-2xl">🎟️</span>
                                        Mã giảm giá
                                    </h3>

                                    {!appliedCoupon ? (
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    placeholder="Nhập mã giảm giá"
                                                    className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all transform hover:scale-105"
                                                >
                                                    Áp dụng
                                                </button>
                                            </div>
                                            {couponError && (
                                                <p className="text-red-500 text-sm flex items-center gap-1">
                                                    <span>⚠️</span>
                                                    {couponError}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-xs text-gray-600">Mã khả dụng:</span>
                                                {["FOOD50", "WELCOME", "VIP100"].map(code => (
                                                    <button
                                                        key={code}
                                                        onClick={() => setCouponCode(code)}
                                                        className="text-xs px-3 py-1 bg-white border border-orange-300 text-orange-600 rounded-full hover:bg-orange-50 transition-all font-semibold"
                                                    >
                                                        {code}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-green-300">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">✓</span>
                                                <div>
                                                    <p className="font-bold text-green-700">{appliedCoupon.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Giảm {formatPrice(appliedCoupon.value)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="text-red-500 hover:text-red-600 font-semibold text-sm"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}

                                    {/* Ưu đãi tự động */}
                                    {!appliedCoupon && discount > 0 && (
                                        <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                                            <p className="text-green-700 font-semibold flex items-center gap-2">
                                                <span className="text-xl">🎉</span>
                                                Giảm tự động {formatPrice(discount)} cho đơn hàng từ {formatPrice(subtotal >= 500000 ? 500000 : 300000)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Tiếp tục mua sắm */}
                                <Link
                                    to="/menu"
                                    className="block text-center py-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100 text-orange-600 hover:text-orange-700 font-semibold"
                                >
                                    ← Tiếp tục khám phá thêm món ngon
                                </Link>
                            </div>

                            {/* Tổng đơn hàng */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-3xl shadow-2xl p-6 sticky top-4 border border-gray-100">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <span className="text-orange-500">💳</span>
                                        Thanh toán
                                    </h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Tạm tính</span>
                                            <span className="font-semibold">{formatPrice(subtotal)}</span>
                                        </div>

                                        <div className="flex justify-between text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <span>Phí giao hàng</span>
                                                {subtotal >= 200000 && (
                                                    <span className="text-xs text-green-600 font-semibold">(Miễn phí)</span>
                                                )}
                                            </div>
                                            <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600 line-through' : ''}`}>
                                                {formatPrice(deliveryFee)}
                                            </span>
                                        </div>

                                        {discount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span className="flex items-center gap-1">
                                                    <span>🎉</span>
                                                    Giảm giá
                                                </span>
                                                <span className="font-semibold">-{formatPrice(discount)}</span>
                                            </div>
                                        )}

                                        <div className="border-t-2 border-gray-200 pt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold text-gray-800">Tổng cộng</span>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {formatPrice(total)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Đã bao gồm VAT
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nút thanh toán */}
                                    <button
                                        onClick={() => navigate("/checkout")}
                                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold text-lg mb-4 flex items-center justify-center gap-2"
                                    >
                                        <span>🚀</span>
                                        Tiến hành thanh toán
                                        <span>→</span>
                                    </button>

                                    {/* Cam kết dịch vụ */}
                                    <div className="space-y-3 py-4 border-t border-gray-200">
                                        <div className="flex items-center gap-3 text-sm text-gray-700">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span>🚚</span>
                                            </div>
                                            <span>Giao hàng nhanh 30 phút</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-700">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span>🔥</span>
                                            </div>
                                            <span>Đảm bảo món ăn nóng sốt</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-700">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span>↩️</span>
                                            </div>
                                            <span>Đổi trả miễn phí trong 24h</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card cam kết */}
                                <div className="mt-6 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100 rounded-3xl p-6 border-2 border-orange-200">
                                    <h3 className="font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                                        <span className="text-2xl">🏆</span>
                                        Cam kết chất lượng
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                                            <span className="text-2xl">🔒</span>
                                            <span className="font-semibold text-gray-700">Thanh toán an toàn 100%</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                                            <span className="text-2xl">⭐</span>
                                            <span className="font-semibold text-gray-700">4.9/5 từ 10,000+ đánh giá</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                                            <span className="text-2xl">📞</span>
                                            <span className="font-semibold text-gray-700">Hỗ trợ khách hàng 24/7</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}

export default Cart;