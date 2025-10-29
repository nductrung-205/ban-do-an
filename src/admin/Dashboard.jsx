import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Package, Users, TrendingUp, DollarSign, Eye,
  LogOut, BarChart3, Bell, Menu, X, AlertTriangle, Star,
  Calendar, Activity, ArrowUp, ArrowDown, ChevronRight,
  MessageSquare,
  Tag,
  Folder
} from "lucide-react";
import { userAPI, productAPI, orderAPI } from "../api";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || userData.role !== 0) return navigate("/admin/login");
    setUser(userData);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [ordersRes, productsRes, usersRes] = await Promise.all([
        orderAPI.getAll({ per_page: 100 }),
        productAPI.getAll({ per_page: 100 }),
        userAPI.getAll({ per_page: 100 }),
      ]);

      const orders = ordersRes.data?.data || [];
      const products = productsRes.data?.data || [];
      const users = usersRes.data?.data || [];

      const totalRevenue = orders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

      const today = new Date().toISOString().slice(0, 10);
      const todayRevenue = orders
        .filter(o => o.status === "delivered" && o.created_at?.startsWith(today))
        .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthRevenue = orders
        .filter(o => o.status === "delivered" && o.created_at?.startsWith(thisMonth))
        .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);
      const lastMonthRevenue = orders
        .filter(o => o.status === "delivered" && o.created_at?.startsWith(lastMonthStr))
        .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : 0;

      const pending = orders.filter(o => o.status === "pending").length;
      const confirmed = orders.filter(o => o.status === "confirmed").length;
      const shipping = orders.filter(o => o.status === "shipping").length;
      const delivered = orders.filter(o => o.status === "delivered").length;
      const cancelled = orders.filter(o => o.status === "cancelled").length;

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const revenue = orders
          .filter(o => o.status === "delivered" && o.created_at?.startsWith(dateStr))
          .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        return { date: label, revenue };
      }).reverse();

      const productSales = {};
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = {
                name: item.product_name,
                sold: 0,
                revenue: 0
              };
            }
            productSales[item.product_id].sold += item.quantity;
            productSales[item.product_id].revenue += item.quantity * item.price;
          });
        }
      });

      const topProductsList = Object.values(productSales)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      const lowStockList = products
        .filter(p => p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      const recentOrdersList = orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      const orderStatusData = [
        { name: 'Chờ xác nhận', value: pending, color: '#f59e0b' },
        { name: 'Đã xác nhận', value: confirmed, color: '#3b82f6' },
        { name: 'Đang giao', value: shipping, color: '#8b5cf6' },
        { name: 'Hoàn thành', value: delivered, color: '#10b981' },
        { name: 'Đã hủy', value: cancelled, color: '#ef4444' },
      ];

      setStats({
        totalRevenue,
        todayRevenue,
        monthRevenue,
        revenueGrowth,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalUsers: users.length,
        pending,
        confirmed,
        shipping,
        delivered,
        cancelled,
      });
      setRevenueData(last7Days);
      setCategoryData(orderStatusData);
      setLowStock(lowStockList);
      setTopProducts(topProductsList);
      setRecentOrders(recentOrdersList);
    } catch (err) {
      console.error("❌ Lỗi khi tải Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-72" : "w-20"} bg-white shadow-xl transition-all duration-300 border-r border-gray-200`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🍜</span>
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-800">FoodAdmin</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          <NavItem icon={<BarChart3 />} label="Dashboard" active collapsed={!sidebarOpen} />
          <NavItem icon={<Package />} label="Sản phẩm" onClick={() => navigate("/admin/products")} collapsed={!sidebarOpen} />
          <NavItem icon={<ShoppingCart />} label="Đơn hàng" onClick={() => navigate("/admin/orders")} collapsed={!sidebarOpen} />
          <NavItem icon={<Users />} label="Người dùng" onClick={() => navigate("/admin/users")} collapsed={!sidebarOpen} />
          <NavItem icon={<DollarSign  />} label="Doanh thu" onClick={() => navigate("/admin/revenue")} collapsed={!sidebarOpen} />
          <NavItem icon={<MessageSquare  />} label="Đánh giá" onClick={() => navigate("/admin/reviews")} collapsed={!sidebarOpen} />
          <NavItem icon={<Tag  />} label="Giảm giá" onClick={() => navigate("/admin/coupons")} collapsed={!sidebarOpen} />
          <NavItem icon={<Folder  />} label="Danh mục" onClick={() => navigate("/admin/categories")} collapsed={!sidebarOpen} />
        </nav>
        
        <div className="absolute bottom-4 w-full px-4">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/admin/login");
            }}
            className={`w-50 flex items-center ${sidebarOpen ? 'justify-start space-x-3' : 'justify-center'} bg-red-50 hover:bg-red-100 text-red-600 py-3 px-4 rounded-lg transition font-medium`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
              <Calendar size={16} />
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-3 hover:bg-gray-100 rounded-full transition">
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                {user?.fullname?.[0] || "A"}
              </div>
              <span className="font-medium">{user?.fullname || "Admin"}</span>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Doanh thu hôm nay" 
              value={formatCurrency(stats.todayRevenue)} 
              icon={<DollarSign />}
              gradient="from-emerald-500 to-teal-600"
              trend={stats.revenueGrowth}
            />
            <StatsCard 
              title="Doanh thu tháng" 
              value={formatCurrency(stats.monthRevenue)} 
              icon={<TrendingUp />}
              gradient="from-blue-500 to-indigo-600"
              trend={stats.revenueGrowth}
            />
            <StatsCard 
              title="Tổng đơn hàng" 
              value={stats.totalOrders} 
              icon={<ShoppingCart />}
              gradient="from-orange-500 to-red-600"
              subtitle={`${stats.pending} chờ xử lý`}
            />
            <StatsCard 
              title="Tổng sản phẩm" 
              value={stats.totalProducts} 
              icon={<Package />}
              gradient="from-purple-500 to-pink-600"
              subtitle={`${lowStock.length} sắp hết`}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-bold text-xl text-gray-800">Doanh thu 7 ngày</h2>
                  <p className="text-sm text-gray-500">Thống kê theo ngày</p>
                </div>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                  <ArrowUp size={16} />
                  <span className="font-semibold">{stats.revenueGrowth}%</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Order Status Pie Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="font-bold text-xl text-gray-800 mb-6">Trạng thái đơn hàng</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products & Low Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <Star className="text-yellow-500" size={24} />
                    Sản phẩm bán chạy
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Top 5 sản phẩm</p>
                </div>
                <button 
                  onClick={() => navigate("/admin/products")}
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight size={16} />
                </button>
              </div>
              {topProducts.length ? (
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-sm text-gray-500">Đã bán: {p.sold} sản phẩm</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{formatCurrency(p.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Package size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Chưa có dữ liệu bán hàng</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={24} />
                    Sản phẩm sắp hết hàng
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Cần nhập thêm</p>
                </div>
                <button 
                  onClick={() => navigate("/admin/products")}
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight size={16} />
                </button>
              </div>
              {lowStock.length ? (
                <div className="space-y-4">
                  {lowStock.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-l-4 border-red-500 hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                          <Package className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(p.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-bold text-sm">
                          {p.stock} sp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Activity size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Tất cả sản phẩm đều còn đủ hàng</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="text-blue-500" size={24} />
                  Đơn hàng gần đây
                </h2>
                <p className="text-sm text-gray-500 mt-1">5 đơn mới nhất</p>
              </div>
              <button 
                onClick={() => navigate("/admin/orders")}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
              >
                Xem tất cả <ChevronRight size={16} />
              </button>
            </div>
            {recentOrders.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Mã đơn</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Khách hàng</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tổng tiền</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Thời gian</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm font-semibold text-gray-800">
                            {order.order_code}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-800">{order.customer_name}</p>
                            <p className="text-xs text-gray-500">{order.customer_phone}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-orange-600">
                            {formatCurrency(order.total_price)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button 
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="p-2 hover:bg-orange-50 rounded-lg transition text-orange-600"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                <p>Chưa có đơn hàng nào</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <QuickStatCard label="Chờ xác nhận" value={stats.pending} color="yellow" icon={<Activity />} />
            <QuickStatCard label="Đã xác nhận" value={stats.confirmed} color="blue" icon={<Activity />} />
            <QuickStatCard label="Đang giao hàng" value={stats.shipping} color="purple" icon={<Activity />} />
            <QuickStatCard label="Hoàn thành" value={stats.delivered} color="green" icon={<Activity />} />
            <QuickStatCard label="Đã hủy" value={stats.cancelled} color="red" icon={<Activity />} />
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, collapsed, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start space-x-3'} px-4 py-3.5 rounded-xl transition cursor-pointer font-medium
        ${active 
          ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg" 
          : "text-gray-600 hover:bg-gray-100"
        }`}
    >
      <span>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
  );
}

function StatsCard({ title, value, icon, gradient, trend, subtitle }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl text-white p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${parseFloat(trend) >= 0 ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
            {parseFloat(trend) >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm opacity-90 mb-2">{title}</p>
      <h2 className="text-3xl font-bold mb-1">{value}</h2>
      {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
    </div>
  );
}

function QuickStatCard({ label, value, color, icon }) {
  const colorClasses = {
    yellow: 'from-yellow-400 to-orange-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-500 to-pink-600',
    green: 'from-emerald-400 to-teal-500',
    red: 'from-orange-400 to-red-600'
  };

  const gradient = colorClasses[color] || 'from-gray-200 to-gray-300';

  return (
    <div className={`p-4 rounded-2xl shadow-sm bg-gradient-to-br ${gradient} text-white flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <h3 className="text-lg font-bold">{value ?? 0}</h3>
        </div>
      </div>
      <div className="text-xs opacity-80">
        {/* Small chevron to indicate it's a stat (optional) */}
        <ChevronRight size={18} />
      </div>
    </div>
  );
}
