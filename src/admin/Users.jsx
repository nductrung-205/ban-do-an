import React, { useEffect, useState, useCallback } from "react";
import { Search, UserPlus, Shield, User, Trash2, Edit, ChevronUp, ChevronDown, Loader2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../api"; 

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [message, setMessage] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' hoặc 'desc'
  const [selectedUsers, setSelectedUsers] = useState([]); // Dùng cho bulk delete
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (filterRole !== "all") {
        params.role = filterRole;
      }

      const response = await userAPI.getAll(params);
      const { data, pagination: newPagination } = response.data;
      setUsers(Array.isArray(data) ? data : []);
      setPagination(newPagination || {});
      setSelectedUsers([]); // Reset lựa chọn khi tải lại
    } catch (err) {
      console.error("Error fetching users:", err);
      setMessage({ type: "error", text: "❌ Lỗi khi tải danh sách người dùng!" });
      setUsers([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, sortBy, sortOrder, searchTerm, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Thao tác này không thể hoàn tác!")) {
      try {
        await userAPI.delete(id);
        fetchUsers();
        showMessage("success", "✅ Xóa người dùng thành công!");
      } catch (err) {
        console.error("Error deleting user:", err);
        const errorMessage = err.response?.data?.message || "❌ Lỗi khi xóa người dùng!";
        showMessage("error", errorMessage);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      showMessage("info", "Vui lòng chọn ít nhất một người dùng để xóa.");
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedUsers.length} người dùng đã chọn?`)) {
      try {
        await userAPI.bulkDelete(selectedUsers);
        fetchUsers();
        showMessage("success", `✅ Đã xóa ${selectedUsers.length} người dùng thành công!`);
        setSelectedUsers([]);
      } catch (err) {
        console.error("Error bulk deleting users:", err);
        const errorMessage = err.response?.data?.message || "❌ Lỗi khi xóa nhiều người dùng!";
        showMessage("error", errorMessage);
      }
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await userAPI.update(id, { role: parseInt(newRole) });
      fetchUsers();
      showMessage("success", "✅ Cập nhật quyền thành công!");
    } catch (err) {
      console.error("Error updating role:", err);
      const errorMessage = err.response?.data?.message || "❌ Lỗi khi cập nhật quyền!";
      showMessage("error", errorMessage);
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

  const handleSelectUser = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const getRoleConfig = (role) => {
    if (role === 0) {
      return {
        label: "Admin",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Shield size={14} />,
      };
    }
    return {
      label: "User",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <User size={14} />,
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatistics = () => {
    return {
      total: pagination.total || 0,
      admins: users.filter((u) => u.role === 0).length, // Lưu ý: Chỉ là admin trên trang hiện tại
      customers: users.filter((u) => u.role === 1).length, // Tương tự
    };
  };

  const stats = getStatistics();

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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý người dùng</h1>
            <p className="text-gray-600">Tổng quan và quản lý tài khoản người dùng, bao gồm phân quyền và thông tin cá nhân.</p>
          </div>
          <button
            onClick={() => navigate("/admin/users/add")}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 text-base font-medium"
          >
            <UserPlus size={18} />
            Thêm người dùng mới
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <p className="text-sm opacity-90 mb-1 font-light">Tổng số người dùng</p>
            <p className="text-4xl font-extrabold">{pagination.total || 0}</p>
            <Info size={20} className="absolute top-4 right-4 opacity-70" />
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <p className="text-sm opacity-90 mb-1 font-light">Quản trị viên (trang hiện tại)</p>
            <p className="text-4xl font-extrabold">{stats.admins}</p>
            <Shield size={20} className="absolute top-4 right-4 opacity-70" />
          </div>
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <p className="text-sm opacity-90 mb-1 font-light">Khách hàng (trang hiện tại)</p>
            <p className="text-4xl font-extrabold">{stats.customers}</p>
            <User size={20} className="absolute top-4 right-4 opacity-70" />
          </div>
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setCurrentPage(1); // Reset về trang đầu khi tìm kiếm mới
                      fetchUsers();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1); // Reset về trang đầu khi lọc
                  fetchUsers();
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none pr-8 transition"
              >
                <option value="all">Tất cả quyền</option>
                <option value="0">Admin</option>
                <option value="1">User</option>
              </select>

              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value));
                  setCurrentPage(1); // Reset về trang đầu khi thay đổi số lượng perPage
                  fetchUsers();
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none pr-8 transition"
              >
                <option value="10">10 / trang</option>
                <option value="20">20 / trang</option>
                <option value="50">50 / trang</option>
              </select>

              {selectedUsers.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition flex items-center gap-2 text-base font-medium"
                >
                  <Trash2 size={18} /> Xóa ({selectedUsers.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-orange-500" />
              <p className="text-lg">Đang tải danh sách người dùng...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-7xl mb-4">🤷‍♂️</div>
              <p className="text-xl font-semibold">Không tìm thấy người dùng nào</p>
              <p className="text-md mt-2">Hãy thử thay đổi bộ lọc hoặc thêm người dùng mới.</p>
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
                        onChange={handleSelectAllUsers}
                        checked={selectedUsers.length === users.length && users.length > 0}
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition flex items-center gap-1"
                      onClick={() => handleSort("id")}
                    >
                      ID {renderSortIcon("id")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort("fullname")}
                    >
                      Họ tên {renderSortIcon("fullname")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort("email")}
                    >
                      Email {renderSortIcon("email")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Điện thoại</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quyền</th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort("created_at")}
                    >
                      Ngày tạo {renderSortIcon("created_at")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map((user) => {
                    const roleConfig = getRoleConfig(user.role);
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <tr key={user.id} className={`${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-orange-600 shadow-sm focus:ring-orange-500"
                            checked={isSelected}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">#{user.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {user.fullname ? user.fullname.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="font-semibold text-gray-800">{user.fullname}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.phone || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${roleConfig.color} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer`}
                          >
                            <option value={0}>Admin</option>
                            <option value={1}>User</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Xóa"
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
                Hiển thị {pagination.from} đến {pagination.to} trong tổng số {pagination.total} người dùng
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
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === page
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