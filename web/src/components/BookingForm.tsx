"use client";

import { appointmentSchema } from "@/lib/validation";
import { createAppointment } from "@/lib/appointments";
import { postBooking } from "@/lib/api";
import { useToast } from "@/components/Toast";

const input =
  "w-full rounded-2xl border border-blush-200 bg-white px-4 py-2.5 text-sm font-semibold text-plum-900 outline-none focus:border-blush-400 focus:ring-2 focus:ring-blush-200";

export default function BookingForm({
  providerId,
  gradient,
}: {
  providerId: string;
  gradient: string;
  accent: string;
}) {
  const toast = useToast();
  // Earliest pickable day, set after mount via ref: Date.now() in render
  // would differ server vs client (hydration mismatch). No re-render needed.
  const setMinToday = (el: HTMLInputElement | null) => {
    if (el && !el.min) el.min = new Date().toISOString().slice(0, 10);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const date = String(fd.get("date") ?? "");
    const time = String(fd.get("time") ?? "");
    const parsed = appointmentSchema.safeParse({
      provider_id: providerId,
      customer_name: String(fd.get("customer_name") ?? ""),
      customer_phone: String(fd.get("customer_phone") ?? ""),
      starts_at: new Date(`${date}T${time}`).toISOString(),
      notes: String(fd.get("notes") ?? ""),
    });
    if (!parsed.success) {
      toast(parsed.error.issues.map((i) => i.message).join(" "), "oops");
      return;
    }
    // API (Postgres) first; fall back to this device's demo store offline.
    const result = await postBooking(parsed.data);
    if (!result.ok) {
      if (!result.offline) {
        toast(result.error, "oops");
        return;
      }
      createAppointment(parsed.data);
    }
    toast(
      `Booked, pretty! ♡ Your request for ${date} at ${time} was sent. The provider will reach you on your phone.`,
      "ok"
    );
    form.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card-cute mt-3 grid gap-3 rounded-[2rem] bg-white p-6 ring-1 ring-blush-100 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-plum-500">
          No account needed — just your name + phone, and pick a date & time ♡
        </p>
      </div>
      <input name="customer_name" required placeholder="Your name ✿" className={input} />
      <input name="customer_phone" required placeholder="Phone (e.g. 2547…)" className={input} />
      <input
        name="date"
        type="date"
        required
        ref={setMinToday}
        className={input}
      />
      <input name="time" type="time" required className={input} />
      <textarea
        name="notes"
        rows={2}
        placeholder="Notes for the provider (optional) ♡"
        className={`${input} sm:col-span-2`}
      />
      <button
        className={`rounded-full bg-gradient-to-r ${gradient} py-3 text-sm font-extrabold text-white shadow-md hover:opacity-90 sm:col-span-2`}
      >
        Request appointment ✿
      </button>
    </form>
  );
}
