import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { user, setUser, setAccessToken } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/refresh-token`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!res.ok) {
          navigate('/unthoriazed')
        }
        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        const accessToken = data.accessToken || data.newAccessToken;

        setAccessToken(accessToken);

        const userRes = await fetch(`http://localhost:5000/api/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userRes.ok) throw new Error("User fetch failed");

        const userData = await userRes.json();

        setUser(userData);

      } catch (err) {
        setUser(null);
        navigate("/login");
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