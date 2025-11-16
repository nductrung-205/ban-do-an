import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { categoryAPI, productAPI } from "../api";
import { ChevronLeft, ChevronRight, X } from "lucide-react"; // Import thêm icons

export default function Menu() {
  const [products, setProducts] = useState([]); // Giờ đây products sẽ là danh sách sản phẩm của trang hiện tại
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 20; // 20 sản phẩm mỗi trang

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. useEffect để lấy dữ liệu ban đầu và khi currentPage, selectedCategory, sort thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const categorySlugFromUrl = params.get("category") || "";
        const searchFromUrl = params.get("search") || "";
        const pageFromUrl = parseInt(params.get("page") || "1");
        const sortFromUrl = params.get("sort") || "";

        // Cập nhật state nếu giá trị từ URL khác với state hiện tại
        if (categorySlugFromUrl !== selectedCategory) {
          setSelectedCategory(categorySlugFromUrl);
        }
        if (pageFromUrl !== currentPage) {
          setCurrentPage(pageFromUrl);
        }
        if (sortFromUrl !== sort) {
          setSort(sortFromUrl);
        }


        // Tham số gửi lên API
        const productApiParams = {
          page: pageFromUrl, // Sử dụng page từ URL
          per_page: productsPerPage,
          status: 1, // Luôn chỉ lấy sản phẩm có status = 1 cho trang người dùng
        };

        if (categorySlugFromUrl) {
          // Tìm category từ slug để lấy id
          const selectedCat = categories.find(cat => cat.slug === categorySlugFromUrl);
          if (selectedCat) {
            productApiParams.category_id = selectedCat.id; // Gửi id thay vì slug
          }
        }

        if (searchFromUrl) {
          productApiParams.search = searchFromUrl;
        }

        if (sortFromUrl) {
          productApiParams.sort_by = 'price'; // Tên trường để sắp xếp
          productApiParams.sort_order = sortFromUrl; // asc/desc
        }


        const productsRes = await productAPI.getAll(productApiParams);
        const categoriesRes = await categoryAPI.getAll(); // Giả định categories không cần phân trang

        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data.data || []);

        // Cập nhật thông tin phân trang từ response
        if (productsRes.data.pagination) {
          setTotalPages(productsRes.data.pagination.last_page);
          setCurrentPage(productsRes.data.pagination.current_page);
        } else {
          setTotalPages(1);
          setCurrentPage(1);
        }

      } catch (error) {
        console.error("Error fetching menu data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]); // Chỉ lắng nghe thay đổi của URL search params


  // 2. Hàm thay đổi trang
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set("page", newPage);
    navigate(`?${params.toString()}`, { replace: true });
  };

  // 3. Xử lý thay đổi danh mục
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.set("page", 1); // Reset về trang 1 khi đổi danh mục
    navigate(`?${params.toString()}`, { replace: true });
  };

  // 4. Xử lý sắp xếp
  const handleSortChange = (e) => {
    const value = e.target.value;
    setSort(value);
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.set("page", 1); // Reset về trang 1 khi đổi sắp xếp
    navigate(`?${params.toString()}`, { replace: true });
  };

  // 5. Xóa bộ lọc
  const clearFilters = () => {
    setSelectedCategory("");
    setSort("");
    // setFiltered(products); // Không cần dòng này nữa vì dữ liệu được fetch từ API
    navigate("/menu", { replace: true }); // navigate về URL gốc
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
                onChange={handleCategoryChange} // Sử dụng hàm mới
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
                onChange={handleSortChange} // Sử dụng hàm mới
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
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold flex items-center gap-1"
              >
                <X size={18} /> Xóa bộ lọc
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Tìm thấy{" "}
            <span className="font-bold text-orange-600">{products.length}</span>{" "}
            sản phẩm trên trang này
          </div>
        </div>

        {/* 🧃 Danh sách sản phẩm */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(productsPerPage)].map((_, i) => ( // Render số lượng skeleton khớp với productsPerPage
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
        ) : products.length === 0 ? (
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
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

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-lg font-semibold text-gray-700">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
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