"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PRICE_KES, type Appointment } from "@/types";
import { useAuth } from "@/lib/auth";
import {
  decideAppointment,
  getAppointments,
  statusLabel,
} from "@/lib/appointments";
import {
  decideBooking,
  deletePhoto,
  fetchAppointments,
  fetchPhotos,
  uploadPhoto,
  type DecisionInput,
  type PortfolioPhoto,
} from "@/lib/api";
import { recordPayment } from "@/lib/payments";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AppointmentCard({
  appt,
  onChange,
}: {
  appt: Appointment;
  onChange: () => void;
}) {
  const [propose, setPropose] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // API (Postgres) first; fall back to this device's demo store offline.
  const act = async (
    kind: "accept" | "decline" | "confirm_new_time" | "cancel"
  ) => {
    setErr(null);
    const result = await decideBooking(appt.id, { kind });
    if (!result.ok) {
      if (!result.offline) {
        setErr(result.error);
        return;
      }
      decideAppointment(appt.id, { kind });
    }
    onChange();
  };

  const sendProposal = async () => {
    if (!propose) return;
    const iso = new Date(propose).toISOString();
    if (Date.parse(iso) <= Date.now()) return;
    setErr(null);
    const decision: DecisionInput = {
      kind: "propose",
      proposed_starts_at: iso,
    };
    const result = await decideBooking(appt.id, decision);
    if (!result.ok) {
      if (!result.offline) {
        setErr(result.error);
        return;
      }
      decideAppointment(appt.id, decision);
    }
    setPropose("");
    onChange();
  };

  const pending = appt.status === "pending" || appt.status === "rescheduled";

  return (
    <div className="rounded-3xl bg-white p-4 ring-1 ring-blush-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl leading-none text-plum-900">
            {appt.customer_name}
          </p>
          <p className="text-xs font-bold text-plum-500">{appt.customer_phone}</p>
        </div>
        <span className="shrink-0 rounded-full bg-blush-50 px-3 py-1 text-[11px] font-extrabold text-plum-700">
          {statusLabel(appt.status)}
        </span>
      </div>
      <p className="mt-2 text-sm font-extrabold text-plum-900">♡ {fmt(appt.starts_at)}</p>
      {appt.status === "rescheduled" && appt.proposed_starts_at && (
        <p className="text-sm font-extrabold text-violet-600">
          ✿ you proposed {fmt(appt.proposed_starts_at)} — awaiting customer
        </p>
      )}
      {appt.notes && (
        <p className="mt-1 text-sm font-semibold text-plum-500">“{appt.notes}”</p>
      )}
      {pending && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => act("accept")}
            className="rounded-full bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-1.5 text-xs font-extrabold text-white"
          >
            Accept ✿
          </button>
          <button
            onClick={() => act("decline")}
            className="rounded-full bg-plum-900 px-4 py-1.5 text-xs font-extrabold text-white"
          >
            Decline
          </button>
          <button
            onClick={() => act("cancel")}
            className="rounded-full border border-blush-200 px-4 py-1.5 text-xs font-extrabold text-plum-700"
          >
            Cancel
          </button>
        </div>
      )}
      {pending && (
        <div className="mt-2 flex gap-2">
          <input
            type="datetime-local"
            value={propose}
            onChange={(e) => setPropose(e.target.value)}
            className="w-full rounded-full border border-blush-200 px-3 py-1.5 text-xs font-bold text-plum-900 outline-none focus:border-blush-400"
          />
          <button
            onClick={sendProposal}
            disabled={!propose}
            className="shrink-0 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-4 py-1.5 text-xs font-extrabold text-white disabled:opacity-50"
          >
            Propose new time ♡
          </button>
        </div>
      )}
      {err && <p className="mt-2 text-xs font-bold text-blush-600">{err}</p>}
    </div>
  );
}

