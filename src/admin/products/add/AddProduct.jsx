import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { productAPI, categoryAPI } from "../../../api";

export default function AddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    image: "", // có thể là URL ảnh
    status: true,
  });

  const [imageFile, setImageFile] = useState(null); // file ảnh upload
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryAPI.getAll()
      .then(res => {
        setCategories(res.data.data);
      })
      .catch(err => console.error("❌ Lỗi tải danh mục:", err));
  }, []);


  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      // 🧩 Gửi file ảnh nếu có
      if (imageFile) {
        data.append("image", imageFile);
      } else if (formData.image && formData.image.startsWith("http")) {
        // nếu người dùng nhập URL ảnh ngoài
        data.append("image_url", formData.image);
      }

      // 🧩 Gửi các field khác
      if (formData.name?.trim()) data.append("name", formData.name.trim());
      if (formData.slug?.trim()) data.append("slug", formData.slug.trim());
      if (formData.description?.trim())
        data.append("description", formData.description.trim());
      if (formData.category_id) data.append("category_id", formData.category_id);
      if (formData.price !== "") data.append("price", formData.price);
      if (formData.stock !== "") data.append("stock", formData.stock);
      data.append("status", formData.status ? 1 : 0);

      console.log("📦 Gửi FormData:", [...data.entries()]);

      await productAPI.create(data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire("✅ Thành công!", "Thêm sản phẩm thành công!", "success");
      navigate("/admin/products");
    } catch (err) {
      console.error("❌ Lỗi tạo sản phẩm:", err.response?.data || err);
      Swal.fire(
        "Lỗi",
        err.response?.data?.message || "Không thể thêm sản phẩm",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">
        ➕ Thêm sản phẩm mới
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Danh mục */}
        <div>
          <label className="block mb-1 font-medium">Danh mục</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded-md"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tên sản phẩm */}
        <div>
          <label className="block mb-1 font-medium">Tên sản phẩm</label>
          <input
            type="text"
            name="name"
            placeholder="Nhập tên sản phẩm"
            value={formData.name}
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
            placeholder="vd: pizza-thap-cam"
            value={formData.slug}
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
            value={formData.description}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
            placeholder="Mô tả sản phẩm..."
          ></textarea>
        </div>

        {/* Giá */}
        <div>
          <label className="block mb-1 font-medium">Giá (VNĐ)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
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
            value={formData.stock}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
          />
        </div>

        {/* Ảnh sản phẩm */}
        <div>
          <label className="block mb-1 font-medium">Ảnh sản phẩm</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="flex-1 border p-2 rounded-md"
              placeholder="Nhập URL ảnh hoặc chọn file bên cạnh"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 rounded-md"
            />
          </div>
          {imageFile && (
            <div className="mt-2">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="preview"
                className="w-32 h-32 object-cover rounded-md border"
              />
            </div>
          )}
        </div>

        {/* Trạng thái */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="status"
            checked={formData.status}
            onChange={handleChange}
            className="mr-2"
          />
          <span>Hiển thị sản phẩm</span>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
          >
            {loading ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}
