import { Link } from "react-router-dom";
import "./PublicFooter.css";

export default function PublicFooter() {
  return (
    <footer className="public-footer" id="contact">
      <div className="app-container public-footer-grid">
        <div className="public-footer-brand">
          <h3>WashFlow Pro</h3>
          <p>
            Hệ thống đặt lịch rửa xe tự động, tiện lợi và chuyên nghiệp cho
            khách hàng hiện đại.
          </p>
        </div>

        <div className="public-footer-col">
          <h4>Liên kết</h4>
          <Link to="/services">Dịch vụ</Link>
          <a href="/#process">Quy trình</a>
          <a href="/#pricing">Bảng giá</a>
        </div>

        <div className="public-footer-col">
          <h4>Hỗ trợ</h4>
          <Link to="/customer/support">Trợ giúp</Link>
          <Link to="/auth/login">Đăng nhập</Link>
          <Link to="/auth/register">Đăng ký</Link>
        </div>

        <div className="public-footer-col">
          <h4>Liên hệ</h4>
          <p>123 Đường Công Nghệ, TP.HCM</p>
          <p>1900 8888</p>
          <p>support@washflow.vn</p>
        </div>
      </div>

      <div className="public-footer-bottom">
        <div className="app-container">
          © 2026 WashFlow Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
