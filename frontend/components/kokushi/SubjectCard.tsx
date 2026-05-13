"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Plus, Trash2, Minus, BookOpen, Video, FileQuestion, Box } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type Subject,
  type Subtopic,
  type Resource,
  type ResourceType,
  type ChecklistField,
  setSubtopicCheck,
  getResources,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/kokushi";

interface Props {
  subject: Subject;
  onSubtopicChanged: () => void;
}

const CHECKLIST_ITEMS: { field: ChecklistField; label: string }[] = [
  { field: "first_pass_done", label: "一刷" },
  { field: "second_pass_done", label: "二刷" },
  { field: "past_exams_done", label: "考古" },
];

const RESOURCE_ICON: Record<ResourceType, typeof BookOpen> = {
  book: BookOpen,
  video: Video,
  qbank: FileQuestion,
  other: Box,
};

const RESOURCE_LABEL: Record<ResourceType, string> = {
  book: "Book",
  video: "Video",
  qbank: "Q-Bank",
  other: "Other",
};

function progressColor(pct: number): string {
  if (pct === 0) return "text-muted-foreground";
  if (pct === 100) return "text-emerald-400";
  return "text-sky-400";
}

interface ChecklistChipProps {
  label: string;
  checked: boolean;
  onClick: () => void;
}

function ChecklistChip({ label, checked, onClick }: ChecklistChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors select-none",
        checked
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Check className={cn("h-3 w-3 transition-opacity", checked ? "opacity-100" : "opacity-30")} />
      {label}
    </button>
  );
}

interface SubtopicCardProps {
  subtopic: Subtopic;
  onChange: (sub: Subtopic) => void;
}

function SubtopicCard({ subtopic, onChange }: SubtopicCardProps) {
  async function toggle(field: ChecklistField) {
    const currentValue = subtopic[field];
    const newValue = !currentValue;
    const optimistic: Subtopic = { ...subtopic, [field]: newValue };
    const count =
      (optimistic.first_pass_done ? 1 : 0) +
      (optimistic.second_pass_done ? 1 : 0) +
      (optimistic.past_exams_done ? 1 : 0);
    optimistic.status = count === 0 ? "not_started" : count === 3 ? "completed" : "in_progress";
    optimistic.progress_percent = count === 0 ? 0 : count === 3 ? 100 : Math.round((count / 3) * 100);
    onChange(optimistic);
    const result = await setSubtopicCheck(subtopic.id, field, newValue);
    onChange({ ...optimistic, status: result.status, progress_percent: result.progress_percent });
  }

  return (
    <div className="border rounded-lg px-4 py-3 bg-card/40">
      <h4 className="font-medium text-sm text-foreground truncate" title={subtopic.name}>
        {subtopic.name}
      </h4>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {CHECKLIST_ITEMS.map(({ field, label }) => (
          <ChecklistChip
            key={field}
            label={label}
            checked={subtopic[field]}
            onClick={() => void toggle(field)}
          />
        ))}
        <span className={cn("ml-auto text-xs tabular-nums", progressColor(subtopic.progress_percent))}>
          {subtopic.progress_percent}%
        </span>
      </div>
    </div>
  );
}

export function SubjectCard({ subject, onSubtopicChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [localSubtopics, setLocalSubtopics] = useState<Subtopic[]>(subject.subtopics);
  const [resources, setResources] = useState<Resource[] | null>(null);

  useEffect(() => {
    setLocalSubtopics(subject.subtopics);
  }, [subject.subtopics]);

  useEffect(() => {
    if (open && resources === null) {
      void getResources(subject.id).then(setResources);
    }
  }, [open, resources, subject.id]);

  const totalCount = localSubtopics.length;
  const completedCount = localSubtopics.filter((s) => s.status === "completed").length;
  const completionPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  function updateLocalSubtopic(updated: Subtopic) {
    setLocalSubtopics((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    onSubtopicChanged();
  }

  async function handleAddResource(type: ResourceType) {
    const name = window.prompt(`New ${RESOURCE_LABEL[type]} name:`);
    if (!name) return;
    const totalStr = window.prompt("Total units (chapters, videos, questions)?", "10");
    const total = Number(totalStr);
    if (!Number.isFinite(total) || total < 1) return;
    await createResource(subject.id, type, name, Math.round(total));
    setResources(await getResources(subject.id));
  }

  async function handleResourceStep(resource: Resource, delta: number) {
    const newCompleted = Math.max(0, Math.min(resource.total_units, resource.completed_units + delta));
    setResources((prev) =>
      prev
        ? prev.map((r) => (r.id === resource.id ? { ...r, completed_units: newCompleted } : r))
        : prev
    );
    await updateResource(resource.id, { completed_units: newCompleted });
  }

  async function handleResourceDelete(resource: Resource) {
    if (!window.confirm(`Delete "${resource.name}"?`)) return;
    await deleteResource(resource.id);
    setResources((prev) => (prev ? prev.filter((r) => r.id !== resource.id) : prev));
  }

  return (
    <Card className="overflow-hidden py-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-4 text-left hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-lg text-foreground truncate">{subject.name}</h3>
          <ChevronRight
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
          />
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground tabular-nums">{totalCount} 子主題</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground tabular-nums">{completedCount} 完成</span>
          <span className="text-muted-foreground">·</span>
          <span className={cn("tabular-nums font-medium", progressColor(completionPct))}>
            {completionPct}%
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              completionPct === 100 ? "bg-emerald-500" : "bg-sky-500"
            )}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </button>

      {open && (
        <div className="border-t px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {localSubtopics.map((sub) => (
              <SubtopicCard
                key={sub.id}
                subtopic={sub}
                onChange={updateLocalSubtopic}
              />
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between pt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Resources
              </h4>
              <div className="flex gap-1">
                {(["book", "video", "qbank", "other"] as ResourceType[]).map((t) => {
                  const Icon = RESOURCE_ICON[t];
                  return (
                    <Button
                      key={t}
                      size="xs"
                      variant="outline"
                      onClick={() => void handleAddResource(t)}
                      title={`Add ${RESOURCE_LABEL[t]}`}
                    >
                      <Plus className="h-3 w-3" />
                      <Icon className="h-3 w-3" />
                    </Button>
                  );
                })}
              </div>
            </div>
            {resources === null ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : resources.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No resources yet</p>
            ) : (
              <div className="space-y-1.5">
                {resources.map((r) => {
                  const Icon = RESOURCE_ICON[r.type];
                  const pct =
                    r.total_units === 0
                      ? 0
                      : Math.round((r.completed_units / r.total_units) * 100);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-md bg-background/60"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm truncate" title={r.name}>
                        {r.name}
                      </span>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => void handleResourceStep(r, -1)}
                        disabled={r.completed_units <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs tabular-nums w-14 text-center">
                        {r.completed_units}/{r.total_units}
                      </span>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => void handleResourceStep(r, 1)}
                        disabled={r.completed_units >= r.total_units}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
                        {pct}%
                      </span>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => void handleResourceDelete(r)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
