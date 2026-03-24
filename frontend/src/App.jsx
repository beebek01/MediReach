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

import AboutPage from "./pages/public/static/AboutPage";
import PartnerPharmaciesPage from "./pages/public/static/PartnerPharmaciesPage";
import ContactPage from "./pages/public/static/ContactPage";
import FAQsPage from "./pages/public/static/FAQsPage";
import DeliveryInfoPage from "./pages/public/static/DeliveryInfoPage";
import PrivacyPolicyPage from "./pages/public/static/PrivacyPolicyPage";
import TermsOfUsePage from "./pages/public/static/TermsOfUsePage";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MedicineCatalog from "./pages/customer/MedicineCatalog";
import MedicineDetailPage from "./pages/customer/MedicineDetailPage";
import CartCheckoutPage from "./pages/customer/CartCheckoutPage";
import PrescriptionUploadPage from "./pages/customer/PrescriptionUploadPage";
import OrderTrackingPage from "./pages/customer/OrderTrackingPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import EsewaSuccessPage from "./pages/customer/EsewaSuccessPage";
import EsewaFailurePage from "./pages/customer/EsewaFailurePage";
import EsewaMockCheckoutPage from "./pages/customer/EsewaMockCheckoutPage";
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
import AdminMessagesPage from "./pages/admin/AdminMessagesPage";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/partners", element: <PartnerPharmaciesPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/faqs", element: <FAQsPage /> },
  { path: "/delivery", element: <DeliveryInfoPage /> },
  { path: "/privacy", element: <PrivacyPolicyPage /> },
  { path: "/terms", element: <TermsOfUsePage /> },

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
        path: "orders/:id",
        element: <OrderTrackingPage />,
        handle: { title: "Order Details" },
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
        path: "payment/esewa/success",
        element: <EsewaSuccessPage />,
        handle: { title: "eSewa Payment" },
      },
      {
        path: "payment/esewa/failure",
        element: <EsewaFailurePage />,
        handle: { title: "eSewa Payment" },
      },
      {
        path: "payment/esewa/mock-checkout",
        element: <EsewaMockCheckoutPage />,
        handle: { title: "eSewa Checkout" },
      },
    ],
  },

  {
    path: "/pharmacist",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
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
        path: "messages",
        element: <AdminMessagesPage />,
        handle: { title: "Support Messages" },
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
