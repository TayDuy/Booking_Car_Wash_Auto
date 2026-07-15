import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import Loading from "../components/common/Loading";

// Layouts giữ eager (nhẹ, cần render ngay khi vào section)
import AuthLayout from "../layouts/AuthLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";

// Landing page giữ eager để có First Paint nhanh nhất khi vào "/"
import LandingPage from "../features/landing/pages/LandingPage";

// ===== Lazy-loaded pages (mỗi trang tách thành 1 chunk riêng) =====

// Auth
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage"));

// Customer
const HomePage = lazy(() => import("../features/customer/pages/HomePage"));
const BookingHistory = lazy(() => import("../features/booking/pages/BookingHistory"));
const ProfilePage = lazy(() => import("../features/customer/pages/ProfilePage"));
const CustomerNotificationPage = lazy(() => import("../features/customer/pages/CustomerNotificationPage"));
const SupportPage = lazy(() => import("../features/customer/pages/Helpcenter"));
const ServicesPage = lazy(() => import("../features/services/pages/ServicesPage"));

const BookingPage = lazy(() => import("../features/booking/pages/BookingPage"));
const BookingDetailPage = lazy(() => import("../features/booking/pages/BookingDetailPage"));
const BookingSuccessPage = lazy(() => import("../features/booking/pages/BookingSuccessPage"));

const PaymentPage = lazy(() => import("../features/payment/pages/PaymentPage"));
const PaymentSuccessPage = lazy(() => import("../features/payment/pages/PaymentSuccessPage"));
const PromotionListPage = lazy(() => import("../features/promotion/pages/PromotionListPage"));
const RewardsPage = lazy(() => import("../features/loyalty/pages/RewardsPage"));

// Admin
const AdminDashboardPage = lazy(() => import("../features/admin/pages/AdminDashboardPage"));
const ManageBookingsPage = lazy(() => import("../features/admin/pages/ManageBookingsPage"));
const CreateBookingPage = lazy(() => import("../features/admin/pages/CreateBookingPage"));
const ManagerTimeSlotsPage = lazy(() => import("../features/admin/pages/ManagerTimeSlotsPage"));
const ManageCustomersPage = lazy(() => import("../features/admin/pages/ManageCustomersPage"));
const ManagePromotionsPage = lazy(() => import("../features/admin/pages/ManagePromotionsPage"));
const ManageVehiclesPage = lazy(() => import("../features/admin/pages/ManageVehiclesPage"));
const AdminNotificationPage = lazy(() => import("../features/admin/pages/AdminNotificationPage"));
const ReportsPage = lazy(() => import("../features/admin/pages/ReportsPage"));
const AuditLogsPage = lazy(() => import("../features/admin/pages/AuditLogsPage"));
const ManageBranchesPage = lazy(() => import("../features/admin/pages/ManageBranchesPage"));
const ManageServicesPage = lazy(() => import("../features/admin/pages/ManageServicesPage"));

// Manager
const ManagerDashboardPage = lazy(() => import("../features/manager/pages/ManagerDashboardPage"));
const ManagerBookingsPage = lazy(() => import("../features/manager/pages/ManagerBookingsPage"));
const ManagerStaffPage = lazy(() => import("../features/manager/pages/ManagerStaffPage"));
const ManagerRevenuePage = lazy(() => import("../features/manager/pages/ManagerRevenuePage"));
const ManagerServiceStatusPage = lazy(() => import("../features/manager/pages/ManagerServiceStatusPage"));

const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));

function AppRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* Landing page */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/payment" element={<PaymentPage />} />

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
                    <Route path="booking/success" element={<BookingSuccessPage />} />
                    <Route path="booking/success/:bookingId" element={<BookingSuccessPage />} />
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
                    <Route path="bookings/create" element={<CreateBookingPage />} />
                    <Route path="time-slots" element={<ManagerTimeSlotsPage />} />
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
        </Suspense>
    );
}

export default AppRoutes;