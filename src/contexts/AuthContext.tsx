import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import * as authApi from "@/api/auth";
import { UNAUTHORIZED_EVENT } from "@/api/client";

export type User = authApi.SessionUser;

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "toproc.user";

const AuthContext = createContext<AuthContextType | null>(null);

function readStoredUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readStoredUser);

  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearUser);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearUser);
  }, [clearUser]);

  const login = async (identifier: string, password: string) => {
    const loggedIn = await authApi.login(identifier, password);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    setUser(loggedIn);
  };

  // The local session ends even if the backend session had already expired.
  const logout = () => authApi.logout().catch(() => undefined).finally(clearUser);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
