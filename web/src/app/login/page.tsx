"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const input =
  "w-full rounded-2xl border border-blush-200 bg-blush-50/50 px-4 py-2.5 text-sm font-semibold text-plum-900 outline-none focus:border-blush-400 focus:ring-2 focus:ring-blush-200";

export default function LoginPage() {
  const { user, loading, login, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) {
      setMsg("Please enter a valid email, pretty.");
      return;
    }
    if (password.length < 1) {
      setMsg("Enter your password ♡");
      return;
    }
    setBusy(true);
    setMsg(null);
    const result = await login(email.trim(), password);
    setBusy(false);
    if ("error" in result) {
      setMsg(result.error);
      return;
    }
    router.push(result.user.role === "admin" ? "/admin" : "/dashboard");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="font-script text-3xl text-blush-500">one sec… ♡</p>
      </main>
    );
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
      <form
        onSubmit={onSubmit}
        className="card-cute mt-4 space-y-3 rounded-[2rem] bg-white p-6 ring-1 ring-blush-100"
      >
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
        <button
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 py-3 text-sm font-extrabold text-white shadow-md shadow-blush-200 hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Checking… ♡" : "Log in ✿"}
        </button>
        {msg && <p className="text-sm font-bold text-blush-600">{msg}</p>}
        <p className="text-xs font-semibold text-plum-500">
          New here?{" "}
          <a href="/join" className="font-extrabold text-blush-600 underline">
            Join as a provider
          </a>{" "}
          first.
        </p>
      </form>
    </main>
  );
}
