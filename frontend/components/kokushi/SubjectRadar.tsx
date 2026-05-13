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

export function SubjectRadar({ subjects }: Props) {
  const data = useMemo(() => {
    if (subjects.length === 0) return null;
    const angleStep = (2 * Math.PI) / subjects.length;
    const angles = subjects.map((_, i) => -Math.PI / 2 + i * angleStep);
    const axes = angles.map((a, i) => {
      const tip = polar(a, R);
      const lbl = polar(a, LABEL_R);
      return { angle: a, tx: tip.x, ty: tip.y, lx: lbl.x, ly: lbl.y, name: subjects[i].name };
    });
    const seriesPoints = SERIES.map((s) => {
      const points = subjects
        .map((subject, i) => {
          const v = ratio(subject, s.field);
          const p = polar(angles[i], R * v);
          return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        })
        .join(" ");
      return { ...s, points };
    });
    const gridPolygons = Array.from({ length: GRID_LEVELS }, (_, level) => {
      const r = (R * (level + 1)) / GRID_LEVELS;
      return angles
        .map((a) => {
          const p = polar(a, r);
          return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        })
        .join(" ");
    });
    return { axes, seriesPoints, gridPolygons };
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
            {data.gridPolygons.map((pts, i) => (
              <polygon
                key={i}
                points={pts}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
            ))}
            {data.axes.map((ax, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={ax.tx}
                y2={ax.ty}
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
            ))}
            {data.seriesPoints.map((s) => (
              <polygon
                key={s.label}
                points={s.points}
                fill={s.color}
                fillOpacity={0.2}
                stroke={s.color}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            ))}
            {data.axes.map((ax, i) => {
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
