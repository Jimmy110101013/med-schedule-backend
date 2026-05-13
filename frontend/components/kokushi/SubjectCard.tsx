"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Plus, Trash2, Minus, BookOpen, Video, FileQuestion, Box } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type Subject,
  type Subtopic,
  type SubtopicStatus,
  type Resource,
  type ResourceType,
  updateSubtopic,
  getResources,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/kokushi";

interface Props {
  subject: Subject;
  onSubtopicChanged: () => void;
}

const STATUS_LABEL: Record<SubtopicStatus, string> = {
  not_started: "未開始",
  in_progress: "進行中",
  completed: "已完成",
};

const STATUS_TEXT_COLOR: Record<SubtopicStatus, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-sky-400",
  completed: "text-emerald-400",
};

const STATUS_VARIANT: Record<SubtopicStatus, "secondary" | "default" | "outline"> = {
  not_started: "outline",
  in_progress: "secondary",
  completed: "default",
};

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

function nextStatus(s: SubtopicStatus): SubtopicStatus {
  if (s === "not_started") return "in_progress";
  if (s === "in_progress") return "completed";
  return "not_started";
}

function progressColor(pct: number): string {
  if (pct === 0) return "text-muted-foreground";
  if (pct === 100) return "text-emerald-400";
  return "text-sky-400";
}

interface SubtopicCardProps {
  subtopic: Subtopic;
  onChange: (sub: Subtopic) => void;
  onPersist: (id: number, updates: { status?: SubtopicStatus; progress_percent?: number }) => Promise<void>;
}

function SubtopicCard({ subtopic, onChange, onPersist }: SubtopicCardProps) {
  const [open, setOpen] = useState(false);

  async function cycleStatus(e: React.MouseEvent) {
    e.stopPropagation();
    const newStatus = nextStatus(subtopic.status);
    const newPct =
      newStatus === "completed" ? 100 : newStatus === "not_started" ? 0 : subtopic.progress_percent;
    onChange({ ...subtopic, status: newStatus, progress_percent: newPct });
    await onPersist(subtopic.id, { status: newStatus });
  }

  async function handleSlider(value: number) {
    const p = Math.max(0, Math.min(100, value));
    const newStatus: SubtopicStatus =
      p === 0 ? "not_started" : p === 100 ? "completed" : "in_progress";
    onChange({ ...subtopic, progress_percent: p, status: newStatus });
    await onPersist(subtopic.id, { progress_percent: p });
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm text-foreground truncate" title={subtopic.name}>
            {subtopic.name}
          </h4>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
          />
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          <span className={STATUS_TEXT_COLOR[subtopic.status]}>
            {STATUS_LABEL[subtopic.status]}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className={cn("tabular-nums", progressColor(subtopic.progress_percent))}>
            {subtopic.progress_percent}%
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-2 border-t bg-background/40 space-y-2">
          <div className="flex items-center gap-3">
            <Badge
              variant={STATUS_VARIANT[subtopic.status]}
              className="cursor-pointer select-none"
              onClick={cycleStatus}
            >
              {STATUS_LABEL[subtopic.status]}
            </Badge>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={subtopic.progress_percent}
              onChange={(e) => void handleSlider(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
              {subtopic.progress_percent}%
            </span>
          </div>
        </div>
      )}
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

  const completedCount = localSubtopics.filter((s) => s.status === "completed").length;
  const totalCount = localSubtopics.length;
  const avgProgress =
    totalCount === 0
      ? 0
      : Math.round(localSubtopics.reduce((sum, s) => sum + s.progress_percent, 0) / totalCount);

  async function persistSubtopic(
    id: number,
    updates: { status?: SubtopicStatus; progress_percent?: number }
  ) {
    await updateSubtopic(id, updates);
    onSubtopicChanged();
  }

  function updateLocalSubtopic(updated: Subtopic) {
    setLocalSubtopics((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
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
          <span className="text-muted-foreground tabular-nums">
            {completedCount} 完成
          </span>
          <span className="text-muted-foreground">·</span>
          <span className={cn("tabular-nums font-medium", progressColor(avgProgress))}>
            {avgProgress}%
          </span>
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
                onPersist={persistSubtopic}
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
