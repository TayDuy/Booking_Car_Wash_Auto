import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length) {
    const userRoleUpper = role?.toUpperCase();
    const hasRole = allowedRoles.some(r => r.toUpperCase() === userRoleUpper);
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;