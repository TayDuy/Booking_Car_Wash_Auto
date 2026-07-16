import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles }) {
  const auth = useAuth();
  const token = auth?.token;
  const user = auth?.user;
  const location = useLocation();

  console.log("[ProtectedRoute DEBUG]", {
    pathname: location.pathname,
    authUser: user,
    authRole: user?.role,
    storedRole: localStorage.getItem("role"),
    hasToken: Boolean(token),
    allowedRoles,
  });

  if (!token) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?redirect=${redirectParam}`} replace />;
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