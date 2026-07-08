import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import LandingPage from "../features/landing/pages/LandingPage";

import AuthLayout from "../layouts/AuthLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";

import HomePage from "../features/customer/pages/HomePage";
import BookingHistory from "../features/booking/pages/BookingHistory";
import ProfilePage from "../features/customer/pages/ProfilePage";
import CustomerNotificationPage from "../features/customer/pages/CustomerNotificationPage";
import SupportPage from "../features/customer/pages/Helpcenter";
import ServicesPage from "../features/services/pages/ServicesPage";

import BookingPage from "../features/booking/pages/BookingPage";
import BookingDetailPage from "../features/booking/pages/BookingDetailPage";

import PaymentPage from "../features/payment/pages/PaymentPage";
import PaymentSuccessPage from "../features/payment/pages/PaymentSuccessPage";

import PromotionListPage from "../features/promotion/pages/PromotionListPage";
import RewardsPage from "../features/loyalty/pages/RewardsPage";

import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import ManageBookingsPage from "../features/admin/pages/ManageBookingsPage";
import ManageCustomersPage from "../features/admin/pages/ManageCustomersPage";
import ManagePromotionsPage from "../features/admin/pages/ManagePromotionsPage";
import ManageVehiclesPage from "../features/admin/pages/ManageVehiclesPage";
import AdminNotificationPage from "../features/admin/pages/AdminNotificationPage";
import ReportsPage from "../features/admin/pages/ReportsPage";
import ManageCatalog from "../features/admin/pages/ManageCatalog";
import AuditLogsPage from "../features/admin/pages/AuditLogsPage";
import ManageBranchesPage from "../features/admin/pages/ManageBranchesPage";
import ManageServicesPage from "../features/admin/pages/ManageServicesPage";

import ManagerDashboardPage from "../features/manager/pages/ManagerDashboardPage";
import ManagerBookingsPage from "../features/manager/pages/ManagerBookingsPage";
import ManagerStaffPage from "../features/manager/pages/ManagerStaffPage";
import ManagerRevenuePage from "../features/manager/pages/ManagerRevenuePage";
import ManagerServiceStatusPage from "../features/manager/pages/ManagerServiceStatusPage";

import UnauthorizedPage from "../pages/UnauthorizedPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Services Showcase */}
      <Route path="/services" element={<ServicesPage />} />

      {/* Unauthorized page */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Customer routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "USER"]}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="booking/:bookingId" element={<BookingDetailPage />} />
        <Route path="history" element={<BookingHistory />} />
        <Route path="promotions" element={<PromotionListPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<CustomerNotificationPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="payment/success" element={<PaymentSuccessPage />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="bookings" element={<ManageBookingsPage />} />
        <Route path="customers" element={<ManageCustomersPage />} />
        <Route path="promotions" element={<ManagePromotionsPage />} />
        <Route path="vehicles" element={<ManageVehiclesPage />} />
        <Route path="branches" element={<ManageBranchesPage />} />
        <Route path="services" element={<ManageServicesPage />} />
        <Route path="notifications" element={<AdminNotificationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Manager routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={["MANAGER", "STAFF"]}>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboardPage />} />
        <Route path="bookings" element={<ManagerBookingsPage />} />
        <Route path="staff" element={<ManagerStaffPage />} />
        <Route path="revenue" element={<ManagerRevenuePage />} />
        <Route path="service-status" element={<ManagerServiceStatusPage />} />
      </Route>

      {/* Not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;