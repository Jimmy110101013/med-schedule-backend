"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { computeStreaks } from "@/lib/kokushi";

interface Props {
  activityMap: Map<string, number>;
  weeks?: number;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function intensityClass(count: number): string {
  if (count === 0) return "bg-muted/30";
  if (count <= 2) return "bg-emerald-900";
  if (count <= 5) return "bg-emerald-700";
  if (count <= 9) return "bg-emerald-500";
  return "bg-emerald-400";
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Cell {
  date: string;
  count: number;
  isFuture: boolean;
  dateObj: Date;
}

interface Week {
  cells: Cell[];
  monthLabel: string | null;
}

function buildWeeks(activityMap: Map<string, number>, weeks: number): Week[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const daysUntilSat = (6 - dow + 7) % 7;
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysUntilSat);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (weeks * 7 - 1));

  const cells: Cell[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const iso = isoDate(cursor);
    cells.push({
      date: iso,
      count: activityMap.get(iso) ?? 0,
      isFuture: cursor > today,
      dateObj: new Date(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const result: Week[] = [];
  let lastMonth = -1;
  for (let i = 0; i < weeks; i++) {
    const weekCells = cells.slice(i * 7, i * 7 + 7);
    const firstNonFuture = weekCells.find((c) => !c.isFuture) ?? weekCells[0];
    const m = firstNonFuture.dateObj.getMonth();
    const monthLabel = m !== lastMonth && firstNonFuture.dateObj.getDate() <= 7 ? MONTH_NAMES[m] : null;
    if (monthLabel !== null) lastMonth = m;
    result.push({ cells: weekCells, monthLabel });
  }
  return result;
}

export function ActivityHeatmap({ activityMap, weeks = 16 }: Props) {
  const weekColumns = buildWeeks(activityMap, weeks);
  const { current, longest, thisWeek } = computeStreaks(activityMap);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold">Daily Activity</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Flame
                className={cn("h-3.5 w-3.5", current > 0 ? "text-orange-400" : "text-muted-foreground")}
              />
              <span className="text-foreground font-medium tabular-nums">{current}</span>
              <span className="text-muted-foreground">day streak</span>
            </span>
            <span className="text-muted-foreground">
              Longest: <span className="text-foreground tabular-nums">{longest}</span>
            </span>
            <span className="text-muted-foreground">
              This week: <span className="text-foreground tabular-nums">{thisWeek}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block">
            <div className="flex gap-1 mb-1 text-[10px] text-muted-foreground" style={{ paddingLeft: "1.75rem" }}>
              {weekColumns.map((w, i) => (
                <span key={i} className="w-3 shrink-0">
                  {w.monthLabel ?? ""}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pr-1 w-6">
                {WEEKDAY_LABELS.map((label, i) => (
                  <span key={i} className="h-3 leading-[0.75rem]">
                    {label}
                  </span>
                ))}
              </div>
              {weekColumns.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.cells.map((cell) => (
                    <div
                      key={cell.date}
                      className={cn(
                        "w-3 h-3 rounded-sm",
                        cell.isFuture ? "bg-muted/10 border border-muted/20" : intensityClass(cell.count)
                      )}
                      title={
                        cell.isFuture
                          ? cell.date
                          : `${cell.date}: ${cell.count} ${cell.count === 1 ? "activity" : "activities"}`
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-emerald-900" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
