import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutFromServer } from "../api/authService";
import "./CustomerLayout.css";

function CustomerLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutFromServer();
    navigate("/");
  };

  return (
    <div className="customer-layout">
      <header className="customer-header">
        <div className="app-container customer-header-inner">
          <NavLink to="/customer/home" className="customer-brand">
            <div className="customer-brand-icon">W</div>
            <span>WashFlow Pro</span>
          </NavLink>

          <nav className="customer-nav">
            <NavLink to="/customer/home">Trang chủ</NavLink>
            <NavLink to="/customer/booking">Đặt lịch</NavLink>
            <NavLink to="/customer/promotions">Ưu đãi</NavLink>
            <NavLink to="/customer/history">Lịch sử</NavLink>
            <NavLink to="/customer/profile">Hồ sơ</NavLink>
          </nav>

          <div className="customer-actions">
            <NavLink to="/customer/notifications" className="notification-btn">
              🔔
            </NavLink>

            <button className="logout-btn" type="button" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="customer-main">
        <Outlet />
      </main>

      <footer className="customer-footer">
        <div className="app-container customer-footer-inner">
          <div>
            <h3>WashFlow Pro</h3>
            <p>Đặt lịch rửa xe nhanh chóng, tiện lợi và chuyên nghiệp.</p>
          </div>

          <div className="customer-footer-links">
            <NavLink to="/customer/home">Trang chủ</NavLink>
            <NavLink to="/customer/booking">Đặt lịch</NavLink>
            <NavLink to="/customer/promotions">Ưu đãi</NavLink>
            <NavLink to="/customer/support">Hỗ trợ</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;