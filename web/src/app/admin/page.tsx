"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { isVisible } from "@/lib/directory";
import {
  approveSubmission,
  getAllProviders,
  getAudit,
  getJoinSubmissions,
  rejectSubmission,
  setProviderStatus,
  type AuditEntry,
  type JoinSubmission,
} from "@/lib/providers";
import {
  decideProvider,
  fetchAdminProviders,
  fetchAudit,
} from "@/lib/api";
import type { Provider } from "@/types";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [joins, setJoins] = useState<JoinSubmission[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => {
    // API (Postgres) first; local demo store when the API is unreachable.
    // DB joins arrive as pending providers; device-local joins stay separate.
    fetchAdminProviders().then((live) => {
      setProviders(live ?? getAllProviders());
    });
    fetchAudit().then((live) => {
      setAudit(live ?? getAudit());
    });
    setJoins(getJoinSubmissions());
  }, [tick, user]);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="font-script text-3xl text-blush-500">bosses only ♡</p>
        <h1 className="font-display text-5xl text-plum-900">Admin login needed</h1>
        <p className="mt-2 text-sm font-semibold text-plum-500">
          Log in with the <b>admin</b> tab to approve providers and see payments ✿
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-8 py-2.5 text-sm font-extrabold text-white"
        >
          Go to login ✿
        </Link>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="font-script text-3xl text-blush-500">oopsie ♡</p>
        <h1 className="font-display text-5xl text-plum-900">Admins only</h1>
        <p className="mt-2 text-sm font-semibold text-plum-500">
          You&apos;re logged in as {user.businessName} (provider). Switch to an
          admin account to approve requests.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-6 py-2 text-sm font-extrabold text-white"
          >
            Switch account
          </Link>
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

  const pendingProviders = providers.filter((p) => p.status === "pending");
  const hidden = providers.filter((p) => !isVisible(p, new Date()));

  const decide = async (id: string, status: "approved" | "rejected") => {
    const result = await decideProvider(id, status, user.email);
    if (!result.ok) {
      if (!result.offline) {
        return;
      }
      setProviderStatus(id, status, user.email);
    }
    refresh();
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-script text-3xl text-blush-500">boss babe mode ♡</p>
          <h1 className="font-display text-5xl leading-none text-plum-900">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm font-semibold text-plum-500">
            logged in as {user.email} · every action is audit-logged ✿
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-blush-200 bg-white px-4 py-1.5 text-xs font-extrabold text-plum-700"
        >
          Log out
        </button>
      </div>

      <h2 className="mt-8 font-display text-3xl text-plum-900">
        pending approval ({pendingProviders.length + joins.length}) ✿
      </h2>
      {pendingProviders.length === 0 && joins.length === 0 && (
        <p className="mt-2 font-script text-2xl text-plum-500">
          all caught up, pretty ♡
        </p>
      )}
      <div className="mt-2 space-y-2">
        {pendingProviders.map((p) => (
          <div
            key={p.id}
            className="card-cute flex items-center justify-between rounded-3xl bg-white p-4 ring-1 ring-blush-100"
          >
            <div>
              <p className="font-display text-2xl leading-none text-plum-900">{p.business_name}</p>
              <p className="text-xs font-bold text-plum-500">{p.category} · {p.location}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => decide(p.id, "approved")}
                className="rounded-full bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-1.5 text-xs font-extrabold text-white"
              >
                Approve ♡
              </button>
              <button
                onClick={() => decide(p.id, "rejected")}
                className="rounded-full bg-plum-900 px-4 py-1.5 text-xs font-extrabold text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {joins.map((s) => (
          <div
            key={s.id}
            className="card-cute flex items-center justify-between rounded-3xl bg-white p-4 ring-1 ring-violet-200"
          >
            <div>
              <p className="font-display text-2xl leading-none text-plum-900">{s.business_name}</p>
              <p className="text-xs font-bold text-plum-500">
                ✿ via join form · {s.category} · {s.location} · {s.phone}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { approveSubmission(s, user.email); refresh(); }}
                className="rounded-full bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-1.5 text-xs font-extrabold text-white"
              >
                Approve ♡
              </button>
              <button
                onClick={() => { rejectSubmission(s, user.email); refresh(); }}
                className="rounded-full bg-plum-900 px-4 py-1.5 text-xs font-extrabold text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-display text-3xl text-plum-900">
        hidden from public ({hidden.length}) ♡
      </h2>
      <p className="text-xs font-semibold text-plum-500">Pending, rejected, or expired subscription — never shown on the public feed.</p>
      <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-plum-700">
        {hidden.map((p) => (
          <li key={p.id}>{p.business_name} — {p.status}</li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-3xl text-plum-900">audit trail ✿</h2>
      {audit.length === 0 ? (
        <p className="mt-1 text-sm font-semibold text-plum-500">
          No admin actions yet — approve or reject someone above ♡
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {audit.map((a, i) => (
            <li
              key={`${a.at}-${i}`}
              className="rounded-2xl bg-white px-4 py-2 text-xs font-bold text-plum-700 ring-1 ring-blush-100"
            >
              {fmt(a.at)} · {a.admin} · <span className="text-blush-600">{a.action}</span> · {a.target}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 font-display text-3xl text-plum-900">payments ♡</h2>
      <p className="text-sm font-semibold text-plum-500">
        Every M-Pesa attempt is recorded with a unique reference; duplicates are
        marked without extending. History is preserved, never deleted.
      </p>
    </main>
  );
}
