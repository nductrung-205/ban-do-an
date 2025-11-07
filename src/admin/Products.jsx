import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package, Plus, Search, Filter, Edit, Trash2, Eye, EyeOff,
    ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle
} from "lucide-react";
import { productAPI } from "../api";

export default function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importErrors, setImportErrors] = useState([]);


    useEffect(() => {
        fetchProducts();
    }, [currentPage, searchTerm, categoryFilter, statusFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Xây dựng params cho request
            const params = new URLSearchParams({
                page: currentPage,
                per_page: 10, // Hoặc một giá trị khác bạn muốn
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }
            if (categoryFilter) {
                params.append('category_id', categoryFilter);
            }
            if (statusFilter !== "") { // Chú ý: "0" là false, "" là không filter
                params.append('status', statusFilter);
            }
            // Thêm các filter khác nếu cần (min_price, max_price, low_stock, sort_by, sort_order)

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/products?${params.toString()}`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    Accept: "application/json",
                },
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();

            console.log("API result:", result);

            setProducts(result.data || []);
            setFilteredProducts(result.data || []); // Cần xem xét lại logic này, có thể không cần filteredProducts riêng nếu API đã filter
            if (result.pagination) {
                setCurrentPage(result.pagination.current_page); // Cập nhật lại currentPage từ phản hồi của API
                setTotalPages(result.pagination.last_page || 1);
            }

        } catch (error) {
            console.error("Fetch error:", error);
            showNotification("Không thể tải danh sách sản phẩm", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredProducts(products);
            return;
        }

        const timer = setTimeout(() => {
            const term = searchTerm.toLowerCase();
            const filtered = products.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term) ||
                p.category?.name?.toLowerCase().includes(term)
            );
            setFilteredProducts(filtered);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, products]);



    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDelete = async (id) => {
        try {
            const response = await productAPI.delete(id);
            if (response.data.success) {
                showNotification("Xóa sản phẩm thành công");
                fetchProducts();
                setShowDeleteModal(false);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi khi xóa sản phẩm";
            showNotification(errorMsg, "error");
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const response = await productAPI.toggleStatus(id);
            if (response.data.success) {
                showNotification(response.data.message);
                fetchProducts();
            }
        } catch (error) {
            console.error(error);
            showNotification("Lỗi khi thay đổi trạng thái", "error");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        try {
            const response = await productAPI.bulkDelete(selectedIds);
            if (response.data.success) {
                showNotification(response.data.message);
                setSelectedIds([]);
                fetchProducts();
            }
        } catch (error) {
            console.error(error);
            showNotification("Lỗi khi xóa nhiều sản phẩm", "error");
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const formatCurrency = (num) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

    if (loading && products.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const handleFileChange = (e) => {
        setImportFile(e.target.files[0]);
        setImportErrors([]); // Clear previous errors
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            showNotification("Vui lòng chọn một file Excel để nhập.", "error");
            return;
        }

        setLoading(true); // Show loading spinner
        setImportErrors([]); // Clear previous errors

        try {
            const response = await productAPI.importProducts(importFile);
            if (response.data.success) {
                showNotification("Nhập sản phẩm từ Excel thành công!", "success");
                setShowImportModal(false);
                setImportFile(null);
                fetchProducts(); // Refresh product list
            }
        } catch (error) {
            console.error("Import error:", error);
            const errorData = error.response?.data;
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                setImportErrors(errorData.errors);
                showNotification("Có lỗi xảy ra khi nhập file. Vui lòng xem chi tiết lỗi.", "error");
            } else {
                showNotification(errorData?.message || "Lỗi không xác định khi nhập sản phẩm từ Excel.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${notification.type === "success" ? "bg-green-500" : "bg-red-500"
                    } text-white animate-slideIn`}>
                    {notification.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Package className="text-orange-500" />
                            Quản lý sản phẩm
                        </h1>
                        <p className="text-gray-500 mt-2">Quản lý danh sách sản phẩm trong hệ thống</p>
                    </div>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
                    >
                        <Plus size={20} />
                        Nhập Excel
                    </button>
                    <button
                        onClick={() => navigate("/admin/products/add")}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
                    >
                        <Plus size={20} />
                        Thêm sản phẩm
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="1">Hiển thị</option>
                        <option value="0">Ẩn</option>
                    </select>

                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setCategoryFilter("");
                            setStatusFilter("");
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                        <X size={18} />
                        Xóa bộ lọc
                    </button>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Xóa {selectedIds.length} sản phẩm
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === products.length && products.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hình ảnh</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tên sản phẩm</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Danh mục</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Giá</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tồn kho</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => {
                                                setSelectedIds(prev =>
                                                    prev.includes(product.id)
                                                        ? prev.filter(id => id !== product.id)
                                                        : [...prev, product.id]
                                                );
                                            }}
                                            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <img
                                            src={product.image_url || "https://via.placeholder.com/60"}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />

                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-gray-800">{product.name}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            {product.category?.name || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-orange-600">{formatCurrency(product.price)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${product.stock <= 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            }`}>
                                            {product.stock} sp
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(product.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition ${product.status
                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            {product.status ? <Eye size={16} /> : <EyeOff size={16} />}
                                            {product.status ? "Hiển thị" : "Ẩn"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteId(product.id);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Trang {currentPage} / {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Xác nhận xóa</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>

            )}
            <div className="mt-8 text-center">
                <button
                    onClick={() => navigate("/admin")}
                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-lg flex items-center justify-center mx-auto gap-2"
                >
                    ← Trở về Dashboard
                </button>
            </div>
            {/* Import Products Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Package className="text-blue-500" size={24} />
                                Nhập sản phẩm từ Excel
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Vui lòng tải lên file Excel (.xlsx, .xls, .csv) chứa danh sách sản phẩm.
                            <br />
                            <a
                                href="/templates/product_import_template.xlsx" // Cần tạo file template này
                                download
                                className="text-blue-500 hover:underline mt-2 inline-block"
                            >
                                Tải file mẫu Excel
                            </a>
                        </p>

                        <form onSubmit={handleImportSubmit}>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="w-full text-gray-700 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 mb-4 focus:ring-blue-500 focus:border-blue-500"
                            />

                            {importErrors.length > 0 && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                                    <p className="font-bold">Lỗi nhập liệu:</p>
                                    <ul className="list-disc list-inside mt-2">
                                        {importErrors.map((error, index) => (
                                            <li key={index}>
                                                Dòng {error.row}: {error.errors.join(', ')} (Giá trị: {JSON.stringify(error.values)})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile || loading}
                                    className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang nhập...' : 'Nhập dữ liệu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}