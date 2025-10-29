import React, { useEffect, useState, useCallback } from "react";
import {
  Eye, Search, Filter, Download, Clock, CheckCircle, XCircle, Truck, Trash2, Edit, Plus,
  ChevronUp, ChevronDown, Loader2, DollarSign, Package, TrendingUp, Info
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { orderAPI } from "../api"; // Đảm bảo đường dẫn đúng

// Component StatCard cho các thẻ thống kê
function StatCard({ label, value, icon: Icon, colorClass, valueClass = "text-3xl" }) {
  return (
    <div className={`relative p-5 rounded-xl shadow-lg text-white ${colorClass} transform hover:scale-105 transition-transform duration-300`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm opacity-90 mb-1 font-light">{label}</p>
          <p className={`font-extrabold ${valueClass}`}>{value}</p>
        </div>
        {Icon && <Icon size={32} className="opacity-70" />}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [message, setMessage] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedOrders, setSelectedOrders] = useState([]); // Dùng cho bulk delete
  const [orderStats, setOrderStats] = useState({}); // Thống kê tổng quan
  const [filterDateRange, setFilterDateRange] = useState({ from: '', to: '' });
  const [filterPriceRange, setFilterPriceRange] = useState({ min: '', max: '' });

  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterPaymentMethod !== "all") params.payment_method = filterPaymentMethod;
      if (filterDateRange.from) params.from_date = filterDateRange.from;
      if (filterDateRange.to) params.to_date = filterDateRange.to;
      if (filterPriceRange.min) params.min_price = filterPriceRange.min;
      if (filterPriceRange.max) params.max_price = filterPriceRange.max;

      const response = await orderAPI.getAll(params);
      const { data, pagination: newPagination } = response.data;
      setOrders(Array.isArray(data) ? data : []);
      setPagination(newPagination || {});
      setSelectedOrders([]); // Reset lựa chọn khi tải lại
    } catch (err) {
      console.error("Error fetching orders:", err);
      setMessage({ type: "error", text: "❌ Lỗi khi tải danh sách đơn hàng!" });
      setOrders([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, sortBy, sortOrder, searchTerm, filterStatus, filterPaymentMethod, filterDateRange, filterPriceRange]);

  const fetchOrderStatistics = async () => {
    try {
      const response = await orderAPI.getStatistics('month');
      setOrderStats(response.data.data);
    } catch (err) {
      console.error("Error fetching order statistics:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderStatistics();
  }, [fetchOrders]); // fetchOrderStatistics không cần trong dependencies của fetchOrders

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset về trang 1 khi áp dụng bộ lọc mới
    fetchOrders(); // Kích hoạt lại fetchOrders với các state filter mới
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await orderAPI.updateStatus(id, newStatus);
      fetchOrders();
      showMessage("success", `✅ Cập nhật trạng thái đơn hàng #${id} thành công!`);
    } catch (err) {
      console.error("Error updating status:", err);
      const errorMessage = err.response?.data?.message || "❌ Cập nhật trạng thái thất bại!";
      showMessage("error", errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này? Chỉ có thể xóa đơn đã hủy hoặc đã giao.")) {
      try {
        await orderAPI.delete(id);
        fetchOrders();
        showMessage("success", `✅ Đã xóa đơn hàng #${id}`);
      } catch (err) {
        console.error("Error deleting order:", err);
        const errorMessage = err.response?.data?.message || "❌ Lỗi khi xóa đơn hàng!";
        showMessage("error", errorMessage);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      showMessage("info", "Vui lòng chọn ít nhất một đơn hàng để xóa.");
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedOrders.length} đơn hàng đã chọn?`)) {
      try {
        await orderAPI.bulkDelete(selectedOrders);
        fetchOrders();
        showMessage("success", `✅ Đã xóa ${selectedOrders.length} đơn hàng thành công!`);
        setSelectedOrders([]);
      } catch (err) {
        console.error("Error bulk deleting orders:", err);
        const errorMessage = err.response?.data?.message || "❌ Lỗi khi xóa nhiều đơn hàng!";
        showMessage("error", errorMessage);
      }
    }
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= pagination.last_page) {
      setCurrentPage(page);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prevSelected) =>
      prevSelected.includes(orderId)
        ? prevSelected.filter((id) => id !== orderId)
        : [...prevSelected, orderId]
    );
  };

  const handleSelectAllOrders = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Chờ xử lý",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock size={14} />,
      },
      confirmed: {
        label: "Đã xác nhận",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle size={14} />,
      },
      shipping: {
        label: "Đang giao",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: <Truck size={14} />,
      },
      delivered: {
        label: "Đã giao",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle size={14} />,
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle size={14} />,
      },
    };
    return configs[status] || configs.pending;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSortIcon = (column) => {
    if (sortBy === column) {
      return sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    }
    return null;
  };

  const messageClasses = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý đơn hàng</h1>
            <p className="text-gray-600">Tổng quan và xử lý các đơn hàng của khách hàng</p>
          </div>

        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-6">
          <StatCard
            label="Tổng đơn (tháng này)"
            value={orderStats.total_orders || 0}
            icon={Package}
            colorClass="bg-gradient-to-br from-indigo-500 to-purple-600"
          />
          <StatCard
            label="Doanh thu (tháng này)"
            value={formatCurrency(orderStats.total_revenue || 0)}
            icon={DollarSign}
            colorClass="bg-gradient-to-br from-green-500 to-emerald-600"
            valueClass="text-2xl"
          />
          <StatCard
            label="Đang chờ xử lý"
            value={orderStats.pending || 0}
            icon={Clock}
            colorClass="bg-gradient-to-br from-yellow-500 to-orange-600"
          />
          <StatCard
            label="Đã xác nhận"
            value={orderStats.confirmed || 0}
            icon={CheckCircle}
            colorClass="bg-gradient-to-br from-teal-500 to-cyan-600"
          />
          <StatCard
            label="Đang giao"
            value={orderStats.shipping || 0}
            icon={Truck}
            colorClass="bg-gradient-to-br from-blue-500 to-cyan-600"
          />
          <StatCard
            label="Đã giao"
            value={orderStats.delivered || 0}
            icon={CheckCircle}
            colorClass="bg-gradient-to-br from-emerald-500 to-green-600"
          />
          <StatCard
            label="Đã hủy"
            value={orderStats.cancelled || 0}
            icon={XCircle}
            colorClass="bg-gradient-to-br from-red-500 to-pink-600"
          />
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${messageClasses[message.type]}`}>
            {message.type === "success" && <span className="text-xl">🎉</span>}
            {message.type === "error" && <span className="text-xl">🔥</span>}
            {message.type === "info" && <span className="text-xl">💡</span>}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách, email, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleApplyFilters();
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none pr-8 transition"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none pr-8 transition"
            >
              <option value="all">Tất cả PTTT</option>
              <option value="COD">COD</option>
              <option value="Banking">Chuyển khoản</option>
            </select>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="number"
                placeholder="Giá từ"
                value={filterPriceRange.min}
                onChange={(e) => setFilterPriceRange({ ...filterPriceRange, min: e.target.value })}
                className="w-full md:w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Giá đến"
                value={filterPriceRange.max}
                onChange={(e) => setFilterPriceRange({ ...filterPriceRange, max: e.target.value })}
                className="w-full md:w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterDateRange.from}
                onChange={(e) => setFilterDateRange({ ...filterDateRange, from: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                title="Từ ngày"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={filterDateRange.to}
                onChange={(e) => setFilterDateRange({ ...filterDateRange, to: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                title="Đến ngày"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value));
                  setCurrentPage(1); // Reset về trang đầu khi thay đổi số lượng perPage
                  fetchOrders();
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none pr-8 transition"
              >
                <option value="10">10 / trang</option>
                <option value="20">20 / trang</option>
                <option value="50">50 / trang</option>
              </select>

              <button
                onClick={handleApplyFilters}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition flex items-center gap-2 text-base font-medium"
              >
                <Filter size={18} /> Áp dụng
              </button>

              {selectedOrders.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition flex items-center gap-2 text-base font-medium"
                >
                  <Trash2 size={18} /> Xóa ({selectedOrders.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-orange-500" />
              <p className="text-lg">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-7xl mb-4">📦</div>
              <p className="text-xl font-semibold">Không tìm thấy đơn hàng nào</p>
              <p className="text-md mt-2">Hãy thử thay đổi bộ lọc hoặc tạo đơn hàng mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 shadow-sm focus:ring-orange-500"
                        onChange={handleSelectAllOrders}
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition flex items-center gap-1"
                      onClick={() => handleSort("id")}
                    >
                      Mã đơn {renderSortIcon("id")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort("total_price")}
                    >
                      Tổng tiền {renderSortIcon("total_price")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort("payment_method")}
                    >
                      Thanh toán {renderSortIcon("payment_method")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Khách hàng</th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort("status")}
                    >
                      Trạng thái {renderSortIcon("status")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort("created_at")}
                    >
                      Ngày đặt {renderSortIcon("created_at")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const isSelected = selectedOrders.includes(order.id);
                    return (
                      <tr key={order.id} className={`${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-orange-600 shadow-sm focus:ring-orange-500"
                            checked={isSelected}
                            onChange={() => handleSelectOrder(order.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">#{order.order_code}</td>
                        <td className="px-6 py-4 font-bold text-orange-600">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.payment_method === "COD" ? "Thanh toán khi nhận hàng" : "Chuyển khoản"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{order.customer_name}</div>
                          <div className="text-sm text-gray-600">{order.customer_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusConfig.color} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer`}
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="shipping">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/orders/${order.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} />
                            </Link>
                            <button
                              onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                              title="Sửa đơn hàng"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Xóa đơn hàng"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Hiển thị {pagination.from} đến {pagination.to} trong tổng số {pagination.total} đơn hàng
              </p>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page
                      ? "z-10 bg-orange-50 border-orange-500 text-orange-600"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.last_page}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/admin")}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-lg flex items-center justify-center mx-auto gap-2"
          >
            ← Trở về Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}