import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

// Layouts nhỏ và dùng chung nhiều route nên giữ import cứng (eager).
import AuthLayout from "../layouts/AuthLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";

// Mỗi trang bên dưới được lazy-load: mỗi trang thành 1 chunk riêng,
// chỉ tải khi user thực sự vào route đó — thay vì gộp cả ~35 trang
// vào 1 file JS khổng lồ tải ngay từ lần vào đầu tiên.
const LandingPage = lazy(() => import("../features/landing/pages/LandingPage"));

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage"));

const HomePage = lazy(() => import("../features/customer/pages/HomePage"));
const ProfilePage = lazy(() => import("../features/customer/pages/ProfilePage"));
const CustomerNotificationPage = lazy(() => import("../features/customer/pages/CustomerNotificationPage"));
const SupportPage = lazy(() => import("../features/customer/pages/Helpcenter"));
const CustomerRefundsPage = lazy(() => import("../features/customer/pages/CustomerRefundsPage"));

const ServicesPage = lazy(() => import("../features/services/pages/ServicesPage"));

const PrivacyPolicyPage = lazy(() => import("../features/legal/pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("../features/legal/pages/TermsOfServicePage"));
const ContactPage = lazy(() => import("../features/legal/pages/ContactPage"));
const LandingSupportPage = lazy(() => import("../features/legal/pages/SupportPage"));
const BookingPage = lazy(() => import("../features/booking/pages/BookingPage"));
const BookingSuccessPage = lazy(() => import("../features/booking/pages/BookingSuccessPage"));
const BookingDetailPage = lazy(() => import("../features/booking/pages/BookingDetailPage"));
const BookingHistory = lazy(() => import("../features/booking/pages/BookingHistory"));

const PaymentPage = lazy(() => import("../features/payment/pages/PaymentPage"));
const PaymentSuccessPage = lazy(() => import("../features/payment/pages/PaymentSuccessPage"));

const PromotionListPage = lazy(() => import("../features/promotion/pages/PromotionListPage"));
const RewardsPage = lazy(() => import("../features/loyalty/pages/RewardsPage"));

const AdminDashboardPage = lazy(() => import("../features/admin/pages/AdminDashboardPage"));
const ManageBookingsPage = lazy(() => import("../features/admin/pages/ManageBookingsPage"));
const ManageCustomersPage = lazy(() => import("../features/admin/pages/ManageCustomersPage"));
const ManagePromotionsPage = lazy(() => import("../features/admin/pages/ManagePromotionsPage"));
const ManageVehiclesPage = lazy(() => import("../features/admin/pages/ManageVehiclesPage"));
const AdminNotificationPage = lazy(() => import("../features/admin/pages/AdminNotificationPage"));
const ManagerTimeSlotsPage = lazy(() => import("../features/admin/pages/ManagerTimeSlotsPage"));
const ReportsPage = lazy(() => import("../features/admin/pages/ReportsPage"));
const AuditLogsPage = lazy(() => import("../features/admin/pages/AuditLogsPage"));
const ManageBranchesPage = lazy(() => import("../features/admin/pages/ManageBranchesPage"));
const ManageServicesPage = lazy(() => import("../features/admin/pages/ManageServicesPage"));
const RoleManagementPage = lazy(() => import("../features/admin/pages/RoleManagementPage"));
const SystemSettingsPage = lazy(() => import("../features/admin/pages/SystemSettingsPage"));
const ManageOrdersPage = lazy(() => import("../features/admin/pages/ManageOrdersPage"));
const PaymentHistoryPage = lazy(() => import("../features/admin/pages/PaymentHistoryPage"));
const RefundsPage = lazy(() => import("../features/admin/pages/RefundsPage"));
const AdminRatingsPage = lazy(() => import("../features/admin/pages/AdminRatingsPage"));

const EmployeeDashboardPage = lazy(() => import("../features/employee/pages/EmployeeDashboardPage"));
const EmployeeQueuePage = lazy(() => import("../features/employee/pages/EmployeeQueuePage"));
const WalkInBookingPage = lazy(() => import("../features/employee/pages/WalkInBookingPage"));
const EmployeeRefundsPage = lazy(() => import("../pages/EmployeeRefundsPage"));

const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));

function PageFallback() {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
            }}
        >
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
}

function AppRoutes() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/support" element={<LandingSupportPage />} />

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
                    <Route path="notifications" element={<CustomerNotificationPage />} />
                    <Route path="support" element={<SupportPage />} />

                    <Route path="payment" element={<PaymentPage />} />
                    <Route path="payment/success" element={<PaymentSuccessPage />} />
                    <Route path="refunds" element={<CustomerRefundsPage />} />
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
                    <Route path="notifications" element={<AdminNotificationPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                    <Route path="roles" element={<RoleManagementPage />} />
                    <Route path="settings" element={<SystemSettingsPage />} />
                    <Route path="orders" element={<ManageOrdersPage />} />
                    <Route path="payments" element={<PaymentHistoryPage />} />
                    <Route path="refunds" element={<RefundsPage />} />
                    <Route path="ratings" element={<AdminRatingsPage />} />
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
                    <Route path="refunds" element={<EmployeeRefundsPage />} />
                    <Route path="ratings" element={<AdminRatingsPage />} />
                </Route>

                {/* Not found */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;