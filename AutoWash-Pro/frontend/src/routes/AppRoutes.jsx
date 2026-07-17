import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import LandingPage from "../features/landing/pages/LandingPage";

import AuthLayout from "../layouts/AuthLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";

import HomePage from "../features/customer/pages/HomePage";
import ProfilePage from "../features/customer/pages/ProfilePage";
import CustomerNotificationPage from "../features/customer/pages/CustomerNotificationPage";
import SupportPage from "../features/customer/pages/Helpcenter";

import ServicesPage from "../features/services/pages/ServicesPage";

import BookingPage from "../features/booking/pages/BookingPage";
import BookingSuccessPage from "../features/booking/pages/BookingSuccessPage";
import BookingDetailPage from "../features/booking/pages/BookingDetailPage";
import BookingHistory from "../features/booking/pages/BookingHistory";

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
import ManagerTimeSlotsPage from "../features/admin/pages/ManagerTimeSlotsPage";
import ReportsPage from "../features/admin/pages/ReportsPage";
import AuditLogsPage from "../features/admin/pages/AuditLogsPage";
import ManageBranchesPage from "../features/admin/pages/ManageBranchesPage";
import ManageServicesPage from "../features/admin/pages/ManageServicesPage";
import RoleManagementPage from "../features/admin/pages/RoleManagementPage";
import SystemSettingsPage from "../features/admin/pages/SystemSettingsPage";
import ManageOrdersPage from "../features/admin/pages/ManageOrdersPage";
import PaymentHistoryPage from "../features/admin/pages/PaymentHistoryPage";

import EmployeeDashboardPage from "../features/employee/pages/EmployeeDashboardPage";
import EmployeeQueuePage from "../features/employee/pages/EmployeeQueuePage";
import WalkInBookingPage from "../features/employee/pages/WalkInBookingPage";

import UnauthorizedPage from "../pages/UnauthorizedPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authentication */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Customer */}
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
        <Route path="booking/success" element={<BookingSuccessPage />} />
        <Route path="booking/:bookingId" element={<BookingDetailPage />} />
        <Route path="history" element={<BookingHistory />} />

        <Route path="promotions" element={<PromotionListPage />} />
        <Route path="rewards" element={<RewardsPage />} />

        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="notifications"
          element={<CustomerNotificationPage />}
        />
        <Route path="support" element={<SupportPage />} />

        <Route path="payment" element={<PaymentPage />} />
        <Route
          path="payment/success"
          element={<PaymentSuccessPage />}
        />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout />
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
        <Route path="time-slots" element={<ManagerTimeSlotsPage />} />
        <Route
          path="notifications"
          element={<AdminNotificationPage />}
        />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="roles" element={<RoleManagementPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="orders" element={<ManageOrdersPage />} />
        <Route path="payments" element={<PaymentHistoryPage />} />
      </Route>

      {/* Employee */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboardPage />} />
        <Route path="queue" element={<EmployeeQueuePage />} />
        <Route path="bookings/new" element={<WalkInBookingPage />} />
      </Route>

      {/* Not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
