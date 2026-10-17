"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PRICE_KES, type Appointment } from "@/types";
import { useAuth } from "@/lib/auth";
import {
  decideAppointment,
  getAppointments,
  statusLabel,
} from "@/lib/appointments";
import {
  createPost,
  decideBooking,
  deletePhoto,
  deletePost,
  fetchAppointments,
  fetchIdStatus,
  fetchMyPayments,
  fetchPhotos,
  fetchPosts,
  updateAccount,
  updatePost,
  uploadIdDocument,
  uploadPhoto,
  type DecisionInput,
  type FeedPost,
  type IdStatus,
  type MyPayment,
  type PortfolioPhoto,
} from "@/lib/api";
import YearCalendar, { type DayMark } from "@/components/YearCalendar";
import { dayKey } from "@/lib/calendar";
import { recordPayment } from "@/lib/payments";
import { useToast } from "@/components/Toast";

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
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos(providerId).then((live) => {
      if (live) setPhotos(live);
    });
  }, [providerId]);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast("Choose a photo first ♡", "oops");
      return;
    }
    setBusy(true);
    const result = await uploadPhoto(providerId, file, caption);
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "oops");
      return;
    }
    setPhotos((prev) => [...prev, result.photo]);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    toast("Photo added ✿", "ok");
  };

  const remove = async (id: string) => {
    const result = await deletePhoto(id);
    if (!result.ok) {
      toast(result.error, "oops");
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast("Photo removed.", "ok");
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
    </div>
  );
}

function IdSection({ providerId }: { providerId: string }) {
  const [status, setStatus] = useState<IdStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchIdStatus(providerId).then((live) => {
      if (live) setStatus(live);
    });
  }, [providerId]);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast("Choose a photo of your ID first ♡", "oops");
      return;
    }
    setBusy(true);
    const result = await uploadIdDocument(providerId, file);
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "oops");
      return;
    }
    const live = await fetchIdStatus(providerId);
    if (live) setStatus(live);
    if (fileRef.current) fileRef.current.value = "";
    toast("ID received ✿ An admin will check it soon.", "ok");
  };

  // Offline (no API): ID review needs the server, so stay hidden.
  if (!status) return null;

  return (
    <div className="mt-8 rounded-[2rem] bg-white p-6 ring-1 ring-blush-100">
      <h2 className="font-display text-3xl text-plum-900">
        ID check{" "}
        <span className="font-script text-blush-600">· earn your ✔</span>
      </h2>
      {status.id_verified ? (
        <p className="mt-1 text-sm font-bold text-plum-700">
          <span className="text-sky-500">✔</span> Verified — customers see
          your blue tick. Uploading a new ID restarts the check.
        </p>
      ) : status.submitted ? (
        <p className="mt-1 text-sm font-semibold text-plum-500">
          With the admin for review ♡ Uploading again replaces it.
        </p>
      ) : (
        <p className="mt-1 text-sm font-semibold text-plum-500">
          Upload a clear photo of your national ID or passport. An admin
          reviews it privately (never shown publicly), then your blue tick
          appears. JPG, PNG or WEBP, ≤5MB.
        </p>
      )}
      <div className="mt-3 flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-xs font-bold text-plum-700 file:mr-3 file:rounded-full file:border-0 file:bg-blush-100 file:px-4 file:py-1.5 file:text-xs file:font-extrabold file:text-plum-700"
          />
          <button
            onClick={upload}
            disabled={busy}
            className="shrink-0 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 px-5 py-2 text-sm font-extrabold text-white shadow-md shadow-sky-200 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Sending…" : status.submitted ? "Replace ID" : "Submit ID ✿"}
          </button>
        </div>
    </div>
  );
}

