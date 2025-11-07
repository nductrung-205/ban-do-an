import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { orderAPI, couponAPI, getImageUrl, vnpayAPI, momoAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Import dữ liệu từ các file JSON tĩnh
import provincesData from "../data/provinces.json";
import districtsData from "../data/districts.json";
import wardsData from "../data/wards.json";

function Checkout() {
    const { cart, clearCart } = useCart();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            toast.warning("Vui lòng đăng nhập để tiếp tục thanh toán!");
            navigate("/login", { replace: true });
        }
    }, [user, navigate]);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        city: "", // Tên thành phố
        district: "", // Tên quận/huyện
        ward: "", // Tên phường/xã
        address: "",
        type: "Nhà Riêng",
        note: "",
        paymentMethod: "COD",
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sử dụng dữ liệu đã import thay vì state rỗng và fetching
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // State để lưu trữ ID tạm thời khi người dùng chọn (vì form lưu tên)
    const [selectedProvinceId, setSelectedProvinceId] = useState("");
    const [selectedDistrictId, setSelectedDistrictId] = useState("");


    // --- State cho Coupon ---
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);

    // Cập nhật fullname và email khi user login
    useEffect(() => {
        if (user) {
            setForm(prevForm => ({
                ...prevForm,
                name: user.fullname || "",
                email: user.email || "",
            }));
        }
    }, [user]);

    // NEW: Tải danh sách coupon công khai
    useEffect(() => {
        const fetchAvailableCoupons = async () => {
            setLoadingCoupons(true);
            try {
                const res = await couponAPI.getAll();
                const now = new Date();
                const filteredCoupons = res.data.data.filter(c => {
                    const validFrom = c.valid_from ? new Date(c.valid_from) : null;
                    const validTo = c.valid_to ? new Date(c.valid_to) : null;
                    const isActive = (!validFrom || now >= validFrom) && (!validTo || now <= validTo);
                    const hasUsageLeft = c.usage_limit === null || c.usage_limit > 0;

                    return isActive && hasUsageLeft;
                });
                setAvailableCoupons(filteredCoupons);
            } catch (err) {
                console.error("Error loading available coupons:", err);
                toast.error("Không thể tải danh sách mã giảm giá.");
            } finally {
                setLoadingCoupons(false);
            }
        };
        fetchAvailableCoupons();
    }, []);

    // Load tất cả tỉnh/thành phố khi component mount
    useEffect(() => {
        // Giả sử dữ liệu JSON có cấu trúc là một mảng các đối tượng
        setProvinces(provincesData);
    }, []);

    // Load districts based on selected province ID from local data
    const loadDistricts = useCallback((provinceCode) => { // Đổi tên tham số thành provinceCode
        setDistricts([]);
        setWards([]);
        setForm(prevForm => ({ ...prevForm, district: "", ward: "" }));
        setSelectedDistrictId("");

        if (provinceCode) {
            // Lọc các quận/huyện có parent_code tương ứng với provinceCode
            const filteredDistricts = districtsData.filter(d => d.parent_code === provinceCode);
            setDistricts(filteredDistricts);
        }
    }, []);

    // Load wards based on selected district ID from local data
    const loadWards = useCallback((districtCode) => { // Đổi tên tham số thành districtCode
        setWards([]);
        setForm(prevForm => ({ ...prevForm, ward: "" }));

        if (districtCode) {
            // Lọc các phường/xã có parent_code tương ứng với districtCode
            const filteredWards = wardsData.filter(w => w.parent_code === districtCode);
            setWards(filteredWards);
        }
    }, []);

    const handleCityChange = (e) => {
        const code = e.target.value; // Lấy 'code' từ option đã chọn
        setSelectedProvinceId(code); // Lưu 'code' đã chọn

        // Tìm đối tượng tỉnh/thành phố dựa trên 'code'
        const selectedCity = provinces.find(p => p.code === code);

        setForm(prevForm => ({
            ...prevForm,
            city: selectedCity ? selectedCity.name_with_type : "", // Lưu 'name_with_type' vào form.city
            district: "", // Reset district khi đổi city
            ward: ""      // Reset ward khi đổi city
        }));
        setErrors(prevErrors => ({ ...prevErrors, city: "" }));
        loadDistricts(code); // Truyền 'code' để tải huyện
    };

    const handleDistrictChange = (e) => {
        const code = e.target.value; // Lấy 'code' từ option đã chọn
        setSelectedDistrictId(code); // Lưu 'code' đã chọn

        // Tìm đối tượng quận/huyện dựa trên 'code'
        const selectedDistrict = districts.find(d => d.code === code);

        setForm(prevForm => ({
            ...prevForm,
            district: selectedDistrict ? selectedDistrict.name_with_type : "", // Lưu 'name_with_type' vào form.district
            ward: "" // Reset ward khi đổi district
        }));
        setErrors(prevErrors => ({ ...prevErrors, district: "" }));
        loadWards(code); // Truyền 'code' để tải xã
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
        setErrors(prevErrors => ({ ...prevErrors, [name]: "" }));
    };

    // --- Price Calculations ---
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = cart.length > 0 ? (subtotal >= 200000 ? 0 : 15000) : 0;

    // Tính toán giảm giá từ coupon
    let couponDiscount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discount_amount) {
            couponDiscount = appliedCoupon.discount_amount;
        } else if (appliedCoupon.discount_percent) {
            couponDiscount = subtotal * (appliedCoupon.discount_percent / 100);
        }
    }
    couponDiscount = Math.min(couponDiscount, subtotal);

    const total = subtotal + deliveryFee - couponDiscount;

    const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + "₫";

    // --- Coupon Application Logic ---
    const handleApplyCoupon = async (codeToApply = couponCode) => {
        if (!codeToApply.trim()) {
            setCouponError("Vui lòng nhập mã giảm giá.");
            return;
        }
        setCouponError("");
        setIsApplyingCoupon(true);
        try {
            const res = await couponAPI.apply({ code: codeToApply });
            setAppliedCoupon(res.data.data);
            setCouponCode(codeToApply);
            Swal.fire("Thành công!", res.data.message, "success");
        } catch (error) {
            setAppliedCoupon(null);
            const errorMessage = error.response?.data?.message || "Không thể áp dụng mã giảm giá.";
            setCouponError(errorMessage);
            Swal.fire("Lỗi!", errorMessage, "error");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponError("");
        Swal.fire("Đã hủy!", "Mã giảm giá đã được gỡ bỏ.", "info");
    };

    const handleCopyAndApply = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.info(`Đã sao chép mã "${code}"`);
            setCouponCode(code);
            await handleApplyCoupon(code);
        } catch (err) {
            console.error("Failed to copy text:", err);
            toast.error("Không thể sao chép mã giảm giá.");
        }
    };

    // --- Form Validation ---
    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Vui lòng nhập họ và tên.";
        if (!form.email.trim()) newErrors.email = "Vui lòng nhập email.";
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email không hợp lệ.";
        if (!form.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại.";
        else if (!/^\d{10,11}$/.test(form.phone)) newErrors.phone = "Số điện thoại không hợp lệ.";
        if (!form.city) newErrors.city = "Vui lòng chọn Tỉnh/Thành phố.";
        if (!form.district) newErrors.district = "Vui lòng chọn Quận/Huyện.";
        if (!form.ward) newErrors.ward = "Vui lòng chọn Phường/Xã.";
        if (!form.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ cụ thể.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [form]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            toast.warn("Giỏ hàng của bạn đang trống!");
            return;
        }

        if (!validateForm()) {
            toast.error("Vui lòng điền đầy đủ và chính xác thông tin giao hàng!");
            return;
        }

        setIsSubmitting(true);

        try {
            const orderPayload = {
                user_id: user?.id || null,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                })),
                total_price: total,
                payment_method: form.paymentMethod,
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                customer: {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    city: form.city,
                    district: form.district,
                    ward: form.ward,
                    address: form.address,
                    type: form.type,
                    note: form.note,
                }
            };

            console.log("📤 Sending order to backend for initial creation:", orderPayload);
            const apiResponse = await orderAPI.create(orderPayload);
            const orderData = apiResponse.data.data;
            const orderId = orderData.id;

            console.log("✅ Order created successfully with ID:", orderId);

            if (form.paymentMethod === "VNPay") {
                console.log("🌐 Initiating VNPay payment for order ID:", orderId);
                const vnpayResponse = await vnpayAPI.createPayment({
                    order_id: orderId,
                    amount: total,
                });

                if (vnpayResponse.data.payment_url) {
                    console.log("Redirecting to VNPay URL:", vnpayResponse.data.payment_url);
                    window.location.href = vnpayResponse.data.payment_url;
                } else {
                    toast.error("Không thể tạo liên kết thanh toán VNPay.");
                    console.error("❌ VNPay API did not return a payment_url.");
                }
            } else if (form.paymentMethod === "MoMo") {
                console.log("📱 Initiating MoMo payment for order ID:", orderId);

                try {
                    // Gửi yêu cầu tới backend thông qua momoAPI
                    const momoResponse = await momoAPI.createPayment({ // <-- Sửa lỗi 1: Đổi orderAPI.createMoMoPayment thành momoAPI.createPayment
                        amount: total,
                        your_internal_order_id: orderId
                    });

                    if (momoResponse.data && momoResponse.data.payUrl) { // <-- Sửa lỗi 2: Đổi .payUrl thành .payUrl
                        console.log("Redirecting to MoMo URL:", momoResponse.data.payUrl);
                        window.location.href = momoResponse.data.payUrl;
                    } else {
                        toast.error("Không thể tạo liên kết thanh toán MoMo.");
                        console.error("❌ MoMo API did not return a payUrl.", momoResponse.data);
                    }
                } catch (err) {
                    console.error("❌ Lỗi khi tạo thanh toán MoMo:", err);
                    toast.error("Có lỗi xảy ra khi khởi tạo thanh toán MoMo.");
                }
            }

            else if (form.paymentMethod === "COD") {
                console.log("💵 COD payment selected. Order is complete.");
                toast.success("Đặt hàng thành công! Cảm ơn bạn.");
                clearCart();
                navigate("/success", { state: { order: orderData } });
            }

        } catch (error) {
            console.error("❌ Lỗi khi đặt hàng:", error);

            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                toast.error("Lỗi nhập liệu:\n" + errorMessages.join("\n"));
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-red-50">
            <Header />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-4xl">🛍️</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                        Thanh toán
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Hoàn tất đơn hàng của bạn chỉ với vài bước đơn giản
                    </p>
                </div>

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-xl">
                        <div className="w-64 h-64 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-6">
                            <span className="text-9xl">🛒</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">Giỏ hàng trống</h2>
                        <p className="text-gray-600 mb-8">Hãy thêm món ăn vào giỏ hàng để tiếp tục</p>
                        <Link
                            to="/menu"
                            className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-2xl transition-all transform hover:scale-105 font-bold text-lg"
                        >
                            🍕 Khám phá thực đơn
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Form thông tin */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Thông tin giao hàng */}
                            <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <span className="text-3xl">📍</span>
                                    Thông tin giao hàng
                                </h2>
                                <form className="space-y-5">
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Họ và tên <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="VD: Nguyễn Văn A"
                                                value={form.name}
                                                onChange={handleChange}
                                                className={`w-full border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
                                                required
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Số điện thoại <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="VD: 0912345678"
                                                value={form.phone}
                                                onChange={handleChange}
                                                className={`w-full border-2 ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
                                                required
                                            />
                                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="VD: email@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                            className={`w-full border-2 ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
                                            required
                                        />
                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Tỉnh/Thành phố <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={selectedProvinceId}
                                                    onChange={handleCityChange}
                                                    className={`w-full border-2 ${errors.city ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100`}
                                                    required
                                                >
                                                    <option value="">-- Chọn Tỉnh/TP --</option>
                                                    {provinces.map((p) => (
                                                        <option key={p.code} value={p.code}> {/* <-- Dùng p.code */}
                                                            {p.name_with_type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Quận/Huyện <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={selectedDistrictId}
                                                    onChange={handleDistrictChange}
                                                    className={`w-full border-2 ${errors.district ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100`}
                                                    disabled={!districts.length}
                                                    required
                                                >
                                                    <option value="">-- Chọn Quận/Huyện --</option>
                                                    {districts.map((d) => (
                                                        <option key={d.code} value={d.code}> {/* <-- Dùng d.code */}
                                                            {d.name_with_type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phường/Xã <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="ward"
                                                    // Giá trị của select phải là tên phường/xã trong form
                                                    value={form.ward} // <-- Sửa chỗ này
                                                    onChange={(e) => {
                                                        const selectedWardName = e.target.value;
                                                        setForm(prevForm => ({ ...prevForm, ward: selectedWardName }));
                                                        setErrors(prevErrors => ({ ...prevErrors, ward: "" }));
                                                    }}
                                                    className={`w-full border-2 ${errors.ward ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100`}
                                                    disabled={!wards.length}
                                                    required
                                                >
                                                    <option value="">-- Chọn Phường/Xã --</option>
                                                    {wards.map((w) => (
                                                        // Giá trị của option là name_with_type của phường/xã
                                                        <option key={w.code} value={w.name_with_type}>
                                                            {w.name_with_type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.ward && <p className="text-red-500 text-sm mt-1">{errors.ward}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Địa chỉ cụ thể <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            placeholder="Số nhà, tên đường..."
                                            value={form.address}
                                            onChange={handleChange}
                                            className={`w-full border-2 ${errors.address ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
                                            required
                                        />
                                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Loại địa chỉ
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center cursor-pointer bg-gray-50 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-all">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="Nhà Riêng"
                                                    checked={form.type === "Nhà Riêng"}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="ml-3 font-semibold">🏠 Nhà Riêng</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer bg-gray-50 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-all">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="Văn Phòng"
                                                    checked={form.type === "Văn Phòng"}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="ml-3 font-semibold">🏢 Văn Phòng</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Ghi chú đơn hàng (tùy chọn)
                                        </label>
                                        <textarea
                                            name="note"
                                            placeholder="VD: Không cay, ít đá, giao tầng 5..."
                                            value={form.note}
                                            onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                            rows="3"
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Phương thức thanh toán */}
                            <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <span className="text-3xl">💳</span>
                                    Phương thức thanh toán
                                </h2>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-300 transition-all hover:shadow-md">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="COD"
                                                checked={form.paymentMethod === "COD"}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-800">💵 Thanh toán khi nhận hàng (COD)</p>
                                                <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                                            </div>
                                        </div>
                                        <span className="text-green-600 font-bold">Khuyên dùng</span>
                                    </label>

                                    <label className="flex items-center cursor-pointer p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="VNPay"
                                                checked={form.paymentMethod === "VNPay"}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-800">🌐 Thanh toán qua VNPay</p>
                                                <p className="text-sm text-gray-600">Hỗ trợ hầu hết các ngân hàng Việt Nam</p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center cursor-pointer p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border-2 border-pink-300 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="MoMo" // Thêm giá trị 'MoMo'
                                                checked={form.paymentMethod === "MoMo"}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-800">📱 Thanh toán qua MoMo</p>
                                                <p className="text-sm text-gray-600">Quét mã QR hoặc dùng ứng dụng MoMo</p>
                                            </div>
                                        </div>
                                    </label>

                                </div>
                            </div>
                        </div>

                        {/* Sidebar tổng đơn */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-2xl xl rounded-3xl p-6 sticky top-4 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="text-orange-500">📦</span>
                                    Đơn hàng
                                </h2>

                                {/* Danh sách món */}
                                <div className="max-h-64 overflow-y-auto mb-6 space-y-3">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{item.name}</p>
                                                <p className="text-xs text-gray-600">SL: {item.quantity}</p>
                                                <p className="text-orange-600 font-bold text-sm">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Form nhập mã giảm giá */}
                                <div className="mb-6 pt-4 border-t-2 border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Mã giảm giá</h3>
                                    {appliedCoupon ? (
                                        <div className="flex justify-between items-center bg-green-50 text-green-700 p-3 rounded-xl border border-green-200">
                                            <span>
                                                Đã áp dụng: <span className="font-bold">{couponCode}</span>
                                                {" "} (Giảm {appliedCoupon.discount_amount ? formatPrice(appliedCoupon.discount_amount) : `${appliedCoupon.discount_percent}%`})
                                            </span>
                                            <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700">
                                                Gỡ bỏ
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã giảm giá"
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        setCouponCode(e.target.value);
                                                        setCouponError("");
                                                    }}
                                                    className={`flex-1 border-2 ${couponError ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                                                    disabled={isApplyingCoupon}
                                                />
                                                <button
                                                    onClick={() => handleApplyCoupon()}
                                                    className="px-5 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isApplyingCoupon}
                                                >
                                                    {isApplyingCoupon ? "Đang áp dụng..." : "Áp dụng"}
                                                </button>
                                            </div>
                                            {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}

                                            {/* NEW: Danh sách mã giảm giá có sẵn */}
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Mã giảm giá khả dụng:</h4>
                                                {loadingCoupons ? (
                                                    <p className="text-gray-500 flex items-center gap-2">
                                                        <span className="animate-spin">🌀</span>Đang tải mã giảm giá...
                                                    </p>
                                                ) : availableCoupons.length === 0 ? (
                                                    <p className="text-gray-500 text-sm">Hiện chưa có mã giảm giá nào.</p>
                                                ) : (<div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                    {availableCoupons.map((coupon) => (
                                                        <div key={coupon.id} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                            <div>
                                                                <p className="font-bold text-purple-800">{coupon.code}</p>
                                                                <p className="text-sm text-purple-700">
                                                                    {coupon.discount_amount ? `Giảm ${formatPrice(coupon.discount_amount)}` : `Giảm ${coupon.discount_percent}%`}
                                                                    {coupon.min_order_amount && ` cho đơn từ ${formatPrice(coupon.min_order_amount)}`}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCopyAndApply(coupon.code)}
                                                                className="text-purple-600 hover:text-purple-800 text-sm font-semibold px-3 py-1 bg-purple-100 rounded-md hover:bg-purple-200 transition"
                                                            >
                                                                Áp dụng
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>


                                {/* Tổng cộng */}
                                <div className="space-y-3 mb-6 text-gray-700 pt-4 border-t-2 border-gray-200">
                                    <div className="flex justify-between">
                                        <span>Tạm tính:</span>
                                        <span className="font-semibold">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Phí giao hàng:</span>
                                        <span className="font-semibold">
                                            {deliveryFee === 0 ? "Miễn phí" : formatPrice(deliveryFee)}
                                        </span>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Giảm giá:</span>
                                            <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-2xl font-bold text-gray-900 border-t-2 border-gray-300 pt-4">
                                    <span>Tổng cộng:</span>
                                    <span className="text-orange-600">{formatPrice(total)}</span>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={isSubmitting || cart.length === 0}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="animate-spin text-white">🔄</span>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl">🎉</span>
                                            Hoàn tất đặt hàng
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Checkout;