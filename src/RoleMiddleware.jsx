import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const RoleMiddleware = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet context={{ user }} />;
};

export default RoleMiddleware;