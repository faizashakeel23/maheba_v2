import { describe, expect, it } from "vitest";
import type { Provider } from "@/types";
import { isVisible } from "./directory";

function provider(over: Partial<Provider>): Provider {
  return {
    id: "p1",
    business_name: "Test",
    category: "makeup",
    location: "Mombasa",
    bio: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    status: "approved",
    avatar: "",
    cover_image: "",
    rating: 5,
    reviews_count: 1,
    subscription_end: new Date(Date.now() + 86400_000).toISOString(),
    services: [],
    portfolio: [],
    ...over,
  } as Provider;
}

describe("isVisible (who the public may see)", () => {
  it("shows approved providers whose subscription is active", () => {
    expect(isVisible(provider({}))).toBe(true);
  });
  it("hides pending, rejected and suspended providers", () => {
    expect(isVisible(provider({ status: "pending" }))).toBe(false);
    expect(isVisible(provider({ status: "rejected" }))).toBe(false);
    expect(isVisible(provider({ status: "suspended" }))).toBe(false);
  });
  it("hides approved providers whose subscription lapsed", () => {
    expect(
      isVisible(
        provider({ subscription_end: new Date(Date.now() - 1000).toISOString() })
      )
    ).toBe(false);
  });
  it("hides approved providers with no subscription date", () => {
    expect(isVisible(provider({ subscription_end: null }))).toBe(false);
  });
});