function FeedTab({ providerId }: { providerId: string }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchPosts(providerId).then((live) => {
      if (live) setPosts(live);
    });
  }, [providerId]);

  const publish = async () => {
    if (!draft.trim()) {
      toast("Write something first ♡", "oops");
      return;
    }
    setBusy(true);
    const result = await createPost(providerId, draft.trim());
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "oops");
      return;
    }
    setPosts((prev) => [result.post, ...prev]);
    setDraft("");
    toast("Posted ✿ Customers see it on your page.", "ok");
  };

  const startEdit = (post: FeedPost) => {
    setEditingId(post.id);
    setEditBody(post.body);
  };

  const saveEdit = async () => {
    if (!editingId || !editBody.trim()) {
      toast("Write something first ♡", "oops");
      return;
    }
    const result = await updatePost(editingId, editBody.trim());
    if (!result.ok) {
      toast(result.error, "oops");
      return;
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, body: editBody.trim() } : p))
    );
    setEditingId(null);
    setEditBody("");
    toast("Edit saved ✿", "ok");
  };

  const remove = async (id: string) => {
    const result = await deletePost(id);
    if (!result.ok) {
      toast(result.error, "oops");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast("Post deleted.", "ok");
  };

  return (
    <div>
      <div className="rounded-[2rem] bg-white p-6 ring-1 ring-blush-100">
        <h2 className="font-display text-3xl text-plum-900">
          new update{" "}
          <span className="font-script text-blush-600">· say hi ♡</span>
        </h2>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What’s new? A look you loved, festive slots, a cake you’re proud of… ♡"
          rows={3}
          maxLength={1000}
          className="mt-3 w-full rounded-2xl border border-blush-200 bg-blush-50/50 px-4 py-2.5 text-sm font-semibold text-plum-900 outline-none focus:border-blush-400"
        />
        <button
          onClick={publish}
          disabled={busy}
          className="mt-2 rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 px-5 py-2 text-sm font-extrabold text-white shadow-md shadow-pink-200 hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post update ✿"}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {posts.length === 0 && (
          <p className="font-script text-2xl text-plum-500">
            nothing posted yet — your page shows the portfolio instead ♡
          </p>
        )}
        {posts.map((p) => (
          <article
            key={p.id}
            className="rounded-3xl bg-white p-5 ring-1 ring-blush-100"
          >
            {editingId === p.id ? (
              <>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-2xl border border-blush-200 bg-blush-50/50 px-4 py-2.5 text-sm font-semibold text-plum-900 outline-none focus:border-blush-400"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="rounded-full bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-1.5 text-xs font-extrabold text-white"
                  >
                    Save ✿
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-full border border-blush-200 px-4 py-1.5 text-xs font-extrabold text-plum-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-plum-900">{p.body}</p>
                <p className="mt-1 text-xs font-bold text-plum-500">
                  {new Date(p.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-full border border-blush-200 px-4 py-1 text-xs font-extrabold text-plum-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded-full border border-blush-200 px-4 py-1 text-xs font-extrabold text-blush-600"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({
  appts,
  providerId,
  onChanged,
}: {
  appts: Appointment[];
  providerId: string;
  onChanged: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {};
    for (const a of appts) {
      if (a.status === "cancelled" || a.status === "declined") continue;
      const key = dayKey(new Date(a.starts_at));
      m[key] ??= { accepted: [], pending: 0 };
      if (a.status === "accepted") {
        m[key].accepted.push(a.customer_name.split(" ")[0] || "Customer");
      } else {
        m[key].pending += 1;
      }
    }
    return m;
  }, [appts]);

  const upcoming = appts.filter(
    (a) => a.status === "pending" || a.status === "rescheduled"
  );
  const dayAppts = selected
    ? appts.filter(
        (a) =>
          dayKey(new Date(a.starts_at)) === selected &&
          a.status !== "cancelled" &&
          a.status !== "declined"
      )
    : [];

  return (
    <div>
      <h2 className="font-display text-3xl text-plum-900">
        your year{" "}
        <span className="font-script text-blush-600">· booked in green ✿</span>
      </h2>
      <div className="mt-3 rounded-[2rem] bg-white p-4 ring-1 ring-blush-100 sm:p-6">
        <YearCalendar marks={marks} selected={selected} onSelect={setSelected} />
      </div>
      {selected && (
        <div className="mt-3">
          <h3 className="font-display text-2xl text-plum-900">
            {new Date(`${selected}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          {dayAppts.length === 0 ? (
            <p className="mt-1 font-script text-2xl text-plum-500">
              free as a bird ♡
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              {dayAppts.map((a) => (
                <AppointmentCard key={a.id} appt={a} onChange={onChanged} />
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="mt-8 font-display text-3xl text-plum-900">
        awaiting you{" "}
        <span className="rounded-full bg-blush-100 px-2.5 py-0.5 align-middle font-body text-xs font-extrabold text-blush-700">
          {upcoming.length}
        </span>
      </h2>
      {upcoming.length === 0 && (
        <p className="mt-2 font-script text-2xl text-plum-500">
          no bookings yet, pretty… share your page link ♡
        </p>
      )}
      <div className="mt-3 space-y-3">
        {upcoming.map((a) => (
          <AppointmentCard key={a.id} appt={a} onChange={onChanged} />
        ))}
      </div>

      <PortfolioSection providerId={providerId} />
      <IdSection providerId={providerId} />
    </div>
  );
}

function PaymentsTab({ providerId }: { providerId: string }) {
  const [phone, setPhone] = useState("2547XXXXXXXX");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<MyPayment[]>([]);
  const toast = useToast();

  useEffect(() => {
    fetchMyPayments(providerId).then((live) => {
      if (live) setAttempts(live);
    });
  }, [providerId]);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          phone_msisdn: phone,
          amount_kes: SUBSCRIPTION_PRICE_KES,
        }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error ?? "Payment failed to start.", "oops");
      else {
        try {
          recordPayment({
            ref: String(data.transaction_reference),
            provider_id: providerId,
            amount_kes: SUBSCRIPTION_PRICE_KES,
            phone,
            status: "initiated",
          });
        } catch {
          /* demo log unavailable */
        }
        toast(
          `STK push sent (ref ${data.transaction_reference}) ♡ Enter your M-Pesa PIN on ${phone}. Subscription activates only after confirmed callback — never trust this screen alone.`,
          "ok"
        );
        const live = await fetchMyPayments(providerId);
        if (live) setAttempts(live);
      }
    } catch {
      toast("Network error starting payment.", "oops");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="card-cute rounded-[2rem] bg-white p-6 ring-1 ring-blush-100">
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
      </div>
      <h2 className="mt-8 font-display text-3xl text-plum-900">
        my payments <span className="font-script text-blush-600">✿</span>
      </h2>
      {attempts.length === 0 ? (
        <p className="mt-2 font-script text-2xl text-plum-500">
          no payments yet — your history lands here ♡
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {attempts.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-blush-100"
            >
              <div>
                <p className="text-sm font-extrabold text-plum-900">
                  KES {p.amount_kes.toLocaleString()} · {p.phone_msisdn}
                </p>
                <p className="text-xs font-bold text-plum-500">
                  {p.transaction_reference}
                  {p.mpesa_receipt ? ` · receipt ${p.mpesa_receipt}` : ""} ·{" "}
                  {new Date(p.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${
                  p.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : p.status === "initiated"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.businessName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const save = async () => {
    const input: { display_name?: string; email?: string; phone?: string } = {};
    if (name.trim() && name.trim() !== user?.businessName)
      input.display_name = name.trim();
    if (email.trim() && email.trim().toLowerCase() !== user?.email)
      input.email = email.trim();
    if (phone.trim()) input.phone = phone.trim();
    if (Object.keys(input).length === 0) {
      toast("Nothing changed ♡", "info");
      return;
    }
    setBusy(true);
    const result = await updateAccount(input);
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "oops");
      return;
    }
    setPhone("");
    toast("Saved ✿ Your new details apply right away (name shows after re-login).", "ok");
  };

  const field =
    "w-full rounded-full border border-blush-200 bg-blush-50/50 px-4 py-2 text-sm font-bold text-plum-900 outline-none focus:border-blush-400";

  return (
    <div className="rounded-[2rem] bg-white p-6 ring-1 ring-blush-100">
      <h2 className="font-display text-3xl text-plum-900">
        settings <span className="font-script text-blush-600">· your details ♡</span>
      </h2>
      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="text-xs font-extrabold uppercase tracking-widest text-plum-500">
            Display name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 ${field}`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-extrabold uppercase tracking-widest text-plum-500">
            Login email
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 ${field}`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-extrabold uppercase tracking-widest text-plum-500">
            Contact phone (shown to customers)
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 2547XXXXXXXX"
            className={`mt-1 ${field}`}
          />
        </label>
        <button
          onClick={save}
          disabled={busy}
          className="mt-1 rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-pink-200 hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes ✿"}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {  const { user, logout } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<"feed" | "profile" | "payments" | "settings">(
    "feed"
  );

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

  const TABS = [
    { id: "feed", label: "Feed ✿" },
    { id: "profile", label: "Profile" },
    { id: "payments", label: "My payments" },
    { id: "settings", label: "Settings" },
  ] as const;

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

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-extrabold ${
              tab === t.id
                ? "bg-gradient-to-r from-blush-400 to-fuchsia-400 text-white shadow-md shadow-pink-200"
                : "border border-blush-200 bg-white text-plum-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "feed" && <FeedTab providerId={user.providerId} />}
        {tab === "profile" && (
          <ProfileTab
            appts={appts}
            providerId={user.providerId}
            onChanged={reload}
          />
        )}
        {tab === "payments" && <PaymentsTab providerId={user.providerId} />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </main>
  );
}
