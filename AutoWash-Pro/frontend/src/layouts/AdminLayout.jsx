import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutFromServer } from "../api/authService";
import "./AdminLayout.css";

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutFromServer();
    navigate("/");
  };

  return (
    <div className="st-admin-layout">
      <aside className="st-sidebar">
        <div className="st-sidebar-top">
          <div className="st-brand">
            <h2>WashFlow Pro</h2>
            <p>Hệ thống quản trị</p>
          </div>

          <nav className="st-menu">
            <div className="st-menu-title">TỔNG QUAN</div>
            <NavLink to="/admin/dashboard">
              <span>▦</span>
              Bảng điều khiển
            </NavLink>

            <div className="st-menu-title">QUẢN LÝ CƠ SỞ</div>
            <NavLink to="/admin/branches">
              <span>🏢</span>
              Quản lý chi nhánh
            </NavLink>

            <NavLink to="/admin/services">
              <span>🧽</span>
              Quản lý dịch vụ
            </NavLink>

            <div className="st-menu-title">QUẢN LÝ NGHIỆP VỤ</div>
            <NavLink to="/admin/customers">
              <span>👥</span>
              Quản lý khách hàng
            </NavLink>

            <NavLink to="/admin/vehicles">
              <span>🚗</span>
              Quản lý phương tiện
            </NavLink>

            <NavLink to="/admin/bookings">
              <span>📅</span>
              Quản lý đặt lịch
            </NavLink>

            <div className="st-menu-title">MARKETING & SALES</div>
            <NavLink to="/admin/promotions">
              <span>🏷</span>
              Khuyến mãi
            </NavLink>

            <div className="st-menu-title">HỆ THỐNG</div>
            <NavLink to="/admin/notifications">
              <span>🔔</span>
              Thông báo
            </NavLink>

            <NavLink to="/admin/reports">
              <span>📊</span>
              Báo cáo
            </NavLink>

            <NavLink to="/admin/audit-logs">
              <span>📋</span>
              Nhật ký hệ thống
            </NavLink>
          </nav>
        </div>

        <div className="st-sidebar-bottom">
          <div className="st-admin-profile">
            <div className="st-profile-avatar">A</div>
            <div>
              <strong>Admin WashFlow</strong>
              <span>Quản trị viên cao cấp</span>
            </div>
          </div>

          <button className="st-logout-btn" type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <section className="st-admin-content">
        <header className="st-topbar">
          <div className="st-search">
            <span>⌕</span>
            <input type="text" placeholder="Tìm kiếm dữ liệu, khách hàng..." />
          </div>

          <div className="st-top-actions">
            <button type="button">🔔</button>
            <button type="button">?</button>

            <div className="st-time">
              <strong>14:20 PM</strong>
              <span>Hôm nay, 24/10/2023</span>
            </div>

            <button type="button">📅</button>
          </div>
        </header>

        <main className="st-main">
          <Outlet />
        </main>
      </section>
    </div>
  );
}

export default AdminLayout;