import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyOrders from './pages/MyOrders';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Order';
import OrderDetail from './pages/OrderDetail';
import ProductDetail from './pages/ProductDetail';
import AdminLogin from './admin/AdminLogin';
import Dashboard from './admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import NotFound from './components/NotFound';
import Products from './admin/Products';
import Users from './admin/Users';
import AdminOrders from './admin/Orders';
import AddProduct from './admin/products/add/AddProduct';
import EditProduct from './admin/products/edit/id/EditProduct';
import AddUser from './admin/users/add/AddUser.jsx';
import EditUser from './admin/users/edit/id/EditUser';
import Revenue from './admin/Revenue.jsx';
import ReviewList from './admin/ReviewList.jsx';
import Coupons from './admin/Coupons.jsx';
import Categories from './admin/Categories.jsx';
import Notifications from './pages/Notifications.jsx';
import NotificationManagement from './admin/NotificationManagement.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Protected */}

            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>} />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>} />

            <Route path="/success" element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>} />

            <Route path="/my-orders" element={
              <ProtectedRoute><MyOrders />
              </ProtectedRoute>} />

            <Route path="/orders" element={
              <ProtectedRoute><Orders />
              </ProtectedRoute>} />

            <Route path="/orders/:id" element={
              <ProtectedRoute><OrderDetail />
              </ProtectedRoute>} />

            <Route path="/payment-success" element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>} />

            {/* Admin */}

            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={
              <AdminRoute><Dashboard />
              </AdminRoute>} />

            <Route path="/admin/products" element={
              <AdminRoute><Products />
              </AdminRoute>} />

            <Route path="/admin/products/add" element={
              <AdminRoute><AddProduct />
              </AdminRoute>} />

            <Route path="/admin/products/edit/:id" element={
              <AdminRoute><EditProduct />
              </AdminRoute>} />

            <Route path="/admin/orders" element={
              <AdminRoute><AdminOrders />
              </AdminRoute>} />

            <Route path="/admin/users" element={
              <AdminRoute><Users />
              </AdminRoute>} />

            <Route path="/admin/users/add" element={
              <AdminRoute><AddUser />
              </AdminRoute>} />

            <Route path="/admin/users/edit/:id" element={
              <AdminRoute><EditUser />
              </AdminRoute>} />

            <Route path="/admin/revenue" element={
              <AdminRoute><Revenue />
              </AdminRoute>} />

            <Route path="/admin/reviews" element={
              <AdminRoute><ReviewList />
              </AdminRoute>} />

            <Route path="/admin/coupons" element={
              <AdminRoute><Coupons />
              </AdminRoute>} />

            <Route path="/admin/categories" element={
              <AdminRoute><Categories />
              </AdminRoute>} />

            <Route path="/admin/notifications" element={
              <AdminRoute><NotificationManagement />
              </AdminRoute>} />




            <Route path="*" element={<NotFound />} />
          </Routes>

        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;