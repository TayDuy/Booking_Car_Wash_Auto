import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles }) {
  const auth = useAuth();
  const location = useLocation();
  const token = auth?.token;
  const user = auth?.user;

  if (!token) {
    // Giữ lại nơi người dùng định vào (vd /customer/booking) để sau khi
    // đăng nhập (kể cả đăng nhập Google) quay lại đúng trang đó, thay vì
    // luôn rơi về trang mặc định theo role.
    const redirectTarget = encodeURIComponent(
        `${location.pathname}${location.search}`
    );
    return (
        <Navigate to={`/auth/login?redirect=${redirectTarget}`} replace />
    );
  }

  if (allowedRoles?.length) {
    const userRoleUpper = user?.role?.toUpperCase();
    const hasRole = allowedRoles.some(r => r.toUpperCase() === userRoleUpper);
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;