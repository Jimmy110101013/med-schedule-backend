"use client";

import { useState } from "react";
import { Target, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Subject, Subtopic } from "@/lib/kokushi";

interface Props {
  subjects: Subject[];
  targetSubtopicId: number | null;
  onChange: (id: number | null) => void;
}

function findTarget(subjects: Subject[], id: number | null) {
  if (id === null) return null;
  for (const subject of subjects) {
    const subtopic = subject.subtopics.find((s) => s.id === id);
    if (subtopic) return { subject, subtopic };
  }
  return null;
}

interface SelectorProps {
  subjects: Subject[];
  value: number | null;
  onChange: (id: number | null) => void;
}

function SubtopicSelector({ subjects, value, onChange }: SelectorProps) {
  return (
    <select
      className="w-full max-w-sm h-9 px-2 text-sm border rounded-md bg-background"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    >
      <option value="">— Pick a subtopic —</option>
      {subjects.map((subject) => (
        <optgroup key={subject.id} label={subject.name}>
          {subject.subtopics.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function ChecklistSummary({ subtopic }: { subtopic: Subtopic }) {
  const items: { label: string; done: boolean }[] = [
    { label: "一刷", done: subtopic.first_pass_done },
    { label: "二刷", done: subtopic.second_pass_done },
    { label: "考古", done: subtopic.past_exams_done },
  ];
  return (
    <div className="flex gap-2 mt-1">
      {items.map(({ label, done }) => (
        <span
          key={label}
          className={cn(
            "text-xs px-2 py-0.5 rounded-full border",
            done
              ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
              : "border-border text-muted-foreground"
          )}
        >
          {done ? "✓ " : ""}
          {label}
        </span>
      ))}
    </div>
  );
}

export function TodayTarget({ subjects, targetSubtopicId, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const target = findTarget(subjects, targetSubtopicId);
  const isComplete = target?.subtopic.status === "completed";

  const showSelector = !target || editing;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-sm font-semibold">Today&apos;s Target</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
        {showSelector ? (
          <>
            <p className="text-xs text-muted-foreground">
              {target ? "Change today's focus subtopic" : "Pick a subtopic to focus on today"}
            </p>
            <SubtopicSelector
              subjects={subjects}
              value={targetSubtopicId}
              onChange={(id) => {
                onChange(id);
                setEditing(false);
              }}
            />
            {editing && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {target!.subject.name}
            </p>
            <p
              className={cn(
                "text-2xl md:text-3xl font-extrabold tracking-tight",
                isComplete ? "text-emerald-500 line-through" : "text-rose-500"
              )}
            >
              {target!.subtopic.name}
            </p>
            {!isComplete && (
              <p className="text-xs text-muted-foreground">完成這個子主題！</p>
            )}
            <ChecklistSummary subtopic={target!.subtopic} />
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Change
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
                <X className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
