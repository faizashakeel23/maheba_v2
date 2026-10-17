import { describe, expect, it } from "vitest";
import { toProvider, type ProviderRow } from "./provider-shape";

function row(over: Partial<ProviderRow> = {}): ProviderRow {
  return {
    id: "p1",
    business_name: "Test",
    category: "makeup",
    location: null,
    bio: null,
    phone: null,
    whatsapp: null,
    instagram: null,
    status: "approved",
    id_verified: false,
    rating: 5,
    reviews_count: 1,
    subscription_end: new Date(Date.now() + 86400_000).toISOString(),
    ...over,
  };
}

describe("toProvider id_verified passthrough (blue tick)", () => {
  it("carries a verified flag through to the public shape", () => {
    expect(toProvider(row({ id_verified: true }), [], []).id_verified).toBe(
      true
    );
  });
  it("defaults a missing flag to false (rows from before the migration)", () => {
    const r = row() as unknown as Record<string, unknown>;
    delete r.id_verified;
    expect(toProvider(r as unknown as ProviderRow, [], []).id_verified).toBe(false);
  });
});

describe("toProvider privacy (ID documents never leak)", () => {
  it("always nulls the vault filename in the public shape", () => {
    const shaped = toProvider(row(), [], []);
    expect(shaped.id_document_url).toBeNull();
  });
});
