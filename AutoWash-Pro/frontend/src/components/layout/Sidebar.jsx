import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
  LayoutDashboard,
  CalendarCheck,
  Star,
  Users,
  Car,
  Building2,
  Package,
  Megaphone,
  BarChart3,
  ScrollText,
  Bell,
  ShoppingCart,
  ReceiptText,
  ShieldCheck,
  Settings,
  Undo2,
} from "lucide-react";
import "./Sidebar.css";

const menuGroups = [
  {
    title: "Tổng quan",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Đặt lịch", path: "/admin/bookings", icon: CalendarCheck },
      { label: "Đánh giá", path: "/admin/ratings", icon: Star },
      { label: "Khách hàng", path: "/admin/customers", icon: Users },
      { label: "Xe của khách", path: "/admin/vehicles", icon: Car },
      { label: "Chi nhánh", path: "/admin/branches", icon: Building2 },
      { label: "Dịch vụ", path: "/admin/services", icon: Package },
      { label: "Đơn hàng", path: "/admin/orders", icon: ShoppingCart },
      { label: "Thanh toán", path: "/admin/payments", icon: ReceiptText },
      { label: "Hoàn tiền", path: "/admin/refunds", icon: Undo2 },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Khuyến mãi", path: "/admin/promotions", icon: Megaphone },
    ],
  },
  {
    title: "Báo cáo & hệ thống",
    items: [
      { label: "Phân quyền", path: "/admin/roles", icon: ShieldCheck },
      { label: "Cấu hình", path: "/admin/settings", icon: Settings },
      { label: "Thông báo", path: "/admin/notifications", icon: Bell },
      { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
      { label: "Nhật ký hệ thống", path: "/admin/audit-logs", icon: ScrollText },
    ],
  },
];

export default function Sidebar() {
  const auth = useAuth();
  const user = auth?.user;

  const rawDisplayName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    localStorage.getItem("fullName") ||
    localStorage.getItem("username");

  const displayName =
    rawDisplayName &&
    String(rawDisplayName).trim() &&
    String(rawDisplayName).trim().toLowerCase() !== "unknown" &&
    String(rawDisplayName).trim().toLowerCase() !== "null" &&
    String(rawDisplayName).trim().toLowerCase() !== "undefined"
      ? String(rawDisplayName).trim()
      : "Admin";

  const rawRole =
    user?.role ||
    localStorage.getItem("role") ||
    "ADMIN";

  const displayRole =
    String(rawRole).toUpperCase() === "ADMIN"
      ? "Quản trị viên"
      : rawRole;

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">💧</div>
        <div>
          <h2>WashFlow Pro</h2>
          <p>Admin Dashboard</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group) => (
          <div className="menu-group" key={group.title}>
            <span className="menu-title">{group.title}</span>

            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin/dashboard"}
                  className={({ isActive }) =>
                    isActive ? "sidebar-link active" : "sidebar-link"
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div>
        <div>
          <strong>{displayName}</strong>
          <p>{displayRole}</p>
        </div>
      </div>
    </aside>
  );
}
