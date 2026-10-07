import { MOCK_PROVIDERS } from "./mock-data";
import type { Provider, ProviderCategory } from "./types";

/** Product rule: public only if approved AND subscription still active. */
export function isVisible(p: Provider, now = new Date()): boolean {
  if (p.status !== "approved") return false;
  if (!p.subscription_end) return false;
  return new Date(p.subscription_end).getTime() > now.getTime();
}

export function filterProviders(
  providers: Provider[],
  opts: { category?: ProviderCategory | "all"; query?: string }
): Provider[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  return providers.filter((p) => {
    if (opts.category && opts.category !== "all" && p.category !== opts.category)
      return false;
    if (!q) return true;
    return [p.business_name, p.location, p.bio, p.category]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

export function findById(list: Provider[], id: string): Provider | undefined {
  return list.find((p) => p.id === id);
}

/** Deterministic static list for first render (matches web SSR behavior). */
export function staticVisible(): Provider[] {
  return MOCK_PROVIDERS.filter((p) => isVisible(p));
}
