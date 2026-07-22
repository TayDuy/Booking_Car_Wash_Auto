import { Link, Outlet } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import "./CustomerLayout.css";

function CustomerLayout() {
  return (
    <div className="customer-layout">
      <SiteHeader />

      <main className="customer-main">
        <Outlet />
      </main>

      <footer className="global-footer-bar">
        <div className="footer-brand-info">
          <h4>WashFlow Pro</h4>
          <p>© 2026 WashFlow Pro Automation. Tất cả quyền được bảo lưu.</p>
        </div>
        <div className="footer-nav-links">
          <Link to="/customer/privacy-policy">Chính sách bảo mật</Link>
          <Link to="/customer/terms-of-service">Điều khoản dịch vụ</Link>
          <Link to="/customer/support">Hỗ trợ & Liên hệ</Link>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;