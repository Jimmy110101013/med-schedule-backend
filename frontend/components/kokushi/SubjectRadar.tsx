"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChecklistField, Subject } from "@/lib/kokushi";

interface Props {
  subjects: Subject[];
}

const SERIES: { field: ChecklistField; label: string; color: string }[] = [
  { field: "first_pass_done", label: "一刷", color: "#3b82f6" },
  { field: "second_pass_done", label: "二刷", color: "#f59e0b" },
  { field: "past_exams_done", label: "考古", color: "#10b981" },
];

const VIEW = 400;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R = 130;
const LABEL_R = 158;
const GRID_LEVELS = 4;

function polar(angle: number, radius: number) {
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
}

function ratio(subject: Subject, field: ChecklistField): number {
  if (subject.subtopics.length === 0) return 0;
  const done = subject.subtopics.reduce((n, s) => n + (s[field] ? 1 : 0), 0);
  return done / subject.subtopics.length;
}

function sectorPath(a0: number, a1: number, r: number): string {
  if (r <= 0 || a1 <= a0) return "";
  const p0 = polar(a0, r);
  const p1 = polar(a1, r);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${CX.toFixed(2)} ${CY.toFixed(2)} L ${p0.x.toFixed(2)} ${p0.y.toFixed(
    2,
  )} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

export function SubjectRadar({ subjects }: Props) {
  const data = useMemo(() => {
    if (subjects.length === 0) return null;
    const angleStep = (2 * Math.PI) / subjects.length;
    const angles = subjects.map((_, i) => -Math.PI / 2 + i * angleStep);
    const labels = angles.map((a, i) => {
      const lbl = polar(a, LABEL_R);
      return { lx: lbl.x, ly: lbl.y, name: subjects[i].name };
    });
    const boundaries = subjects.map((_, i) => {
      const a = -Math.PI / 2 + (i - 0.5) * angleStep;
      const tip = polar(a, R);
      return { x: tip.x, y: tip.y };
    });
    const sectors = subjects.flatMap((subject, i) => {
      const a0 = angles[i] - angleStep / 2;
      const subStep = angleStep / SERIES.length;
      return SERIES.map((s, j) => {
        const v = ratio(subject, s.field);
        const aa0 = a0 + j * subStep;
        const aa1 = aa0 + subStep;
        return {
          key: `${subject.id}-${s.field}`,
          path: sectorPath(aa0, aa1, R * v),
          color: s.color,
        };
      });
    });
    const gridRadii = Array.from({ length: GRID_LEVELS }, (_, level) => (R * (level + 1)) / GRID_LEVELS);
    return { labels, boundaries, sectors, gridRadii };
  }, [subjects]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold">Progress by Subject</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            {SERIES.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: s.color, opacity: 0.85 }}
                />
                <span className="text-muted-foreground">{s.label}</span>
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!data ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No subjects yet.</p>
        ) : (
          <svg
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            className="w-full max-w-md mx-auto text-foreground"
            aria-label="Subject progress radar"
          >
            {data.gridRadii.map((r, i) => (
              <circle
                key={i}
                cx={CX}
                cy={CY}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
            ))}
            {data.sectors.map((s) => (
              <path
                key={s.key}
                d={s.path}
                fill={s.color}
                fillOpacity={0.55}
                stroke={s.color}
                strokeOpacity={0.9}
                strokeWidth={0.75}
                strokeLinejoin="round"
              />
            ))}
            {data.boundaries.map((b, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={b.x}
                y2={b.y}
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeWidth={1}
              />
            ))}
            {data.labels.map((ax, i) => {
              const dx = ax.lx - CX;
              const anchor: "start" | "middle" | "end" =
                Math.abs(dx) < 5 ? "middle" : dx > 0 ? "start" : "end";
              return (
                <text
                  key={i}
                  x={ax.lx}
                  y={ax.ly}
                  textAnchor={anchor}
                  fontSize={10}
                  fill="currentColor"
                  fillOpacity={0.75}
                  dy="0.35em"
                >
                  {ax.name}
                </text>
              );
            })}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
