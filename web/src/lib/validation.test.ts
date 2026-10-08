import { describe, expect, it } from "vitest";
import {
  appointmentSchema,
  providerSchema,
  validateUpload,
} from "./validation";

const goodProvider = {
  business_name: "Glam by Zawadi",
  category: "makeup",
  location: "Mombasa",
  bio: "Bridal glam",
  phone: "254712345678",
  whatsapp: "254712345678",
  instagram: "@glam",
};

describe("providerSchema (join form)", () => {
  it("accepts a complete valid submission", () => {
    expect(providerSchema.safeParse(goodProvider).success).toBe(true);
  });
  it("rejects a one-letter business name", () => {
    const r = providerSchema.safeParse({ ...goodProvider, business_name: "x" });
    expect(r.success).toBe(false);
  });
  it("rejects an unknown category", () => {
    const r = providerSchema.safeParse({ ...goodProvider, category: "plumbing" });
    expect(r.success).toBe(false);
  });
  it("rejects an over-long bio", () => {
    const r = providerSchema.safeParse({ ...goodProvider, bio: "x".repeat(2001) });
    expect(r.success).toBe(false);
  });
});

describe("appointmentSchema (guest booking)", () => {
  const future = new Date(Date.now() + 86400_000).toISOString();
  const good = {
    provider_id: "glam-by-zawadi",
    customer_name: "Amina",
    customer_phone: "254700000001",
    starts_at: future,
    notes: "",
  };
  it("accepts a future booking", () => {
    expect(appointmentSchema.safeParse(good).success).toBe(true);
  });
  it("rejects a past date", () => {
    const r = appointmentSchema.safeParse({
      ...good,
      starts_at: new Date(Date.now() - 1000).toISOString(),
    });
    expect(r.success).toBe(false);
  });
  it("rejects a nonsense date", () => {
    const r = appointmentSchema.safeParse({ ...good, starts_at: "someday" });
    expect(r.success).toBe(false);
  });
  it("rejects a too-short phone number", () => {
    const r = appointmentSchema.safeParse({ ...good, customer_phone: "123" });
    expect(r.success).toBe(false);
  });
});

describe("validateUpload (portfolio photos)", () => {
  const MB = 1024 * 1024;
  it("accepts jpg/png/webp within 5MB", () => {
    expect(validateUpload("image/jpeg", 4 * MB)).toBeNull();
    expect(validateUpload("image/png", 5 * MB)).toBeNull();
    expect(validateUpload("image/webp", 1)).toBeNull();
  });
  it("rejects other types (e.g. executables posing as uploads)", () => {
    expect(validateUpload("text/plain", 100)).not.toBeNull();
    expect(validateUpload("application/pdf", 100)).not.toBeNull();
  });
  it("rejects anything over 5MB", () => {
    expect(validateUpload("image/jpeg", 5 * MB + 1)).not.toBeNull();
  });
});
