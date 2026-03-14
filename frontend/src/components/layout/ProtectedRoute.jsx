import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../data/constants";

const roleBase = {
  [ROLES.CUSTOMER]: "/customer",
  [ROLES.PHARMACIST]: "/pharmacist",
  [ROLES.ADMIN]: "/admin",
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const base = roleBase[user.role] || "/";
    return <Navigate to={base} replace />;
  }

  return children;
}
