import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import env.VITE_BACKEND_URL from "./config/api";

const ProtectedRoute = () => {
  const {
    user,
    setUser,
    accessToken,
    setAccessToken,
  } = useAuth();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshLogin = async () => {
      try {
        if (user && accessToken) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${env.VITE_BACKEND_URL}/api/refresh-token`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!res.ok) {
          console.log("Refresh token failed");
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (data.ok && data.newAccessToken) {
          setAccessToken(data.newAccessToken);

          const payload = JSON.parse(
            atob(data.newAccessToken.split(".")[1])
          );

          setUser({
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role,
          });
        }
      } catch (err) {
        console.log("Protected route auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    refreshLogin();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;