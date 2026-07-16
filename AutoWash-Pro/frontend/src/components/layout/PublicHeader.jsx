import { Link, useLocation } from "react-router-dom";
import "./PublicHeader.css";

export default function PublicHeader() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="public-header">
      <div className="app-container public-header-inner">
        <Link to="/" className="public-logo">
          <img src="/logo.png" alt="Logo" className="public-logo-img" />
          WashFlow Pro
        </Link>

        <nav className="public-nav">
          <Link to="/" className={isActive("/") ? "nav-active" : ""}>Trang chủ</Link>
          <Link to="/services" className={isActive("/services") ? "nav-active" : ""}>Dịch vụ</Link>
          <a href={isActive("/") ? "#process" : "/#process"}>Đặt lịch</a>
          <a href={isActive("/") ? "#pricing" : "/#pricing"}>Bảng giá</a>
          <a href={isActive("/") ? "#contact" : "/#contact"}>Liên hệ</a>
        </nav>

        <div className="public-actions">
          <Link to="/auth/login" className="public-login-btn">Đăng nhập</Link>
          <Link to="/auth/register" className="public-register-btn">Đăng ký</Link>
        </div>
      </div>
    </header>
  );
}
