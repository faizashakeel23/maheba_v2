import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiLogin, apiLogout, apiSession } from "./api";

// Same shape as before, now backed by real DB sessions (Bearer token)
// instead of demo picks. Token lives in AsyncStorage (Expo Go compatible;
// switch to expo-secure-store with a dev build for production).
export type DemoRole = "provider" | "admin";

export interface DemoUser {
  id: string;
  email: string;
  role: DemoRole;
  providerId: string | null;
  businessName: string;
}

interface AuthCtx {
  user: DemoUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ user: DemoUser } | { error: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => ({ error: "Auth not ready." }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (!result.ok) {
      if (!result.offline) return { error: result.error };
      return { error: "Can't reach the server. Check EXPO_PUBLIC_API_URL ♡" };
    }
    setUser(result.data);
    return { user: result.data };
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
