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
  type AuditEntry as DemoAudit,
  type JoinSubmission,
} from "@/lib/providers";
import { getAllAppointments, statusLabel as apptLabel } from "@/lib/appointments";
import { getPayments, type MockPayment } from "@/lib/payments";
import {
  createAdminUser,
  decideProvider,
  deleteAdminUser,
  fetchAdminProviders,
  fetchAdminUsers,
  fetchAllAppointments,
  fetchAudit,
  fetchPayments,
  runExpirySweep,
  setIdVerified,
  type AdminPayment,
  type AdminUserRow,
} from "@/lib/api";
import type { Appointment, Provider, ProviderStatus } from "@/types";

type Tab = "overview" | "providers" | "bookings" | "payments" | "admins" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "providers", label: "Providers" },
  { id: "bookings", label: "Bookings" },
  { id: "payments", label: "Payments" },
  { id: "admins", label: "Admins" },
  { id: "audit", label: "Audit" },
];

const STATUS_STYLE: Record<ProviderStatus | "expired", string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-neutral-200 text-neutral-600",
  suspended: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-800",
};

function effectiveStatus(p: Provider, now = new Date()): ProviderStatus | "expired" {
  if (p.status === "approved" && p.subscription_end && new Date(p.subscription_end) <= now)
    return "expired";
  return p.status;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface BookingRow extends Appointment {
  business_name?: string;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [joins, setJoins] = useState<JoinSubmission[]>([]);
  const [audit, setAudit] = useState<DemoAudit[]>([]);
  const [appts, setAppts] = useState<BookingRow[]>([]);
  const [payments, setPayments] = useState<(AdminPayment | MockPayment)[]>([]);
  const [admins, setAdmins] = useState<AdminUserRow[]>([]);
  const [online, setOnline] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProviderStatus | "expired">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const [sweeping, setSweeping] = useState(false);
  const [sweepMsg, setSweepMsg] = useState<string | null>(null);

  const runSweep = async () => {
    setSweeping(true);
    setSweepMsg(null);
    const r = await runExpirySweep();
    setSweeping(false);
    if (!r.ok) {
      setSweepMsg(r.error);
      return;
    }
    setSweepMsg(
      r.expired === 0
        ? "All clear — nothing past due ♡"
        : `Marked ${r.expired} subscription(s) expired ✿`
    );
    refresh();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      // API-first, demo-store fallback (same pattern as the rest of the app).
      const live = await fetchAdminProviders();
      if (!alive) return;
      if (live) {
        setProviders(live);
        setJoins([]);
        setOnline(true);
      } else {
        setProviders(getAllProviders());
        setJoins(getJoinSubmissions());
        setOnline(false);
      }
      const liveAppts = await fetchAllAppointments();
      if (!alive) return;
      setAppts(liveAppts ?? getAllAppointments());
      const livePay = await fetchPayments();
      if (!alive) return;
      setPayments(livePay ?? getPayments());
      const liveAudit = await fetchAudit();
      if (!alive) return;
      setAudit(liveAudit ?? getAudit());
      const liveAdmins = await fetchAdminUsers();
      if (!alive) return;
      setAdmins(liveAdmins ?? []);
    })();
    return () => {
      alive = false;
    };
  }, [tick, user]);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="font-script text-3xl text-blush-500">bosses only ♡</p>
        <h1 className="font-display text-5xl text-plum-900">Admin login needed</h1>
        <p className="mt-2 text-sm font-semibold text-plum-500">
          Log in with an admin account to open your console ✿
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
          You&apos;re logged in as {user.businessName} (provider).
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-6 py-2 text-sm font-extrabold text-white"
          >
            Switch account
          </Link>
          <button
            onClick={() => void logout()}
            className="rounded-full border border-blush-200 bg-white px-6 py-2 text-sm font-extrabold text-plum-700"
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  const now = new Date();
  const live = providers.filter((p) => isVisible(p, now));
  const pendingCount =
    providers.filter((p) => p.status === "pending").length + joins.length;
  const suspended = providers.filter((p) => p.status === "suspended");
  const awaitingBookings = appts.filter(
    (a) => a.status === "pending" || a.status === "rescheduled"
  );
  const nameOf = (a: BookingRow) =>
    a.business_name ?? providers.find((p) => p.id === a.provider_id)?.business_name ?? a.provider_id;

  const filteredProviders = providers.filter((p) => {
    if (statusFilter !== "all" && effectiveStatus(p, now) !== statusFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [p.business_name, p.location, p.category, p.phone]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const decide = async (id: string, status: "approved" | "rejected" | "suspended") => {
    const res = await decideProvider(id, status, user.email);
    if (!res.ok && res.offline) setProviderStatus(id, status, user.email);
    refresh();
  };

  // Blue tick has no demo-store equivalent — offline it silently no-ops.
  const flipVerified = async (id: string, current: boolean) => {
    await setIdVerified(id, !current);
    refresh();
  };

  const submitAdmin = async () => {
    const res = await createAdminUser({
      name: newName,
      email: newEmail,
      password: newPass,
    });
    if (!res.ok) {
      setAdminMsg(res.error);
      return;
    }
    setNewName("");
    setNewEmail("");
    setNewPass("");
    setAdminMsg(`♡ ${newEmail.trim().toLowerCase()} is now an admin.`);
    refresh();
  };

  const dropAdmin = async (id: string, email: string) => {
    const res = await deleteAdminUser(id);
    setAdminMsg(res.ok ? `Removed ${email}.` : res.error);
    refresh();
  };

  const stat = "rounded-3xl bg-white p-4 ring-1 ring-blush-100 text-center";
  const statNum = "font-display text-4xl text-plum-900";
  const statLbl = "text-xs font-extrabold uppercase tracking-widest text-plum-500";
  const btn = "rounded-full px-4 py-1.5 text-xs font-extrabold text-white disabled:opacity-50";
  const input =
    "rounded-2xl border border-blush-200 bg-blush-50/50 px-4 py-2 text-sm font-semibold text-plum-900 outline-none focus:border-blush-400";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-script text-3xl text-blush-500">boss babe mode ♡</p>
          <h1 className="font-display text-5xl leading-none text-plum-900">
            Admin console
          </h1>
          <p className="mt-1 text-sm font-semibold text-plum-500">
            {user.email} · {online ? "live database ✿" : "demo mode (DB unreachable) ♡"} · everything centralizes here
          </p>
        </div>
        <button
          onClick={() => void logout()}
          className="rounded-full border border-blush-200 bg-white px-4 py-1.5 text-xs font-extrabold text-plum-700"
        >
          Log out
        </button>
      </div>

      <nav className="sticky top-16 z-10 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-[#FFFAF7]/95 px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-extrabold ${
              tab === t.id
                ? "bg-gradient-to-r from-violet-400 to-fuchsia-500 text-white shadow"
                : "border border-blush-200 bg-white text-plum-700"
            }`}
          >
            {t.label}
            {t.id === "providers" && pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-white/90 px-1.5 text-[11px] text-fuchsia-700">
                {pendingCount}
              </span>
            )}
            {t.id === "bookings" && awaitingBookings.length > 0 && (
              <span className="ml-1 rounded-full bg-white/90 px-1.5 text-[11px] text-fuchsia-700">
                {awaitingBookings.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <section>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className={stat}><p className={statNum}>{providers.length}</p><p className={statLbl}>Providers</p></div>
            <div className={stat}><p className={statNum}>{live.length}</p><p className={statLbl}>Live</p></div>
            <div className={stat}><p className={statNum}>{pendingCount}</p><p className={statLbl}>Pending</p></div>
            <div className={stat}><p className={statNum}>{suspended.length}</p><p className={statLbl}>Suspended</p></div>
            <div className={stat}><p className={statNum}>{awaitingBookings.length}</p><p className={statLbl}>Bookings open</p></div>
            <div className={stat}><p className={statNum}>{payments.length}</p><p className={statLbl}>Payments</p></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={runSweep}
              disabled={sweeping}
              className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-2 text-sm font-extrabold text-white shadow-md shadow-orange-200 hover:opacity-90 disabled:opacity-50"
            >
              {sweeping ? "Checking…" : "Run expiry check ✿"}
            </button>
            {sweepMsg && (
              <p className="text-sm font-bold text-plum-700">{sweepMsg}</p>
            )}
          </div>
          <h2 className="mt-8 font-display text-3xl text-plum-900">latest activity ✿</h2>
          {audit.length === 0 ? (
            <p className="mt-1 text-sm font-semibold text-plum-500">Nothing yet — approve someone ♡</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {audit.slice(0, 5).map((a, i) => (
                <li key={`${a.at}-${i}`} className="rounded-2xl bg-white px-4 py-2 text-xs font-bold text-plum-700 ring-1 ring-blush-100">
                  {fmt(a.at)} · {a.admin} · <span className="text-blush-600">{a.action}</span> · {a.target}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "providers" && (
        <section>
          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, place, phone… ♡"
              className={`${input} w-full`}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", "pending", "approved", "expired", "suspended", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-1 text-xs font-extrabold capitalize ${
                  statusFilter === s
                    ? "bg-plum-900 text-white"
                    : "border border-blush-200 bg-white text-plum-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {filteredProviders.length === 0 && (
              <p className="font-script text-2xl text-plum-500">no providers match, pretty ♡</p>
            )}
            {filteredProviders.map((p) => {
              const st = effectiveStatus(p, now);
              const open = expanded === p.id;
              return (
                <div key={p.id} className="rounded-3xl bg-white p-4 ring-1 ring-blush-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button onClick={() => setExpanded(open ? null : p.id)} className="text-left">
                      <p className="font-display text-2xl leading-none text-plum-900">
                        {p.business_name}
                        {p.id_verified && (
                          <span className="ml-1 align-middle text-lg text-sky-500" title="ID verified">
                            ✔
                          </span>
                        )}{" "}
                        {open ? "▾" : "▸"}
                      </p>
                      <p className="text-xs font-bold text-plum-500">
                        {p.category} · {p.location} · ★ {Number(p.rating).toFixed(1)}
                      </p>
                    </button>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${STATUS_STYLE[st]}`}>
                      {st}
                    </span>
                  </div>
                  {open && (
                    <div className="mt-3 border-t border-blush-100 pt-3 text-sm">
                      <p className="font-semibold text-plum-700">{p.bio || "—"}</p>
                      <p className="mt-1 text-xs font-bold text-plum-500">
                        {p.phone} · {p.whatsapp} · {p.instagram || "no instagram"} · sub till {fmtDate(p.subscription_end)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-plum-500">
                        {p.services.length} services · {p.portfolio.length} portfolio photos
                      </p>
                      {!!p.id_document_url && (
                        <p className="mt-1 text-xs">
                          <a
                            href={`/api/id-docs/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-extrabold text-sky-600 underline"
                          >
                            View submitted ID ⧉
                          </a>
                          <span className="ml-2 font-bold text-plum-500">
                            {p.id_verified ? "✔ verified" : "awaiting your check"}
                          </span>
                        </p>
                      )}
                      {isVisible(p, now) && (
                        <Link href={`/p/${p.id}`} className="mt-1 inline-block text-xs font-extrabold text-blush-600 underline">
                          View public page →
                        </Link>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(p.status === "pending" || p.status === "rejected") && (
                          <button onClick={() => void decide(p.id, "approved")} className={`${btn} bg-gradient-to-r from-emerald-400 to-green-500`}>
                            Approve ♡
                          </button>
                        )}
                        {p.status === "approved" && (
                          <button onClick={() => void decide(p.id, "suspended")} className={`${btn} bg-red-500`}>
                            Suspend
                          </button>
                        )}
                        {p.status === "suspended" && (
                          <button onClick={() => void decide(p.id, "approved")} className={`${btn} bg-gradient-to-r from-emerald-400 to-green-500`}>
                            Reactivate ♡
                          </button>
                        )}
                        {p.status !== "rejected" && (
                          <button onClick={() => void decide(p.id, "rejected")} className={`${btn} bg-plum-900`}>
                            Reject
                          </button>
                        )}
                        <button onClick={() => void flipVerified(p.id, p.id_verified)} className={`${btn} bg-sky-500`}>
                          {p.id_verified ? "Unverify" : "Verify ✓"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {joins.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-3xl text-plum-900">join requests ({joins.length}) ✿</h2>
              <p className="text-xs font-semibold text-plum-500">Demo-mode requests (the live DB stores joins as pending providers above).</p>
              <div className="mt-2 space-y-2">
                {joins.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-white p-4 ring-1 ring-violet-200">
                    <div>
                      <p className="font-display text-2xl leading-none text-plum-900">{s.business_name}</p>
                      <p className="text-xs font-bold text-plum-500">✿ via join · {s.category} · {s.location} · {s.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { approveSubmission(s, user.email); refresh(); }} className={`${btn} bg-gradient-to-r from-emerald-400 to-green-500`}>Approve ♡</button>
                      <button onClick={() => { rejectSubmission(s, user.email); refresh(); }} className={`${btn} bg-plum-900`}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "bookings" && (
        <section>
          <h2 className="mt-4 font-display text-3xl text-plum-900">
            all bookings ({appts.length}) ♡
          </h2>
          {appts.length === 0 && (
            <p className="mt-1 font-script text-2xl text-plum-500">no bookings yet ♡</p>
          )}
          <ul className="mt-2 space-y-2">
            {appts.map((a) => (
              <li key={a.id} className="rounded-3xl bg-white p-4 ring-1 ring-blush-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-plum-900">
                    {a.customer_name} <span className="font-semibold text-plum-500">→ {nameOf(a)}</span>
                  </p>
                  <span className="rounded-full bg-blush-50 px-3 py-1 text-[11px] font-extrabold text-plum-700">
                    {apptLabel(a.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-extrabold text-plum-900">♡ {fmt(a.starts_at)}</p>
                {a.proposed_starts_at && (
                  <p className="text-sm font-bold text-violet-600">✿ proposed {fmt(a.proposed_starts_at)}</p>
                )}
                <p className="text-xs font-semibold text-plum-500">{a.customer_phone}{a.notes ? ` · “${a.notes}”` : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "payments" && (
        <section>
          <h2 className="mt-4 font-display text-3xl text-plum-900">
            M-Pesa attempts ({payments.length}) ♡
          </h2>
          <p className="text-xs font-semibold text-plum-500">
            Every STK push is recorded server-side — duplicates never extend twice.
          </p>
          {payments.length === 0 && (
            <p className="mt-2 font-script text-2xl text-plum-500">no payments logged yet ♡</p>
          )}
          <ul className="mt-2 space-y-2">
            {payments.map((m) => {
              const ref = "transaction_reference" in m ? m.transaction_reference : m.ref;
              const biz =
                "business_name" in m && m.business_name
                  ? m.business_name
                  : providers.find((p) => p.id === m.provider_id)?.business_name ?? m.provider_id;
              const phone = "phone_msisdn" in m ? m.phone_msisdn : m.phone;
              return (
                <li key={ref} className="rounded-3xl bg-white p-4 ring-1 ring-blush-100 text-sm">
                  <p className="font-extrabold text-plum-900">
                    KES {m.amount_kes.toLocaleString()} · {biz}
                  </p>
                  <p className="text-xs font-semibold text-plum-500">
                    {ref} · {phone} · {m.status} · {fmt(m.created_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === "admins" && (
        <section>
          <h2 className="mt-4 font-display text-3xl text-plum-900">
            admin users ({admins.length || "…"}) ✿
          </h2>
          {!online && (
            <p className="mt-1 text-sm font-bold text-blush-600">
              Admin management needs the live database connection ♡
            </p>
          )}
          <ul className="mt-2 space-y-2">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-white p-4 ring-1 ring-blush-100">
                <div>
                  <p className="font-bold text-plum-900">
                    {a.display_name || "Admin"}{" "}
                    {a.email === user.email && <span className="text-blush-600">(you ♡)</span>}
                  </p>
                  <p className="text-xs font-semibold text-plum-500">{a.email}</p>
                </div>
                <button
                  onClick={() => void dropAdmin(a.id, a.email)}
                  className={`${btn} bg-plum-900`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-violet-200">
            <p className="font-display text-2xl text-plum-900">add admin ♡</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className={input} />
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className={input} />
              <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Password (4+ chars)" type="password" className={input} />
            </div>
            <button onClick={() => void submitAdmin()} className={`${btn} mt-2 bg-gradient-to-r from-violet-400 to-fuchsia-500`}>
              Add admin ✿
            </button>
            {adminMsg && <p className="mt-2 text-sm font-bold text-plum-700">{adminMsg}</p>}
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section>
          <h2 className="mt-4 font-display text-3xl text-plum-900">audit trail ✿</h2>
          {audit.length === 0 ? (
            <p className="mt-1 text-sm font-semibold text-plum-500">No admin actions yet ♡</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {audit.map((a, i) => (
                <li key={`${a.at}-${i}`} className="rounded-2xl bg-white px-4 py-2 text-xs font-bold text-plum-700 ring-1 ring-blush-100">
                  {fmt(a.at)} · {a.admin} · <span className="text-blush-600">{a.action}</span> · {a.target}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
