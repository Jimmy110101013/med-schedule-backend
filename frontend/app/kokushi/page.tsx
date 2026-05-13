"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubjectCard } from "@/components/kokushi/SubjectCard";
import { ActivityHeatmap } from "@/components/kokushi/ActivityHeatmap";
import { SubjectRadar } from "@/components/kokushi/SubjectRadar";
import {
  type Subject,
  type Subtopic,
  computeStats,
  getActivityMap,
  getExamDate,
  getSubjects,
  isTauri,
  setExamDate,
  todayISO,
} from "@/lib/kokushi";

function formatDaysToExam(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `${days}d`;
}

export default function KokushiPage() {
  const [tauriReady, setTauriReady] = useState<boolean | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examDate, setExamDateState] = useState<string | null>(null);
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState(false);

  useEffect(() => {
    setTauriReady(isTauri());
  }, []);

  const loadAll = useCallback(async () => {
    const [subs, date, activity] = await Promise.all([
      getSubjects(),
      getExamDate(),
      getActivityMap(),
    ]);
    setSubjects(subs);
    setExamDateState(date);
    setActivityMap(activity);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tauriReady) void loadAll();
  }, [tauriReady, loadAll]);

  const stats = useMemo(() => computeStats(subjects, examDate), [subjects, examDate]);

  const bumpToday = useCallback(() => {
    setActivityMap((prev) => {
      const next = new Map(prev);
      const key = todayISO();
      next.set(key, (next.get(key) ?? 0) + 1);
      return next;
    });
  }, []);

  const handleSubtopicUpdated = useCallback((updated: Subtopic) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === updated.subject_id
          ? { ...s, subtopics: s.subtopics.map((t) => (t.id === updated.id ? updated : t)) }
          : s
      )
    );
  }, []);

  async function handleSaveDate(value: string) {
    await setExamDate(value || null);
    setExamDateState(value || null);
    setEditingDate(false);
  }

  if (tauriReady === null) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!tauriReady) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Board Exam Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track review progress across all subjects
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground">
            <GraduationCap className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Available in desktop app only</p>
            <p className="text-xs opacity-70 max-w-md">
              The board exam tracker stores data locally on your device. Open this page in the
              Med Schedule Tracker desktop app to start tracking.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: "Total Subtopics", value: stats.totalSubtopics.toString() },
    { label: "Completed", value: stats.completedSubtopics.toString() },
    { label: "In Progress", value: stats.inProgressSubtopics.toString() },
    { label: "Days to Exam", value: formatDaysToExam(stats.daysToExam) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Board Exam Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track review progress across all subjects
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {editingDate ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                defaultValue={examDate ?? ""}
                autoFocus
                onBlur={(e) => void handleSaveDate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveDate((e.target as HTMLInputElement).value);
                  if (e.key === "Escape") setEditingDate(false);
                }}
                className="h-8 px-2 text-sm border rounded-md bg-background"
              />
              <Button size="sm" variant="ghost" onClick={() => setEditingDate(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditingDate(true)}>
              <CalendarDays className="h-4 w-4" />
              {examDate ? `Exam: ${examDate}` : "Set exam date"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityHeatmap activityMap={activityMap} weeks={13} />
        <SubjectRadar subjects={subjects} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Subjects</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading subjects…</p>
        ) : subjects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No subjects found. The database may not have seeded — try restarting the app.
            </CardContent>
          </Card>
        ) : (
          subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onSubtopicUpdated={handleSubtopicUpdated}
              onActivity={bumpToday}
            />
          ))
        )}
      </div>
    </div>
  );
}
