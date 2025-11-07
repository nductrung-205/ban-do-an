import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productAPI } from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { notificationAPI } from "../api";


export default function Header() {
    const [keyword, setKeyword] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [openMenu, setOpenMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [allProducts, setAllProducts] = useState([]);

    const navigate = useNavigate();
    const { cart } = useCart();
    const { user, logout } = useAuth();

    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [latestNotifications, setLatestNotifications] = useState([]);

    // Tổng số món hàng trong giỏ
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    // const [notifications, setNotifications] = useState([]);
    // const [openNoti, setOpenNoti] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            const res = await notificationAPI.getAll();
            const data = res.data.data || [];
            setLatestNotifications(data.slice(0, 3));
            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        };
        fetchNotifications();
    }, [user]);

    const handleBellClick = () => {
        if (!user) {
            alert("Vui lòng đăng nhập để xem thông báo!");
            return;
        }
        setShowDropdown(!showDropdown);
    };

    // Tải danh sách sản phẩm khi component mount
    useEffect(() => {
        let isMounted = true; // tránh update state khi unmount

        productAPI.getAll()
            .then(res => {
                if (isMounted) setAllProducts(res.data.data || res.data); // tùy response
            })
            .catch(console.error);

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);

        return () => {
            isMounted = false;
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    // Tìm kiếm đề xuất dựa trên keyword nhập
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setKeyword(value);

        if (!value.trim()) {
            setSuggestions([]);
            return;
        }

        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);

        setSuggestions(filtered);
    }, [allProducts]);

    // Xử lý submit form tìm kiếm
    const handleSearch = useCallback((e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
            setKeyword("");
            setSuggestions([]);
        }
    }, [keyword, navigate]);

    // Chọn đề xuất
    const handleSelectSuggestion = useCallback((id) => {
        navigate(`/products/${id}`);
        setKeyword("");
        setSuggestions([]);
    }, [navigate]);

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300
      ${scrolled ? "bg-white shadow-lg" : "bg-gradient-to-r from-orange-500 to-red-500"}`}
        >
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-6">
                {/* Logo */}
                <Link
                    to="/"
                    className={`flex items-center gap-2 text-2xl font-bold tracking-tight transition-colors
            ${scrolled ? "text-orange-600" : "text-white"}`}
                    aria-label="Trang chủ"
                >
                    <span className="text-3xl" role="img" aria-label="bát mì">🍜</span>
                    <span className="hidden md:block select-none">Nguyễn Đức Trung</span>
                </Link>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl flex">
                    <input
                        type="search"
                        placeholder="Tìm món ăn yêu thích..."
                        value={keyword}
                        onChange={handleChange}
                        className={`flex-grow px-4 py-2.5 rounded-l-full outline-none transition-all
              ${scrolled
                                ? "bg-gray-100 text-gray-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
                                : "bg-white/90 text-gray-800 focus:bg-white"}`}
                        aria-label="Tìm kiếm sản phẩm"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        className={`px-6 py-2.5 rounded-r-full font-semibold transition-colors
              ${scrolled
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : "bg-orange-700 text-white hover:bg-orange-800"}`}
                        aria-label="Tìm kiếm"
                    >
                        🔍
                    </button>

                    {/* Gợi ý tìm kiếm */}
                    {suggestions.length > 0 && (
                        <ul className="absolute z-50 bg-white text-gray-800 mt-2 w-full rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto">
                            {suggestions.map(({ id, name, image, price }) => (
                                <li
                                    key={id}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-orange-50 transition border-b last:border-b-0"
                                    onClick={() => handleSelectSuggestion(id)}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleSelectSuggestion(id);
                                        }
                                    }}
                                    role="button"
                                    aria-label={`Xem sản phẩm ${name}`}
                                >
                                    <img
                                        src={image || "/placeholder.png"}
                                        alt={name}
                                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                        loading="lazy"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 truncate">{name}</p>
                                        <p className="text-sm text-orange-600">{price?.toLocaleString("vi-VN", { style: 'currency', currency: 'VND' })}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </form>

                {/* Navigation */}
                <nav className="flex items-center gap-2 text-sm md:text-base">
                    <Link
                        to="/"
                        className={`px-4 py-2 rounded-lg font-medium transition-all
              ${scrolled
                                ? "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                : "text-white hover:bg-white/20"}`}
                    >
                        Trang chủ
                    </Link>
                    <Link
                        to="/menu"
                        className={`px-4 py-2 rounded-lg font-medium transition-all
              ${scrolled
                                ? "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                : "text-white hover:bg-white/20"}`}
                    >
                        Thực đơn
                    </Link>
                    <Link
                        to="/cart"
                        className={`relative px-4 py-2 rounded-lg font-medium transition-all
              ${scrolled
                                ? "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                : "text-white hover:bg-white/20"}`}
                        aria-label={`Giỏ hàng có ${totalItems} món`}
                    >
                        🛒 Giỏ hàng
                        {totalItems > 0 && (
                            <span
                                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-pulse"
                                aria-live="polite"
                            >
                                {totalItems}
                            </span>
                        )}
                    </Link>

                    {user && (
                        <div className="relative">
                            <button
                                onClick={handleBellClick}
                                className="relative text-2xl text-gray-700 hover:text-orange-500"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-4 z-50">
                                    <h3 className="font-semibold mb-2">Thông báo mới nhất</h3>

                                    {latestNotifications.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Không có thông báo nào</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {latestNotifications.map((n) => (
                                                <li
                                                    key={n.id}
                                                    className={`p-2 rounded ${!n.is_read ? "bg-orange-50" : ""}`}
                                                >
                                                    <p className="font-medium text-gray-800">{n.title}</p>
                                                    <p className="text-sm text-gray-600">{n.message}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="p-3 border-t bg-gray-50 text-center">
                                        <button
                                            onClick={() => navigate("/notifications")}
                                            className="mt-3 w-full text-center text-sm text-orange-600 hover:underline"
                                        >
                                            Xem tất cả →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!user && (
                        <button
                            onClick={() => alert("Vui lòng đăng nhập để xem thông báo.")}
                            className={`px-4 py-2 rounded-lg font-medium transition-all
      ${scrolled
                                    ? "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                    : "text-white hover:bg-white/20"}`}
                        >
                            🔔
                        </button>
                    )}


                    {/* User menu */}
                    {!user ? (
                        <>
                            <Link
                                to="/login"
                                className={`px-4 py-2 rounded-lg font-medium transition-all
                  ${scrolled
                                        ? "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                        : "text-white hover:bg-white/20"}`}
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                to="/register"
                                className={`px-5 py-2 rounded-full font-semibold transition-all
                  ${scrolled
                                        ? "bg-orange-500 text-white hover:bg-orange-600"
                                        : "bg-white text-orange-600 hover:bg-orange-50"}`}
                            >
                                Đăng ký
                            </Link>
                        </>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setOpenMenu(!openMenu)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${scrolled
                                        ? "text-gray-700 hover:bg-orange-50"
                                        : "text-white hover:bg-white/20"}`}
                                aria-haspopup="true"
                                aria-expanded={openMenu}
                                aria-label="Menu người dùng"
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                    ${scrolled ? "bg-orange-500 text-white" : "bg-white text-orange-600"}`}
                                >
                                    {user.fullname?.[0]?.toUpperCase() || "U"}
                                </div>
                                <span className="hidden md:block truncate max-w-[10rem]">{user.fullname || user.email}</span>
                            </button>

                            {openMenu && (
                                <div
                                    className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl w-56 border border-gray-100 overflow-hidden"
                                    role="menu"
                                >
                                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-b">
                                        <p className="font-semibold text-gray-800 truncate">{user.fullname}</p>
                                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        className="block px-4 py-3 hover:bg-orange-50 transition text-gray-700"
                                        role="menuitem"
                                        onClick={() => setOpenMenu(false)}
                                    >
                                        👤 Tài khoản của tôi
                                    </Link>
                                    <Link
                                        to="/orders"
                                        className="block px-4 py-3 hover:bg-orange-50 transition text-gray-700"
                                        role="menuitem"
                                        onClick={() => setOpenMenu(false)}
                                    >
                                        📦 Đơn hàng của tôi
                                    </Link>
                                    {user.role === 0 && (
                                        <Link
                                            to="/admin"
                                            className="block px-4 py-3 hover:bg-orange-50 transition text-gray-700 border-t"
                                            role="menuitem"
                                            onClick={() => setOpenMenu(false)}
                                        >
                                            ⚙️ Quản trị
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => {
                                            logout();
                                            setOpenMenu(false);
                                            navigate("/");
                                        }}
                                        className="block w-full text-left px-4 py-3 hover:bg-red-50 transition text-red-600 border-t font-semibold"
                                        role="menuitem"
                                    >
                                        🚪 Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
