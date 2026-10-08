import { describe, expect, it } from "vitest";
import { SUBSCRIPTION_DAYS } from "@/types";
import { decideCallback, newTransactionReference, nextPeriod } from "./mpesa";

describe("newTransactionReference", () => {
  it("looks like MH-<time>-<random> and never repeats", () => {
    const refs = new Set(Array.from({ length: 100 }, newTransactionReference));
    expect(refs.size).toBe(100);
    for (const r of refs) expect(r.startsWith("MH-")).toBe(true);
  });
});

describe("nextPeriod (30-day math)", () => {
  it("starts now when there is no current period", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const { start, end } = nextPeriod(null, now);
    expect(start).toEqual(now);
    expect(end.getTime() - start.getTime()).toBe(
      SUBSCRIPTION_DAYS * 86400_000
    );
  });
  it("extends from a still-active period end", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const active = new Date("2026-01-20T12:00:00Z");
    const { start, end } = nextPeriod(active, now);
    expect(start).toEqual(active);
    expect(end.getTime()).toBe(active.getTime() + SUBSCRIPTION_DAYS * 86400_000);
  });
  it("restarts now when the old period lapsed", () => {
    const now = new Date("2026-02-10T12:00:00Z");
    const lapsed = new Date("2026-01-05T12:00:00Z");
    const { start } = nextPeriod(lapsed, now);
    expect(start).toEqual(now);
  });
});

describe("decideCallback (never double-extend)", () => {
  it("confirms a fresh success", () => {
    expect(decideCallback("ref-1", true, false)).toEqual({
      action: "confirm",
      reference: "ref-1",
    });
  });
  it("marks an already-confirmed payment as duplicate", () => {
    expect(decideCallback("ref-1", true, true)).toEqual({
      action: "duplicate",
      reference: "ref-1",
    });
  });
  it("fails a rejected payment", () => {
    expect(decideCallback("ref-2", false, false)).toEqual({
      action: "fail",
      reference: "ref-2",
    });
  });
});
