import { Link } from "react-router-dom";
import "./UnauthorizedPage.css";

function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">🚫</div>
        <h1>403</h1>
        <h2>Không có quyền truy cập</h2>
        <p>
          Tài khoản của bạn không có quyền truy cập chức năng này.
        </p>

        <Link to="/customer/home" className="unauthorized-btn">
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default UnauthorizedPage;