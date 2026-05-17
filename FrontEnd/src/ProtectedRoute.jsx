import BASE_URL from "./config/api";
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/refresh-token`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          const stored = localStorage.getItem("user");
          if (stored) {
            setUser(JSON.parse(stored));
            setLoading(false);
            return;
          }
          navigate("/login");
          return;
        }

        const data = await res.json();
        const accessToken = data.accessToken || data.newAccessToken;
        setAccessToken(accessToken);

        const userRes = await fetch(`${BASE_URL}/api/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userRes.ok) throw new Error("User fetch failed");

        const userData = await userRes.json();
        setUser(userData);

      } catch (err) {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setAccessToken, navigate]);

  if (loading) return <div>Loading...</div>;

  return <Outlet />;
};

export default ProtectedRoute;
