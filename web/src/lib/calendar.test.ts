import { describe, expect, it } from "vitest";
import { dayKey, monthGrid } from "./calendar";

describe("monthGrid (provider year calendar)", () => {
  it("builds complete Monday-first weeks", () => {
    const weeks = monthGrid(2026, 0); // January 2026
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    for (const w of weeks) expect(w).toHaveLength(7);
    // Jan 1 2026 is a Thursday -> 3 leading pad days (Mon-Wed).
    expect(weeks[0][3]).toMatchObject({ inMonth: true });
    expect(weeks[0][3].date.getDate()).toBe(1);
    expect(weeks[0][0].inMonth).toBe(false);
  });
  it("covers all 31 January days exactly once", () => {
    const days = monthGrid(2026, 0)
      .flat()
      .filter((c) => c.inMonth)
      .map((c) => c.date.getDate())
      .sort((a, b) => a - b);
    expect(days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });
  it("handles February in a leap year", () => {
    const days = monthGrid(2024, 1)
      .flat()
      .filter((c) => c.inMonth);
    expect(days).toHaveLength(29);
  });
});

describe("dayKey (local booking dates)", () => {
  it("formats a local yyyy-mm-dd without UTC shifts", () => {
    expect(dayKey(new Date(2026, 9, 5))).toBe("2026-10-05");
    expect(dayKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});
