"use client";

import { useState } from "react";
import {
  MONTH_NAMES,
  WEEKDAY_LETTERS,
  dayKey,
  monthGrid,
} from "@/lib/calendar";

export interface DayMark {
  accepted: string[];
  pending: number;
}

/**
 * Year calendar: 12 month grids. Accepted bookings fill their date
 * (hover shows customer names); pending ones get an amber ring.
 */
export default function YearCalendar({
  marks,
  selected,
  onSelect,
}: {
  marks: Record<string, DayMark>;
  selected: string | null;
  onSelect: (day: string | null) => void;
}) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const today = dayKey(new Date());

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl text-plum-900">{year}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-full border border-blush-200 bg-white px-3 py-1 text-xs font-extrabold text-plum-700"
            aria-label="Previous year"
          >
            ←
          </button>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded-full border border-blush-200 bg-white px-3 py-1 text-xs font-extrabold text-plum-700"
            aria-label="Next year"
          >
            →
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MONTH_NAMES.map((name, m) => (
          <div key={name} className="rounded-2xl bg-blush-50/50 p-3 ring-1 ring-blush-100">
            <p className="text-xs font-extrabold uppercase tracking-widest text-plum-500">
              {name}
            </p>
            <div className="mt-1 grid grid-cols-7 gap-0.5 text-center">
              {WEEKDAY_LETTERS.map((w, i) => (
                <span
                  key={i}
                  className="text-[10px] font-extrabold text-plum-500/60"
                >
                  {w}
                </span>
              ))}
              {monthGrid(year, m)
                .flat()
                .map((cell) => {
                  const key = dayKey(cell.date);
                  const mark = marks[key];
                  const isSel = selected === key;
                  return (
                    <button
                      key={key}
                      title={
                        mark
                          ? [
                              ...mark.accepted.map((n) => `Booked by ${n}`),
                              ...(mark.pending > 0
                                ? [`${mark.pending} awaiting you`]
                                : []),
                            ].join(" · ")
                          : undefined
                      }
                      onClick={() => onSelect(isSel ? null : key)}
                      className={[
                        "aspect-square rounded-lg text-[11px] font-bold",
                        !cell.inMonth
                          ? "text-plum-500/25"
                          : mark && mark.accepted.length > 0
                            ? "bg-emerald-400 text-white"
                            : mark && mark.pending > 0
                              ? "text-plum-900 ring-1 ring-inset ring-amber-400"
                              : "text-plum-700 hover:bg-blush-100",
                        key === today ? "ring-1 ring-inset ring-blush-400" : "",
                        isSel ? "ring-2 ring-plum-900" : "",
                      ].join(" ")}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-plum-500">
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          booked
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-amber-400" />
          awaiting your decision
        </span>
      </div>
    </div>
  );
}
