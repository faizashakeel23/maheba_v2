"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ALL_GRADIENT,
  CATEGORIES,
  CATEGORY_THEMES,
  type Provider,
  type ProviderCategory,
} from "@/types";
import {
  filterProviders,
  getStaticVisibleProviders,
  getVisibleProviders,
} from "@/lib/directory";
import { fetchProviders } from "@/lib/api";
import Photo from "@/components/Photo";

export default function Home() {
  const [category, setCategory] = useState<ProviderCategory | "all">("all");
  const [query, setQuery] = useState("");
  // Identical static list on server + first client render (no hydration
  // mismatch); live data from /api/providers (DB) wins after mount, with
  // the localStorage demo store as fallback when the API is unreachable.
  const [base, setBase] = useState<Provider[]>(() =>
    getStaticVisibleProviders()
  );
  useEffect(() => {
    fetchProviders().then((live) => {
      setBase(live ?? getVisibleProviders());
    });
  }, []);

  const providers = useMemo(() => {
    return filterProviders(base, { category, query });
  }, [base, category, query]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <section className="py-10 text-center">
        <p className="font-script text-3xl text-blush-500">
          karibu cutie ♡
        </p>
        <h1 className="mx-auto mt-1 max-w-2xl font-display text-5xl leading-[1.05] text-plum-900 sm:text-6xl">
          Kenya&apos;s <span className="text-gradient">prettiest</span>{" "}
          little directory
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-plum-500">
          Glam, henna & bakes ✿ tap a photo to fall in love with the full
          portfolio, then WhatsApp your fave directly. No account needed.
        </p>
        <div className="mx-auto mt-5 flex max-w-xl gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bridal, Nyali, cupcakes… ♡"
            className="w-full rounded-full border border-blush-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-plum-900 placeholder:text-plum-500/50 outline-none focus:border-blush-400 focus:ring-2 focus:ring-blush-200"
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => {
            const grad =
              c.value === "all"
                ? ALL_GRADIENT
                : CATEGORY_THEMES[c.value].gradient;
            const active = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full px-5 py-1.5 text-sm font-extrabold transition ${
                  active
                    ? `bg-gradient-to-r ${grad} text-white shadow-md`
                    : "border border-blush-200 bg-white/80 text-plum-700 hover:bg-blush-50"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {providers.length === 0 && (
        <p className="py-16 text-center font-script text-3xl text-plum-500">
          nothing found, pretty… try another search ♡
        </p>
      )}

      {/* Instagram-like photo grid */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => {
          const t = CATEGORY_THEMES[p.category];
          return (
            <Link
              key={p.id}
              href={`/p/${p.id}`}
              className="card-cute group overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-blush-100"
            >
              <div className={`h-1.5 bg-gradient-to-r ${t.gradient}`} />
              <div className="relative">
                <Photo
                  src={p.portfolio[0]?.image_url || p.cover_image || undefined}
                  alt={p.business_name}
                  className="aspect-square w-full object-cover group-hover:opacity-95"
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest shadow-sm ${t.badge}`}
                >
                  ✿ {t.label}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-plum-900/70 px-2.5 py-1 text-[11px] font-extrabold text-amber-200">
                  ★ {p.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-3 p-4">
                <Photo
                  src={p.avatar || undefined}
                  alt=""
                  compact
                  className={`h-11 w-11 shrink-0 rounded-full object-cover ring-2 ${t.ring}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-2xl leading-none text-plum-900">
                    {p.business_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-bold text-plum-500">
                    {p.location} · ({p.reviews_count} reviews)
                  </p>
                </div>
                <span className={`font-script text-2xl ${t.accent}`}>♡</span>
              </div>
              <div className="grid grid-cols-3 gap-1 px-4 pb-4">
                {p.portfolio.slice(1, 4).map((item) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={item.id}
                    src={item.image_url}
                    alt={item.caption}
                    className="aspect-square w-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
