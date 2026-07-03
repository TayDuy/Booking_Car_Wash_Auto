import { Outlet } from "react-router-dom";
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
          <a href="#">Liên hệ</a>
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản dịch vụ</a>
          <a href="#">Hỗ trợ</a>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;