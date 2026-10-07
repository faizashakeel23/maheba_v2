"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DemoRole = "provider" | "admin";

export interface DemoUser {
  id: string;
  email: string;
  role: DemoRole;
  providerId: string | null;
  businessName: string;
}

const KEY = "maheba_demo_session";

interface AuthCtx {
  user: DemoUser | null;
  loginProvider: (email: string, providerId: string, businessName: string) => void;
  loginAdmin: (email: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loginProvider: () => {},
  loginAdmin: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* no session */
    }
  }, []);

  const persist = (u: DemoUser) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const loginProvider = useCallback(
    (email: string, providerId: string, businessName: string) => {
      persist({
        id: `demo-${providerId}`,
        email,
        role: "provider",
        providerId,
        businessName,
      });
    },
    []
  );

  const loginAdmin = useCallback((email: string) => {
    persist({
      id: "demo-admin",
      email,
      role: "admin",
      providerId: null,
      businessName: "Maheba Admin",
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loginProvider, loginAdmin, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
