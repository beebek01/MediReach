import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { ROLES } from "./data/constants";

import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import ResetPasswordPage from "./pages/public/ResetPasswordPage";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MedicineCatalog from "./pages/customer/MedicineCatalog";
import MedicineDetailPage from "./pages/customer/MedicineDetailPage";
import CartCheckoutPage from "./pages/customer/CartCheckoutPage";
import PrescriptionUploadPage from "./pages/customer/PrescriptionUploadPage";
import OrderTrackingPage from "./pages/customer/OrderTrackingPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import ImepaySuccessPage from "./pages/customer/ImepaySuccessPage";
import ImepayFailurePage from "./pages/customer/ImepayFailurePage";
import WishlistPage from "./pages/customer/WishlistPage";

import PharmacistDashboard from "./pages/pharmacist/PharmacistDashboard";
import InventoryManagementPage from "./pages/pharmacist/InventoryManagementPage";
import VerifyPrescriptionsPage from "./pages/pharmacist/VerifyPrescriptionsPage";
import ManageOrdersPage from "./pages/pharmacist/ManageOrdersPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import MedicineManagementPage from "./pages/admin/MedicineManagementPage";
import AllOrdersPage from "./pages/admin/AllOrdersPage";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  {
    path: "/medicines",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <MedicineCatalog />,
        handle: {
          title: "Medicine Catalog",
          searchPlaceholder: "Search medicines...",
        },
      },
      {
        path: ":id",
        element: <MedicineDetailPage />,
        handle: { title: "Medicine Details" },
      },
    ],
  },

  {
    path: "/customer",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <CustomerDashboard />,
        handle: { title: "Dashboard" },
      },
      {
        path: "cart",
        element: <CartCheckoutPage />,
        handle: { title: "Cart & Checkout" },
      },
      {
        path: "prescriptions",
        element: <PrescriptionUploadPage />,
        handle: { title: "Prescriptions" },
      },
      {
        path: "track",
        element: <OrderTrackingPage />,
        handle: { title: "Track Order" },
      },
      {
        path: "orders",
        element: <MyOrdersPage />,
        handle: { title: "My Orders" },
      },
      {
        path: "profile",
        element: <CustomerProfilePage />,
        handle: { title: "Profile" },
      },
      {
        path: "wishlist",
        element: <WishlistPage />,
        handle: { title: "My Wishlist" },
      },
      {
        path: "payment/imepay/success",
        element: <ImepaySuccessPage />,
        handle: { title: "IME Pay Payment" },
      },
      {
        path: "payment/imepay/failure",
        element: <ImepayFailurePage />,
        handle: { title: "IME Pay Payment" },
      },
    ],
  },

  {
    path: "/pharmacist",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.PHARMACIST]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <PharmacistDashboard />,
        handle: { title: "Pharmacist Dashboard" },
      },
      {
        path: "inventory",
        element: <InventoryManagementPage />,
        handle: { title: "Inventory" },
      },
      {
        path: "verify",
        element: <VerifyPrescriptionsPage />,
        handle: { title: "Verify Prescriptions" },
      },
      {
        path: "orders",
        element: <ManageOrdersPage />,
        handle: { title: "Manage Orders" },
      },
      {
        path: "profile",
        element: <CustomerProfilePage />,
        handle: { title: "Profile" },
      },
    ],
  },

  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
        handle: { title: "Admin Dashboard" },
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
        handle: { title: "Analytics" },
      },
      {
        path: "users",
        element: <UserManagementPage />,
        handle: { title: "User Management" },
      },
      {
        path: "medicines",
        element: <MedicineManagementPage />,
        handle: { title: "Medicine Management" },
      },
      {
        path: "orders",
        element: <AllOrdersPage />,
        handle: { title: "All Orders" },
      },
      {
        path: "profile",
        element: <CustomerProfilePage />,
        handle: { title: "Profile" },
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>
              <RouterProvider router={router} />
            </WishlistProvider>
          </CartProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
