//src/context/UserContext.jsx

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Every request goes through here so the token cookie is always sent
  const api = useCallback(async (path, { method = "GET", body } = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== "/api/auth/login") setUser(null);
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }, []);

  // Restore session on page reload
  useEffect(() => {
    api("/api/user")
        .then((u) => setUser({ ...u, id: u._id }))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
  }, [api]);

  async function login(username, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  return (
      <UserContext.Provider value={{ user, loading, login, logout, api }}>
        {children}
      </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);