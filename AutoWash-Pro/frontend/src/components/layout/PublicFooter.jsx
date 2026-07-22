import { Link } from "react-router-dom";
import "./PublicFooter.css";

export default function PublicFooter() {
  return (
    <footer className="public-footer" id="contact">
      <div className="app-container public-footer-inner">
        {/* Cột trái: Logo & Bản quyền */}
        <div className="footer-brand">
          <h3 className="footer-logo">WashFlow Pro</h3>
          <p className="footer-copyright">
            © 2026 WashFlow Pro Automation. Bảo lưu mọi quyền.
          </p>
        </div>

        {/* Cột phải: Đường dẫn Điều khoản, Chính sách & Hỗ trợ */}
        <div className="footer-nav-col">
          <Link to="/privacy-policy">Chính sách bảo mật</Link>
          <Link to="/terms-of-service">Điều khoản dịch vụ</Link>
          <Link to="/support">Hỗ trợ & Liên hệ</Link>
        </div>
      </div>
    </footer>
  );
}