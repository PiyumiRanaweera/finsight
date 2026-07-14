import { createContext, useContext, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({ email: data.email, fullName: data.fullName }));
    setUser({ email: data.email, fullName: data.fullName });
    localStorage.setItem("refreshToken", data.refreshToken);
  };

  const register = async (email, password, fullName) => {
    const { data } = await client.post("/auth/register", { email, password, fullName });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({ email: data.email, fullName: data.fullName }));
    setUser({ email: data.email, fullName: data.fullName });
    localStorage.setItem("refreshToken", data.refreshToken);
  };

  const logout = async () => {
    try { await client.post("/auth/logout"); } catch { /* best effort */ }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}