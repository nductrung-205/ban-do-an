import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { productAPI, categoryAPI } from "../../../../api";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.data?.data || res.data.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await productAPI.getById(id);
      if (res.data.success) {
        setProduct(res.data.data);
        setPreview(
          res.data.data.image?.startsWith("http")
            ? res.data.data.image
            : `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}/storage/${res.data.data.image}`
        );
      }
    } catch (err) {
      Swal.fire("Lỗi", "Không thể tải dữ liệu sản phẩm", "error");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file)); // Xem trước ảnh upload
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("_method", "PUT");

      if (product.image instanceof File) {
        formData.append("image", product.image);
      }
      else if (typeof product.image === "string" && product.image.startsWith("http")) {
        // chỉ gửi image_url khi là link ngoài
        formData.append("image_url", product.image);
      }


      // 🧩 Các field khác — chỉ gửi khi có giá trị thật
      if (product.name?.trim()) formData.append("name", product.name.trim());

      // ❌ Không gửi slug nếu trống (để BE tự tạo theo name)
      if (product.slug && product.slug.trim() !== "") {
        formData.append("slug", product.slug.trim());
      }

      if (product.description?.trim()) formData.append("description", product.description.trim());
      if (product.price !== undefined && product.price !== "" && product.price !== null)
        formData.append("price", product.price);
      if (product.stock !== undefined && product.stock !== "" && product.stock !== null)
        formData.append("stock", product.stock);
      if (product.category_id) formData.append("category_id", product.category_id);


      // Trạng thái luôn gửi rõ ràng
      formData.append("status", product.status ? 1 : 0);

      // 👀 Debug xem gửi gì
      console.log("➡️ Gửi dữ liệu update:", [...formData.entries()]);

      await productAPI.update(id, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire("✅ Thành công!", "Cập nhật sản phẩm thành công!", "success");
      navigate("/admin/products");
    } catch (err) {
      console.error("❌ Update error:", err.response?.data || err);
      Swal.fire("Lỗi", err.response?.data?.message || "Không thể cập nhật sản phẩm", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <div className="text-center py-10 text-gray-500">Đang tải sản phẩm...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">✏️ Chỉnh sửa sản phẩm</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Danh mục */}
        <div>
          <label className="block mb-1 font-medium">Danh mục</label>
          <select
            name="category_id"
            value={product.category_id || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Tên sản phẩm */}
        <div>
          <label className="block mb-1 font-medium">Tên sản phẩm</label>
          <input
            type="text"
            name="name"
            value={product.name || ""}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded-md"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block mb-1 font-medium">Slug</label>
          <input
            type="text"
            name="slug"
            value={product.slug || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
          />
        </div>

        {/* Mô tả */}
        <div>
          <label className="block mb-1 font-medium">Mô tả</label>
          <textarea
            name="description"
            rows="3"
            value={product.description || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
          ></textarea>
        </div>

        {/* Giá */}
        <div>
          <label className="block mb-1 font-medium">Giá (VNĐ)</label>
          <input
            type="number"
            name="price"
            value={product.price || ""}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded-md"
          />
        </div>

        {/* Tồn kho */}
        <div>
          <label className="block mb-1 font-medium">Tồn kho</label>
          <input
            type="number"
            name="stock"
            value={product.stock || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
          />
        </div>

        {/* Ảnh */}
        <div>
          <label className="block mb-1 font-medium">Ảnh sản phẩm</label>

          {/* Nhập URL */}
          <input
            type="text"
            name="image"
            value={typeof product.image === "string" ? product.image : ""}
            onChange={handleChange}
            placeholder="Nhập URL ảnh hoặc chọn file"
            className="w-full border p-2 rounded-md mb-2"
          />

          {/* Upload file */}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border p-2 rounded-md"
          />

          {/* Xem trước */}
          {preview && (
            <img
              src={preview}
              alt="Xem trước"
              className="w-32 h-32 object-cover mt-2 rounded-lg border"
            />
          )}
        </div>

        {/* Trạng thái */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="status"
            checked={!!product.status}
            onChange={handleChange}
            className="mr-2"
          />
          <span>Hiển thị sản phẩm</span>
        </div>

        {/* Nút lưu */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Đang lưu..." : "Cập nhật sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}
