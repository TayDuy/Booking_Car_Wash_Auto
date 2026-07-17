import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = auth?.token || localStorage.getItem("token");
    const userRole = auth?.user?.role || localStorage.getItem("role");

    if (!token) {
      const redirectParam = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth/login?redirect=${redirectParam}`, { replace: true });
      return;
    }

    if (allowedRoles?.length) {
      const userRoleUpper = String(userRole || "").toUpperCase();
      const hasRole = allowedRoles.some(r => r.toUpperCase() === userRoleUpper);
      if (!hasRole) {
        navigate("/unauthorized", { replace: true });
        return;
      }
    }
  }, []);

  const token = auth?.token || localStorage.getItem("token");
  const userRole = auth?.user?.role || localStorage.getItem("role");

  if (!token) return null;

  if (allowedRoles?.length) {
    const userRoleUpper = String(userRole || "").toUpperCase();
    const hasRole = allowedRoles.some(r => r.toUpperCase() === userRoleUpper);
    if (!hasRole) return null;
  }

  return children;
}

export default ProtectedRoute;