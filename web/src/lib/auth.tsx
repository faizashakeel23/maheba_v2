"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Same shape as before, now backed by real DB sessions instead of demo picks.
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

function toUser(raw: unknown): DemoUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (u.role !== "provider" && u.role !== "admin") return null;
  return {
    id: String(u.id ?? ""),
    email: String(u.email ?? ""),
    role: u.role,
    providerId:
      u.providerId == null ? null : String(u.providerId as string),
    businessName: String((u.businessName as string) ?? ""),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUser(toUser((d as { user?: unknown }).user)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          user?: unknown;
        } | null;
        if (!res.ok) return { error: data?.error ?? "Login failed, pretty." };
        const u = toUser(data?.user);
        if (!u) return { error: "Login failed, pretty." };
        setUser(u);
        return { user: u };
      } catch {
        return { error: "Network error. Is the server running?" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* already out */
    }
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
