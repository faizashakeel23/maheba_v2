/** Pure date helpers for the provider year calendar. All unit-tested. */

export interface DayCell {
  date: Date;
  inMonth: boolean;
}

/** Local yyyy-mm-dd key (no UTC shifts — bookings are shown in local time). */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Month grid as weeks of 7, weeks starting Monday.
 * Pads with neighbouring-month days so every week is complete.
 */
export function monthGrid(year: number, month: number): DayCell[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: DayCell[] = [];
  for (let i = lead; i > 0; i--) {
    cells.push({ date: new Date(year, month, 1 - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  const tail = new Date(year, month, daysInMonth);
  while (cells.length % 7 !== 0) {
    tail.setDate(tail.getDate() + 1);
    cells.push({ date: new Date(tail), inMonth: false });
  }
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
