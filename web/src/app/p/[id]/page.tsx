"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CATEGORY_THEMES, type Provider } from "@/types";
import { getProviderById, isVisible } from "@/lib/directory";
import { fetchProviderById } from "@/lib/api";
import BookingForm from "@/components/BookingForm";
import Photo from "@/components/Photo";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  // null = loading, undefined = not found.
  const [provider, setProvider] = useState<Provider | null | undefined>(null);
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetchProviderById(id).then((live) => {
      if (live === undefined) {
        // API says hidden — still honor the local demo store before 404.
        const local = getProviderById(id);
        setProvider(local && isVisible(local) ? local : undefined);
      } else {
        setProvider(live ?? getProviderById(id) ?? undefined);
      }
    });
  }, [id]);

  if (!id || provider === null) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="font-script text-3xl text-blush-500">one sec, pretty… ♡</p>
      </main>
    );
  }

  if (provider === undefined) notFound();
  const t = CATEGORY_THEMES[provider.category];

  const wa = `https://wa.me/${provider.whatsapp}?text=${encodeURIComponent(
    `Hi ${provider.business_name}, I found you on Maheba! ♡`
  )}`;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <div className="relative mt-4 overflow-hidden rounded-[2rem] ring-1 ring-blush-100">
        <Photo
          src={provider.cover_image || undefined}
          alt=""
          eager
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plum-900/50 via-transparent to-transparent" />
        <div
          className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.gradient}`}
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest shadow-sm ${t.badge}`}
        >
          ✿ {t.label}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Photo
          src={provider.avatar || undefined}
          alt={provider.business_name}
          eager
          compact
          className={`h-20 w-20 shrink-0 rounded-full object-cover shadow-lg ring-4 ring-white ${t.glow}`}
        />
        <div className="flex-1">
          <h1 className="font-display text-4xl leading-none text-plum-900">
            {provider.business_name}
          </h1>
          <p className="mt-1 text-sm font-bold text-plum-500">
            {provider.location} ·{" "}
            <span className="text-amber-500">★ {provider.rating.toFixed(1)}</span>{" "}
            ({provider.reviews_count} reviews)
          </p>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-plum-700">
            {provider.bio}
          </p>
          {provider.instagram && (
            <p className={`mt-1 text-sm font-extrabold ${t.accent}`}>
              {provider.instagram}
            </p>
          )}
          {provider.subscription_end && (
            <p className="mt-1 text-xs font-bold text-plum-500">
              ✿ subscribed till {fmt(provider.subscription_end)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-gradient-to-r from-emerald-400 to-green-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-green-200 hover:opacity-90"
          >
            WhatsApp ♡
          </a>
          <a
            href={`tel:${provider.phone}`}
            className={`rounded-full bg-gradient-to-r ${t.gradient} px-5 py-2.5 text-sm font-extrabold text-white shadow-md hover:opacity-90`}
          >
            Call
          </a>
        </div>
      </div>

      <h2 className="mt-10 font-display text-3xl text-plum-900">
        portfolio <span className={`font-script ${t.accent}`}>✿</span>
      </h2>
      {provider.portfolio.length === 0 ? (
        <p className="mt-2 font-script text-2xl text-plum-500">
          fresh face here — portfolio coming soon ♡
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {provider.portfolio.map((item) => (
            <figure
              key={item.id}
              className="group relative overflow-hidden rounded-3xl ring-1 ring-blush-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.caption}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-900/70 to-transparent p-3 text-xs font-bold text-white opacity-0 group-hover:opacity-100">
                ♡ {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-display text-3xl text-plum-900">
        services & prices{" "}
        <span className={`font-script ${t.accent}`}>♡</span>
      </h2>
      {provider.services.length === 0 ? (
        <p className="mt-2 font-script text-2xl text-plum-500">
          services list landing soon — just ask on WhatsApp ♡
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {provider.services.map((s) => (
            <div
              key={s.id}
              className="card-cute rounded-3xl bg-white p-5 ring-1 ring-blush-100"
            >
              <p className="font-display text-2xl leading-tight text-plum-900">
                {s.title}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-plum-500">
                {s.description}
              </p>
              <p className={`mt-1 font-script text-2xl ${t.accent}`}>
                KES {s.price_kes.toLocaleString()} {s.unit}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-display text-3xl text-plum-900">
        book an appointment{" "}
        <span className={`font-script ${t.accent}`}>♡</span>
      </h2>
      <BookingForm
        providerId={provider.id}
        gradient={t.gradient}
        accent={t.accent}
      />

      <Link
        href="/"
        className={`mt-8 inline-block text-sm font-extrabold underline ${t.accent}`}
      >
        ← back to the pretty stuff
      </Link>
    </main>
  );
}
