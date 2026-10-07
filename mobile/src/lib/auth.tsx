import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  loginProvider: (email: string, providerId: string, businessName: string) => Promise<void>;
  loginAdmin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loginProvider: async () => {},
  loginAdmin: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const persist = async (u: DemoUser) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const loginProvider = useCallback(
    async (email: string, providerId: string, businessName: string) => {
      await persist({
        id: `demo-${providerId}`,
        email,
        role: "provider",
        providerId,
        businessName,
      });
    },
    []
  );

  const loginAdmin = useCallback(async (email: string) => {
    await persist({
      id: "demo-admin",
      email,
      role: "admin",
      providerId: null,
      businessName: "Maheba Admin",
    });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loginProvider, loginAdmin, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
