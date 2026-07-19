import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function normalizeRole(role) {
  const roleValue =
    typeof role === "object" && role !== null
      ? role.authority ?? role.name ?? role.role
      : role;

  return String(roleValue ?? "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function getUserRoles(auth) {
  const authRoles = auth?.user?.roles;
  const storedRoles = localStorage.getItem("roles");

  let parsedStoredRoles = [];

  if (storedRoles) {
    try {
      const parsedValue = JSON.parse(storedRoles);
      parsedStoredRoles = Array.isArray(parsedValue)
        ? parsedValue
        : [parsedValue];
    } catch {
      parsedStoredRoles = storedRoles.split(",");
    }
  }

  const possibleRoles = [
    ...(Array.isArray(authRoles) ? authRoles : []),
    auth?.user?.role,
    localStorage.getItem("role"),
    ...parsedStoredRoles,
  ];

  return [...new Set(possibleRoles.map(normalizeRole).filter(Boolean))];
}

function ProtectedRoute({ children, allowedRoles }) {
  const auth = useAuth();
  const location = useLocation();

  const token =
    auth?.token ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  const authLoading = Boolean(auth?.loading || auth?.isLoading);

  if (authLoading) {
    return (
      <div role="status" aria-live="polite">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!token) {
    const redirectTarget = `${location.pathname}${location.search}`;

    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  if (allowedRoles?.length) {
    const userRoles = getUserRoles(auth);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    const hasAllowedRole = normalizedAllowedRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasAllowedRole) {
      return (
        <Navigate
          to="/unauthorized"
          replace
          state={{ from: location.pathname }}
        />
      );
    }
  }

  return children;
}

export default ProtectedRoute;