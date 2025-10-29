import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { productAPI } from "../api";

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // 🟠 Fetch dữ liệu sản phẩm và danh mục
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await productAPI.getAll();
        const productsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        setProducts(productsData);
        setFiltered(productsData);

        // Lấy danh mục duy nhất
        const categoryMap = new Map();
        productsData.forEach((p) => {
          if (p.category && !categoryMap.has(p.category.slug)) {
            categoryMap.set(p.category.slug, p.category);
          }
        });
        setCategories(Array.from(categoryMap.values()));
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        setProducts([]);
        setFiltered([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🟢 Lọc và sắp xếp
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categorySlug = params.get("category") || "";
    const search = params.get("search") || "";

    let result = [...products];

    // Lọc theo search
    if (search) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Khởi tạo từ URL nếu có
    if (categorySlug && !selectedCategory) {
      setSelectedCategory(categorySlug);
    }

    // Lọc theo danh mục
    if (selectedCategory) {
      result = result.filter(
        (p) =>
          p.category?.slug === selectedCategory ||
          p.category?.name === selectedCategory
      );
    }

    // Sắp xếp theo giá
    if (sort === "asc") {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sort === "desc") {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    setFiltered(result);
  }, [products, location.search, selectedCategory, sort]);

  // 🧹 Xóa bộ lọc
  const clearFilters = () => {
    setSelectedCategory("");
    setSort("");
    setFiltered(products);
    navigate("/menu", { replace: true });
  };

  // 💰 Format giá tiền
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "₫";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🧭 Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo + Trang chủ */}
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-2"
          >
            🍜 <span>Food Order</span>
          </button>

          {/* Nút đến giỏ hàng */}
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition"
          >
            🛒 <span>Giỏ hàng</span>
          </button>
        </div>
      </header>

      {/* 🧩 Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Thực đơn</h1>
          <p className="text-gray-600">
            Khám phá những món ăn ngon từ chúng tôi
          </p>
        </div>

        {/* 🎛️ Bộ lọc */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Danh mục */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCategory(value);

                  const params = new URLSearchParams(location.search);
                  if (value) {
                    params.set("category", value);
                  } else {
                    params.delete("category");
                  }
                  navigate(`?${params.toString()}`, { replace: true });
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sắp xếp theo giá
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Mặc định</option>
                <option value="asc">Giá tăng dần</option>
                <option value="desc">Giá giảm dần</option>
              </select>
            </div>

            {/* Nút xóa */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Tìm thấy{" "}
            <span className="font-bold text-orange-600">{filtered.length}</span>{" "}
            sản phẩm
          </div>
        </div>

        {/* 🧃 Danh sách sản phẩm */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Không tìm thấy sản phẩm
            </h3>
            <p className="text-gray-600 mb-6">
              Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition font-semibold"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 group"
              >
                <div
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-48 object-cover rounded-t-2xl group-hover:scale-110 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-2xl flex items-center justify-center">
                      <span className="text-6xl">🍜</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300"></div>
                  {p.category && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                      {p.category.name}
                    </div>
                  )}
                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-2xl">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Nội dung sản phẩm */}
                <div className="p-4">
                  <h3
                    className="font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition cursor-pointer line-clamp-1"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    {p.name}
                  </h3>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">
                    {p.description || "Món ăn ngon, đặc sắc"}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-orange-600 font-bold text-lg">
                      {formatPrice(p.price)}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600 font-semibold">
                        4.5
                      </span>
                    </div>
                  </div>

                  {p.stock > 0 ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart({ ...p, quantity: 1 })}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                      >
                        🛒 Thêm
                      </button>
                      <button
                        onClick={() => {
                          addToCart({ ...p, quantity: 1 });
                          navigate("/cart");
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-lg hover:shadow-lg transition font-semibold text-sm"
                      >
                        Mua ngay
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 px-3 py-2 rounded-lg cursor-not-allowed font-semibold text-sm"
                    >
                      Hết hàng
                    </button>
                  )}

                  {p.stock > 0 && p.stock <= 10 && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      ⚠️ Chỉ còn {p.stock} suất
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 Food Order. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
