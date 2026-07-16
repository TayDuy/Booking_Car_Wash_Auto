import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "./Unauthorized.css";

const homeByRole = {
  ADMIN: "/admin/dashboard",
  EMPLOYEE: "/employee/dashboard",
  CUSTOMER: "/customer/home",
  USER: "/customer/home",
};

function UnauthorizedPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [homePath, setHomePath] = useState("/");

  useEffect(() => {
    const role = auth?.user?.role;
    if (role) {
      setHomePath(homeByRole[role.toUpperCase()] || "/");
    }
  }, [auth?.user?.role]);

  function handleLogout() {
    auth.logout();
    navigate("/auth/login", { replace: true });
  }

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">🚫</div>
        <h1>403</h1>
        <h2>Không có quyền truy cập</h2>
        <p>
          Tài khoản của bạn không có quyền truy cập chức năng này.
        </p>

        <div className="unauthorized-actions">
          <Link to={homePath} className="unauthorized-btn">
            Quay về trang chủ
          </Link>
          <button className="unauthorized-btn secondary" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;