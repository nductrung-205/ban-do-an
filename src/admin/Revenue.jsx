import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Download,
    ArrowUp, ArrowDown, Filter, RefreshCw, Package, ShoppingCart,
    Users, CreditCard, BarChart3,
    ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import api, { orderAPI, productAPI } from "../api";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from "recharts";
import Swal from "sweetalert2";

export default function Revenue() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("month"); 

    const [stats, setStats] = useState({
        totalRevenue: 0,
        avgOrderValue: 0,
        totalOrders: 0,
        growthRate: 0,
    });

    const [revenueByDay, setRevenueByDay] = useState([]);
    const [revenueByMonth, setRevenueByMonth] = useState([]);
    const [revenueByProduct, setRevenueByProduct] = useState([]);
    const [revenueByStatus, setRevenueByStatus] = useState([]);
    const [topRevenueOrders, setTopRevenueOrders] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (!token || userData.role !== 0) return navigate("/admin/login");
        fetchData();
    }, [timeRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes] = await Promise.all([
                orderAPI.getAll({ per_page: 1000 }),
                productAPI.getAll({ per_page: 1000 }),
            ]);

            const allOrders = ordersRes.data?.data || [];


            processRevenueData(allOrders);
        } catch (err) {
            console.error("❌ Lỗi khi tải dữ liệu doanh thu:", err);
        } finally {
            setLoading(false);
        }
    };

    const processRevenueData = (allOrders) => {
        const now = new Date();
        let filteredOrders = allOrders.filter(o => o.status === "delivered");

        // Filter by time range
        if (timeRange === "week") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= weekAgo);
        } else if (timeRange === "month") {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= monthAgo);
        } else if (timeRange === "year") {
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= yearAgo);
        }

        // Calculate total revenue
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate growth rate (compare with previous period)
        const periodDays = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
        const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
        const previousPeriodStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

        const currentRevenue = allOrders
            .filter(o => o.status === "delivered" && new Date(o.created_at) >= currentPeriodStart)
            .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

        const previousRevenue = allOrders
            .filter(o => o.status === "delivered" &&
                new Date(o.created_at) >= previousPeriodStart &&
                new Date(o.created_at) < currentPeriodStart)
            .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

        const growthRate = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
            : 0;

        setStats({ totalRevenue, avgOrderValue, totalOrders, growthRate });

        // Revenue by day (last 30 days)
        // Revenue by day (7 hoặc 30 ngày tùy theo timeRange)
        const dayCount = timeRange === "week" ? 7 : 30;
        const dailyRevenue = {};
        for (let i = 0; i < dayCount; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().slice(0, 10);
            dailyRevenue[dateStr] = 0;
        }


        filteredOrders.forEach(order => {
            const dateStr = order.created_at?.slice(0, 10);
            if (Object.hasOwn(dailyRevenue, dateStr)) {
                dailyRevenue[dateStr] += parseFloat(order.total_price || 0);
            }

        });

        const dailyData = Object.entries(dailyRevenue)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, revenue]) => ({
                date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                revenue,
                fullDate: date
            }));

        setRevenueByDay(dailyData);

        // Revenue by month (last 12 months)
        const monthlyRevenue = {};
        for (let i = 0; i < 12; i++) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            const monthStr = date.toISOString().slice(0, 7);
            monthlyRevenue[monthStr] = 0;
        }

        allOrders.filter(o => o.status === "delivered").forEach(order => {
            const monthStr = order.created_at?.slice(0, 7);
            if (Object.hasOwn(monthlyRevenue, monthStr)) {
                monthlyRevenue[monthStr] += parseFloat(order.total_price || 0);
            }
        });


        const monthlyData = Object.entries(monthlyRevenue)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, revenue]) => ({
                month: new Date(month + '-01').toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
                revenue,
                fullMonth: month
            }));

        setRevenueByMonth(monthlyData);

        // Revenue by product
        const productRevenue = {};
        filteredOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    if (!productRevenue[item.product_id]) {
                        productRevenue[item.product_id] = {
                            name: item.product_name,
                            revenue: 0,
                            quantity: 0
                        };
                    }
                    productRevenue[item.product_id].revenue += item.quantity * item.price;
                    productRevenue[item.product_id].quantity += item.quantity;
                });
            }
        });

        const productData = Object.values(productRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((p, i) => ({
                ...p,
                fill: ['#f97316', '#dc2626', '#fb923c', '#fdba74', '#fed7aa'][i]
            }));

        setRevenueByProduct(productData);

        // Revenue by status
        const statusRevenue = [
            { status: 'Hoàn thành', revenue: 0, color: '#10b981' },
            { status: 'Đang giao', revenue: 0, color: '#8b5cf6' },
            { status: 'Đã xác nhận', revenue: 0, color: '#3b82f6' },
            { status: 'Chờ xác nhận', revenue: 0, color: '#f59e0b' },
        ];

        allOrders.forEach(order => {
            const price = parseFloat(order.total_price || 0);
            if (order.status === 'delivered') statusRevenue[0].revenue += price;
            else if (order.status === 'shipping') statusRevenue[1].revenue += price;
            else if (order.status === 'confirmed') statusRevenue[2].revenue += price;
            else if (order.status === 'pending') statusRevenue[3].revenue += price;
        });

        setRevenueByStatus(statusRevenue.filter(s => s.revenue > 0));

        // Top revenue orders
        const topOrders = filteredOrders
            .sort((a, b) => parseFloat(b.total_price) - parseFloat(a.total_price))
            .slice(0, 10);

        setTopRevenueOrders(topOrders);
    };

    const formatCurrency = (num) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
                <div className="text-center">
                    <div className="animate-spin h-16 w-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu doanh thu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/admin")}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <DollarSign className="text-green-600" size={28} />
                                    Quản Lý Doanh Thu
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">Phân tích chi tiết doanh thu và xu hướng</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchData}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium"
                            >
                                <RefreshCw size={18} />
                                Làm mới
                            </button>

                            <button
                                onClick={async () => {
                                    const { value: fileType } = await Swal.fire({
                                        title: "Chọn định dạng xuất",
                                        input: "select",
                                        inputOptions: {
                                            excel: "Excel (.xlsx)",
                                            pdf: "PDF (.pdf)",
                                        },
                                        inputPlaceholder: "Chọn định dạng",
                                        showCancelButton: true,
                                        confirmButtonText: "Tải xuống",
                                        cancelButtonText: "Hủy",
                                    });

                                    if (fileType) {
                                        try {
                                            const response = await api.get("/admin/revenue/export", {
                                                params: { type: fileType, range: timeRange },
                                                responseType: "blob",
                                            });

                                            // Tạo link tải file
                                            const blob = new Blob([response.data]);
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement("a");
                                            link.href = url;
                                            link.download =
                                                fileType === "pdf"
                                                    ? "bao_cao_doanh_thu.pdf"
                                                    : "bao_cao_doanh_thu.xlsx";
                                            link.click();
                                            window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                            console.error("❌ Lỗi xuất báo cáo:", error);
                                            Swal.fire("Lỗi", "Không thể xuất báo cáo. Vui lòng thử lại!", "error");
                                        }
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                            >
                                <Download size={18} />
                                Xuất báo cáo
                            </button>

                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Time Range Filter */}
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Filter size={20} />
                            <span className="font-medium">Khoảng thời gian:</span>
                        </div>
                        <div className="flex gap-2">
                            {[
                                { value: 'week', label: '7 ngày' },
                                { value: 'month', label: '30 ngày' },
                                { value: 'year', label: '1 năm' }
                            ].map(range => (
                                <button
                                    key={range.value}
                                    onClick={() => setTimeRange(range.value)}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${timeRange === range.value
                                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Tổng Doanh Thu"
                        value={formatCurrency(stats.totalRevenue)}
                        icon={<DollarSign size={24} />}
                        gradient="from-emerald-500 to-teal-600"
                        trend={stats.growthRate}
                    />
                    <StatsCard
                        title="Giá Trị TB/Đơn"
                        value={formatCurrency(stats.avgOrderValue)}
                        icon={<CreditCard size={24} />}
                        gradient="from-blue-500 to-indigo-600"
                        subtitle="Trung bình mỗi đơn"
                    />
                    <StatsCard
                        title="Số Đơn Hàng"
                        value={stats.totalOrders}
                        icon={<ShoppingCart size={24} />}
                        gradient="from-orange-500 to-red-600"
                        subtitle="Đã hoàn thành"
                    />
                    <StatsCard
                        title="Tăng Trưởng"
                        value={`${Math.abs(stats.growthRate)}%`}
                        icon={parseFloat(stats.growthRate) >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        gradient={parseFloat(stats.growthRate) >= 0 ? "from-green-500 to-emerald-600" : "from-red-500 to-orange-600"}
                        subtitle={`So với kỳ trước`}
                    />
                </div>

                {/* Revenue Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Revenue Line Chart */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                    <BarChart3 className="text-orange-600" size={24} />
                                    Doanh Thu Theo Ngày
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {timeRange === "week" ? "7 ngày gần nhất" : "30 ngày gần nhất"}
                                </p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueByDay}>
                                <defs>
                                    <linearGradient id="colorRevDay" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#888" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#f97316" fillOpacity={1} fill="url(#colorRevDay)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Monthly Revenue Bar Chart */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                    <Calendar className="text-blue-600" size={24} />
                                    Doanh Thu Theo Tháng
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {timeRange === "year" ? "12 tháng gần nhất" : "Theo khoảng thời gian đã chọn"}
                                </p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueByMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" stroke="#888" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product & Status Revenue */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Product */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
                            <Package className="text-purple-600" size={24} />
                            Doanh Thu Theo Sản Phẩm
                        </h2>
                        {revenueByProduct.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={revenueByProduct}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="revenue"
                                        >
                                            {revenueByProduct.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-3 mt-4">
                                    {revenueByProduct.map((product, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: product.fill }}></div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.quantity} sản phẩm</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-orange-600 text-sm">{formatCurrency(product.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <Package size={48} className="mx-auto mb-3 opacity-50" />
                                <p>Chưa có dữ liệu</p>
                            </div>
                        )}
                    </div>

                    {/* Revenue by Status */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
                            <PieChart className="text-indigo-600" size={24} />
                            Doanh Thu Theo Trạng Thái
                        </h2>
                        <div className="space-y-4">
                            {revenueByStatus.map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="font-medium text-gray-700">{item.status}</span>
                                        </div>
                                        <span className="font-bold text-gray-800">{formatCurrency(item.revenue)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(Math.max((item.revenue / stats.totalRevenue) * 100, 8), 100)}%`,
                                                backgroundColor: item.color
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 text-right">
                                        {Math.min(((item.revenue / stats.totalRevenue) * 100).toFixed(1), 100)}%
                                    </p>
                                    <p className="text-xs text-gray-500 text-right">
                                        {((item.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Revenue Orders */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                <TrendingUp className="text-green-600" size={24} />
                                Top 10 Đơn Hàng Cao Nhất
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Đơn hàng có doanh thu lớn nhất</p>
                        </div>
                    </div>
                    {topRevenueOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">#</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Mã đơn</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Khách hàng</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Doanh thu</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ngày đặt</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topRevenueOrders.map((order, index) => (
                                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="py-4 px-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
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
                                                <span className="font-bold text-green-600 text-lg">
                                                    {formatCurrency(order.total_price)}
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
            </div>
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
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${parseFloat(trend) >= 0 ? 'bg-green-400/30' : 'bg-red-400/30'
                        }`}>
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