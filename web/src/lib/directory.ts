import { getAllProviders } from "./providers";
import { MOCK_PROVIDERS } from "./mock-data";
import type { Provider, ProviderCategory } from "@/types";

/** Product rule: public only if approved AND subscription still active. */
export function isVisible(p: Provider, now = new Date()): boolean {
  if (p.status !== "approved") return false;
  if (!p.subscription_end) return false;
  return new Date(p.subscription_end).getTime() > now.getTime();
}

export function getVisibleProviders(now = new Date()): Provider[] {
  return getAllProviders().filter((p) => isVisible(p, now));
}

/**
 * Deterministic static-list variants for first render (SSR + client must match).
 * Demo-store overrides (admin approvals) load in a useEffect after mount.
 */
export function getStaticVisibleProviders(): Provider[] {
  return MOCK_PROVIDERS.filter((p) => isVisible(p));
}

export function getStaticProviderById(id: string): Provider | undefined {
  return MOCK_PROVIDERS.find((p) => p.id === id);
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

export function getProviderById(id: string): Provider | undefined {
  return getAllProviders().find((p) => p.id === id);
}
