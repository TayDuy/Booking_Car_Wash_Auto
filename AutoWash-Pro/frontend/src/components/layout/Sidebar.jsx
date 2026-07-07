import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Car,
  Building2,
  Package,
  Megaphone,
  BarChart3,
  ScrollText,
  ShieldCheck,
  Settings,
} from "lucide-react";
import "./Sidebar.css";

const menuGroups = [
  {
    title: "Tổng quan",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Đặt lịch", path: "/admin/bookings", icon: CalendarCheck },
      { label: "Khách hàng", path: "/admin/customers", icon: Users },
      { label: "Xe của khách", path: "/admin/vehicles", icon: Car },
      { label: "Chi nhánh", path: "/admin/branches", icon: Building2 },
      { label: "Dịch vụ", path: "/admin/services", icon: Package },
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
      { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
      { label: "Nhật ký hệ thống", path: "/admin/audit-logs", icon: ScrollText },
      { label: "Phân quyền", path: "/admin/roles", icon: ShieldCheck },
      { label: "Cấu hình", path: "/admin/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
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
                  end={item.path === "/admin"}
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
        <div className="user-avatar">A</div>
        <div>
          <strong>Admin</strong>
          <p>Super Administrator</p>
        </div>
      </div>
    </aside>
  );
}