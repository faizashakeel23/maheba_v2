"use client";

import { useState } from "react";
import { providerSchema } from "@/lib/validation";

const input =
  "w-full rounded-2xl border border-blush-200 bg-blush-50/50 px-4 py-2.5 text-sm font-semibold text-plum-900 placeholder:text-plum-500/50 outline-none focus:border-blush-400 focus:ring-2 focus:ring-blush-200";

export default function JoinPage() {
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = providerSchema.safeParse({
      business_name: String(fd.get("business_name") ?? ""),
      category: String(fd.get("category") ?? ""),
      location: String(fd.get("location") ?? ""),
      bio: String(fd.get("bio") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      whatsapp: String(fd.get("whatsapp") ?? ""),
      instagram: String(fd.get("instagram") ?? ""),
    });
    if (!parsed.success) {
      setMsg(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    const pending = JSON.parse(localStorage.getItem("maheba_pending") ?? "[]");
    pending.push({ ...parsed.data, id: `pending-${Date.now()}`, status: "pending" });
    localStorage.setItem("maheba_pending", JSON.stringify(pending));
    setMsg(
      "Yay, submitted! ♡ Your profile is pending approval. You'll appear publicly only after approval + paid subscription."
    );
    (e.target as HTMLFormElement).reset();
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-center font-script text-3xl text-blush-500">
        join the pretty club ♡
      </p>
      <h1 className="text-center font-display text-5xl leading-none text-plum-900">
        Become a provider
      </h1>
      <p className="mt-2 text-center text-sm font-semibold text-plum-500">
        Makeup, henna or baking cutie in Kenya? Apply here ✿ listings go live
        after admin approval + a KES 500/month M-Pesa subscription.
      </p>
      <form
        onSubmit={onSubmit}
        className="card-cute mt-6 space-y-3 rounded-[2rem] bg-white p-6 ring-1 ring-blush-100"
      >
        <input name="business_name" required placeholder="Business name ✿" className={input} />
        <div className="grid grid-cols-2 gap-3">
          <select name="category" className={input} defaultValue="makeup">
            <option value="makeup">Makeup</option>
            <option value="henna">Henna</option>
            <option value="baking">Baking</option>
          </select>
          <input name="location" required placeholder="Location (e.g. Nyali)" className={input} />
        </div>
        <textarea name="bio" placeholder="Bio, experience, service area… ♡" rows={4} className={input} />
        <div className="grid grid-cols-2 gap-3">
          <input name="phone" required placeholder="Phone +254…" className={input} />
          <input name="whatsapp" required placeholder="WhatsApp 254…" className={input} />
        </div>
        <input name="instagram" placeholder="Instagram @handle (optional)" className={input} />
        <button className="w-full rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 py-3 text-sm font-extrabold text-white shadow-md shadow-blush-200 hover:opacity-90">
          Submit for approval ✿
        </button>
        {msg && <p className="text-sm font-bold text-blush-600">{msg}</p>}
      </form>
    </main>
  );
}
