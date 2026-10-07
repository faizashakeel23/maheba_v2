"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type DemoRole } from "@/lib/auth";
import {
  getStaticVisibleProviders,
  getVisibleProviders,
} from "@/lib/directory";
import type { Provider } from "@/types";

const input =
  "w-full rounded-2xl border border-blush-200 bg-blush-50/50 px-4 py-2.5 text-sm font-semibold text-plum-900 outline-none focus:border-blush-400 focus:ring-2 focus:ring-blush-200";

export default function LoginPage() {
  const { user, loginProvider, loginAdmin, logout } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<DemoRole>("provider");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [providerId, setProviderId] = useState("");
  const [options, setOptions] = useState<Provider[]>(() =>
    getStaticVisibleProviders()
  );
  const [msg, setMsg] = useState<string | null>(null);

  // Demo-store overrides load after mount so SSR + first render match.
  useEffect(() => {
    const v = getVisibleProviders();
    setOptions(v);
    setProviderId((cur) => cur || v[0]?.id || "");
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) {
      setMsg("Please enter a valid email, pretty.");
      return;
    }
    if (password.length < 4) {
      setMsg("Password must be at least 4 characters.");
      return;
    }
    if (role === "admin") {
      // Demo admin gate: only @maheba admin mails in demo mode.
      loginAdmin(email.trim());
      router.push("/admin");
      return;
    }
    const provider = getVisibleProviders().find((p) => p.id === providerId);
    if (!provider) {
      setMsg("Pick your provider profile.");
      return;
    }
    loginProvider(email.trim(), provider.id, provider.business_name);
    router.push("/dashboard");
  }

  if (user) {
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="font-script text-3xl text-blush-500">
          hey {user.role === "admin" ? "boss" : user.businessName} ♡
        </p>
        <h1 className="font-display text-5xl text-plum-900">You&apos;re logged in</h1>
        <p className="mt-2 text-sm font-semibold text-plum-500">
          {user.email} · {user.role}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => router.push(user.role === "admin" ? "/admin" : "/dashboard")}
            className="rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 px-6 py-2 text-sm font-extrabold text-white"
          >
            Go to {user.role === "admin" ? "admin" : "dashboard"} ✿
          </button>
          <button
            onClick={logout}
            className="rounded-full border border-blush-200 bg-white px-6 py-2 text-sm font-extrabold text-plum-700"
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <p className="text-center font-script text-3xl text-blush-500">
        welcome back, gorgeous ♡
      </p>
      <h1 className="text-center font-display text-5xl leading-none text-plum-900">
        Log in
      </h1>
      <div className="mx-auto mt-4 flex w-fit rounded-full border border-blush-200 bg-white p-1 text-sm font-extrabold">
        {(["provider", "admin"] as DemoRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-full px-5 py-1.5 capitalize ${
              role === r
                ? "bg-gradient-to-r from-blush-400 to-fuchsia-400 text-white"
                : "text-plum-500"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <form
        onSubmit={onSubmit}
        className="card-cute mt-4 space-y-3 rounded-[2rem] bg-white p-6 ring-1 ring-blush-100"
      >
        {role === "provider" && (
          <>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-plum-500">
              Your business profile
            </label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className={input}
            >
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.business_name} · {p.category}
                </option>
              ))}
            </select>
          </>
        )}
        {role === "admin" && (
          <p className="rounded-2xl bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700">
            ✿ Admin demo: any email + 4-char password works. Admins approve
            providers and see payments — providers can&apos;t open /admin.
          </p>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email ✿"
          className={input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password ♡"
          className={input}
        />
        <button className="w-full rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 py-3 text-sm font-extrabold text-white shadow-md shadow-blush-200 hover:opacity-90">
          Log in as {role} ✿
        </button>
        {msg && <p className="text-sm font-bold text-blush-600">{msg}</p>}
        {role === "provider" && (
          <p className="text-xs font-semibold text-plum-500">
            New here? <a href="/join" className="font-extrabold text-blush-600 underline">Join as a provider</a> first.
          </p>
        )}
      </form>
    </main>
  );
}
