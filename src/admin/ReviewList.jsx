import React, { useEffect, useState } from "react";
import { reviewAPI, productAPI } from "../api";
import { Trash2, Star, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

export default function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [products, setProducts] = useState([]);

  // ✅ Lấy tất cả review (hoặc theo sản phẩm)
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = filterProduct
        ? await reviewAPI.getByProduct(filterProduct)
        : await reviewAPI.getAll();
      setReviews(res.data.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy danh sách sản phẩm để lọc
  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, [filterProduct]);

  const handleToggle = async (id) => {
    try {
      const res = await reviewAPI.toggle(id);
      Swal.fire("Thành công", res.data.message, "success");
      fetchReviews();
    } catch (err) {
      console.log(err)
      Swal.fire("Lỗi", "Không thể cập nhật trạng thái đánh giá", "error");
    }
  };


  // ✅ Xóa review
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc muốn xóa đánh giá này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (confirm.isConfirmed) {
      try {
        await reviewAPI.delete(id);
        Swal.fire("Đã xóa!", "Đánh giá đã được xóa.", "success");
        fetchReviews();
      } catch (err) {
        console.error(err);
        Swal.fire("Lỗi!", "Không thể xóa đánh giá này.", "error");
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-2xl font-bold text-gray-800">
            Quản lý đánh giá sản phẩm
          </h2>

          <div className="flex gap-2">
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchReviews}
              className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-10 text-gray-500">Đang tải...</div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Danh sách review */}
        {!loading && reviews.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Không có đánh giá nào.
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Người dùng</th>
                  <th className="p-3">Đánh giá</th>
                  <th className="p-3">Bình luận</th>
                  <th className="p-3">Ngày tạo</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r, index) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-none hover:bg-gray-50"
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      {r.product?.name || "—"}
                    </td>
                    <td className="p-3">{r.user?.fullname || "Ẩn danh"}</td>
                    <td className="p-3 flex items-center gap-1 text-yellow-500">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-500" />
                      ))}
                    </td>
                    <td className="p-3 max-w-[300px] truncate">
                      {r.comment || "—"}
                    </td>
                    <td className="p-3">
                      {new Date(r.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3 text-center flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleToggle(r.id)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${!r.is_visible
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                      >
                        {!r.is_visible ? "Hiển thị" : "Ẩn"}
                      </button>


                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