function PortfolioSection({ providerId }: { providerId: string }) {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos(providerId).then((live) => {
      if (live) setPhotos(live);
    });
  }, [providerId]);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setNote("Choose a photo first ♡");
      return;
    }
    setBusy(true);
    setNote(null);
    const result = await uploadPhoto(providerId, file, caption);
    setBusy(false);
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    setPhotos((prev) => [...prev, result.photo]);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    setNote("Photo added ✿");
  };

  const remove = async (id: string) => {
    const result = await deletePhoto(id);
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="mt-8 rounded-[2rem] bg-white p-6 ring-1 ring-blush-100">
      <h2 className="font-display text-3xl text-plum-900">
        portfolio{" "}
        <span className="font-script text-blush-600">· show your work ♡</span>
      </h2>
      <p className="mt-1 text-sm font-semibold text-plum-500">
        Your first photo becomes your cover + avatar. JPG, PNG or WEBP, ≤5MB,
        max 24.
      </p>
      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative overflow-hidden rounded-2xl ring-1 ring-blush-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url}
                alt={p.caption || "portfolio photo"}
                className="aspect-square w-full object-cover"
              />
              <button
                onClick={() => remove(p.id)}
                aria-label="Delete photo"
                className="absolute right-1 top-1 rounded-full bg-plum-900/80 px-2 py-0.5 text-xs font-extrabold text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-xs font-bold text-plum-700 file:mr-3 file:rounded-full file:border-0 file:bg-blush-100 file:px-4 file:py-1.5 file:text-xs file:font-extrabold file:text-plum-700"
        />
        <div className="flex gap-2">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional) ♡"
            maxLength={280}
            className="w-full rounded-full border border-blush-200 bg-blush-50/50 px-4 py-2 text-sm font-bold text-plum-900 outline-none focus:border-blush-400"
          />
          <button
            onClick={upload}
            disabled={busy}
            className="shrink-0 rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 px-5 py-2 text-sm font-extrabold text-white shadow-md shadow-pink-200 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add photo ✿"}
          </button>
        </div>
      </div>
      {note && <p className="mt-2 text-sm font-bold text-plum-700">{note}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [phone, setPhone] = useState("2547XXXXXXXX");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.providerId) return;
    const pid = user.providerId;
    fetchAppointments(pid).then((live) => {
      setAppts(live ?? getAppointments(pid));
    });
  }, [user]);

  const reload = () => {
    if (!user?.providerId) return;
    const pid = user.providerId;
    fetchAppointments(pid).then((live) => {
      setAppts(live ?? getAppointments(pid));
    });
  };

  async function pay() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: user?.providerId ?? "glam-by-zawadi",
          phone_msisdn: phone,
          amount_kes: SUBSCRIPTION_PRICE_KES,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Payment failed to start.");
      else {
        // Demo-mode log so the admin console can review test payments.
        // (Server records real attempts in payment_attempts when possible.)
        try {
          recordPayment({
            ref: String(data.transaction_reference),
            provider_id: user?.providerId ?? "glam-by-zawadi",
            amount_kes: SUBSCRIPTION_PRICE_KES,
            phone,
            status: "initiated",
          });
        } catch {
          /* demo log unavailable */
        }
        setMsg(
          `STK push sent (ref ${data.transaction_reference}) ♡ Enter your M-Pesa PIN on ${phone}. Subscription activates only after confirmed callback — never trust this screen alone.`
        );
      }
    } catch {
      setMsg("Network error starting payment.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="font-script text-3xl text-blush-500">shh… providers only ♡</p>
        <h1 className="font-display text-5xl text-plum-900">Log in first</h1>
        <p className="mt-2 text-sm font-semibold text-plum-500">
          Log in to view your appointments and manage your business ✿
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 px-8 py-2.5 text-sm font-extrabold text-white"
        >
          Go to login ✿
        </Link>
      </main>
    );
  }

  const upcoming = appts.filter(
    (a) => a.status === "pending" || a.status === "rescheduled"
  );

  if (!user.providerId) {
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="font-script text-3xl text-blush-500">oopsie ♡</p>
        <h1 className="font-display text-5xl text-plum-900">Provider account needed</h1>
        <p className="mt-2 text-sm font-semibold text-plum-500">
          This dashboard is for providers. Log in with a provider account —
          or head to /admin if you&apos;re an admin.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-script text-3xl text-blush-500">hey gorgeous ♡</p>
          <h1 className="font-display text-4xl leading-none text-plum-900">
            {user.businessName}
          </h1>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-blush-200 bg-white px-4 py-1.5 text-xs font-extrabold text-plum-700"
        >
          Log out
        </button>
      </div>

      <h2 className="mt-8 font-display text-3xl text-plum-900">
        appointments{" "}
        <span className="rounded-full bg-blush-100 px-2.5 py-0.5 align-middle font-body text-xs font-extrabold text-blush-700">
          {upcoming.length} awaiting you
        </span>
      </h2>
      {appts.length === 0 && (
        <p className="mt-2 font-script text-2xl text-plum-500">
          no bookings yet, pretty… share your page link ♡
        </p>
      )}
      <div className="mt-3 space-y-3">
        {appts.map((a) => (
          <AppointmentCard key={a.id} appt={a} onChange={reload} />
        ))}
      </div>

      <PortfolioSection providerId={user.providerId} />

      <div className="card-cute mt-8 rounded-[2rem] bg-white p-6 ring-1 ring-blush-100">
        <h2 className="font-display text-3xl text-plum-900">
          subscription ·{" "}
          <span className="font-script text-blush-600">
            KES {SUBSCRIPTION_PRICE_KES}/month
          </span>
        </h2>
        <p className="mt-1 text-sm font-semibold text-plum-500">
          Status: <span className="font-extrabold text-green-600">Active ✿</span>.
          Expired listings hide automatically.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-full border border-blush-200 bg-blush-50/50 px-4 py-2 text-sm font-bold text-plum-900 outline-none focus:border-blush-400"
          />
          <button
            onClick={pay}
            disabled={loading}
            className="shrink-0 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 px-5 py-2 text-sm font-extrabold text-white shadow-md shadow-green-200 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Pay with M-Pesa ♡"}
          </button>
        </div>
        {msg && <p className="mt-2 text-sm font-bold text-plum-700">{msg}</p>}
      </div>
    </main>
  );
}
