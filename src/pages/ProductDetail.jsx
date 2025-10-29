import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductDetail, getProductsByCategory } from "../api"; // reviewAPI không cần ở đây nữa
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Swal from "sweetalert2";
import Review from "../components/Review"; // Import component Review

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  // Loại bỏ các state liên quan đến review trực tiếp trong ProductDetail
  // const [reviews, setReviews] = useState([]);
  // const [rating, setRating] = useState(5);
  // const [comment, setComment] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  // 🔹 Lấy chi tiết sản phẩm và các sản phẩm tương tự
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getProductDetail(id);
        const data = res.data?.data || res.data;
        setProduct(data);

        if (data?.category_id) {
          const related = await getProductsByCategory(data.category_id);

          // đảm bảo là mảng
          const relatedProducts =
            related?.data?.data ||
            related?.data ||
            related ||
            [];

          const filtered = relatedProducts.filter((p) => p.id !== data.id);
          setSimilar(filtered.slice(0, 4));
        }

        // Loại bỏ fetch review ở đây, giờ component Review sẽ tự fetch
        // const reviewRes = await reviewAPI.getByProduct(id);
        // setReviews(reviewRes.data || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ ...product, quantity });
  };

  // Loại bỏ các hàm xử lý review khỏi ProductDetail
  // const handleSubmitReview = async () => { /* ... */ };
  // const handleDeleteReview = async (reviewId) => { /* ... */ };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({ ...product, quantity });
    navigate("/cart");
  };

  if (loading || !product) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải sản phẩm...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const totalPrice = (product?.price || 0) * quantity;

  // 🔹 Xử lý ảnh (ưu tiên image_url nếu có)
  const imageUrl = product.image_url
    ? product.image_url
    : product.image
      ? `${import.meta.env.VITE_API_BASE_URL}/storage/${product.image}`
      : "/no-image.png";

  return (
    <>
      <Header />
      <div className="bg-gradient-to-b from-orange-50 to-white min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span
              onClick={() => navigate("/")}
              className="hover:text-orange-600 cursor-pointer"
            >
              Trang chủ
            </span>
            <span>/</span>
            <span
              onClick={() => navigate("/menu")}
              className="hover:text-orange-600 cursor-pointer"
            >
              Thực đơn
            </span>
            <span>/</span>
            <span className="text-orange-600 font-medium">
              {product?.name || "Đang tải..."}
            </span>
          </div>
        </div>

        {/* Product main section */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image */}
              <div className="relative bg-gradient-to-br from-orange-100 to-orange-50 p-8 lg:p-12 flex justify-center">
                <img
                  src={imageUrl}
                  alt={product?.name || "Sản phẩm"}
                  className="w-full max-w-md h-[400px] object-cover rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info */}
              <div className="p-8 lg:p-12 flex flex-col">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {product?.name}
                </h1>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-yellow-400 text-lg">★★★★★</span>
                  <span className="text-gray-500 text-sm">(4.8 / 5.0)</span>
                </div>

                <div className="mb-6 bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="text-4xl font-bold text-orange-600">
                    {product?.price?.toLocaleString() || 0}₫
                  </div>
                  {product?.stock > 0 ? (
                    <p className="text-sm text-green-600 mt-1">
                      Còn {product.stock} sản phẩm
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 mt-1">Hết hàng</p>
                  )}
                </div>

                <div className="mb-6 flex-grow">
                  <h3 className="text-lg font-semibold mb-3">Mô tả món ăn</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product?.description || "Chưa có mô tả cho món ăn này."}
                  </p>
                </div>

                {/* Quantity + Total */}
                <div className="mb-6 bg-gray-50 rounded-xl p-5">
                  <label className="block text-sm font-semibold mb-3">
                    Số lượng
                  </label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-lg px-2">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-orange-100 hover:text-orange-600 font-bold text-xl"
                      >
                        −
                      </button>
                      <span className="text-xl font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-orange-100 hover:text-orange-600 font-bold text-xl"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tạm tính</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {totalPrice.toLocaleString()}₫
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product?.stock <= 0}
                    className={`flex-1 px-6 py-4 border-2 border-orange-500 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-md ${product?.stock > 0
                      ? "bg-white text-orange-600 hover:bg-orange-50"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    🛒 Thêm vào giỏ
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product?.stock <= 0}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg ${product?.stock > 0
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    ⚡ Mua ngay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Similar products */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Món ăn tương tự
            </h2>
            {similar.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {similar.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/products/${item.id}`)}
                    className="cursor-pointer bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-all hover:-translate-y-1"
                  >
                    <img
                      src={
                        item.image_url
                          ? item.image_url
                          : item.image
                            ? `${import.meta.env.VITE_API_BASE_URL}/storage/${item.image
                            }`
                            : "/no-image.png"
                      }
                      alt={item.name}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-3">
                      <h3 className="text-gray-900 font-semibold truncate">
                        {item.name}
                      </h3>
                      <p className="text-orange-600 font-bold mt-1">
                        {item?.price?.toLocaleString() || 0}₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 bg-white rounded-xl">
                Đang cập nhật món tương tự...
              </div>
            )}
          </div>

          {/* Review Section - Sử dụng component Review */}
          <Review productId={id} user={user} />
        </div>
        <Footer />
      </div>
    </>
  );
}