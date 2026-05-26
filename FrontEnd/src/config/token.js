import BASE_URL from "./api";

export const getToken = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/refresh-token`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      const token = data.newAccessToken || data.accessToken;
      localStorage.setItem("accessToken", token);
      return token;
    }
  } catch (_) {}

  return localStorage.getItem("accessToken");
};
