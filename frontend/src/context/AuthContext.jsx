import { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("medireach_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("medireach_token"),
  );
  const [refreshTokenStr, setRefreshTokenStr] = useState(() =>
    localStorage.getItem("medireach_refresh"),
  );

  const persistAuth = (userData, access, refresh) => {
    setUser(userData);
    setAccessToken(access);
    setRefreshTokenStr(refresh);
    localStorage.setItem("medireach_user", JSON.stringify(userData));
    localStorage.setItem("medireach_token", access);
    localStorage.setItem("medireach_refresh", refresh);
  };

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.login(email, password);
      const { user: u, accessToken: at, refreshToken: rt } = res.data;
      persistAuth(u, at, rt);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, error: err.message || "Login failed" };
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    try {
      const res = await api.googleAuth(idToken);
      const { user: u, accessToken: at, refreshToken: rt } = res.data;
      persistAuth(u, at, rt);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, error: err.message || "Google login failed" };
    }
  }, []);

  const loginWithApple = useCallback(
    async ({ idToken, authorizationCode, fullName }) => {
      try {
        const res = await api.appleAuth({
          idToken,
          authorizationCode,
          fullName,
        });
        const { user: u, accessToken: at, refreshToken: rt } = res.data;
        persistAuth(u, at, rt);
        return { success: true, user: u };
      } catch (err) {
        return { success: false, error: err.message || "Apple login failed" };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      if (refreshTokenStr && accessToken) {
        await api.logout(refreshTokenStr, accessToken);
      }
    } catch {
      /* ignore */
    }
    setUser(null);
    setAccessToken(null);
    setRefreshTokenStr(null);
    localStorage.removeItem("medireach_user");
    localStorage.removeItem("medireach_token");
    localStorage.removeItem("medireach_refresh");
  }, [refreshTokenStr, accessToken]);

  const register = useCallback(async (data) => {
    try {
      const res = await api.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || "customer",
        phone: data.phone || undefined,
      });
      const { user: u } = res.data;
      // After registration, auto-login to get tokens
      const loginRes = await api.login(data.email, data.password);
      const { user: lu, accessToken: at, refreshToken: rt } = loginRes.data;
      persistAuth(lu, at, rt);
      return { success: true, user: lu };
    } catch (err) {
      return { success: false, error: err.message || "Registration failed" };
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    register,
    loginWithGoogle,
    loginWithApple,
    isAuthenticated: !!user,
    accessToken,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
