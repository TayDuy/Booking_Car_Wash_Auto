import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles }) {
  const auth = useAuth();
  const token = auth?.token;
  const user = auth?.user;

  if (!token) {
    return <Navigate to="/auth/login" replace />;
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