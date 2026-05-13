"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Minus, BookOpen, Video, FileQuestion, Box } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
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

  async function handleStatusClick(subtopic: Subtopic) {
    const newStatus = nextStatus(subtopic.status);
    setLocalSubtopics((prev) =>
      prev.map((s) =>
        s.id === subtopic.id
          ? {
              ...s,
              status: newStatus,
              progress_percent:
                newStatus === "completed" ? 100 : newStatus === "not_started" ? 0 : s.progress_percent,
            }
          : s
      )
    );
    await updateSubtopic(subtopic.id, { status: newStatus });
    onSubtopicChanged();
  }

  async function handleProgressChange(subtopic: Subtopic, value: number) {
    const p = Math.max(0, Math.min(100, value));
    const newStatus: SubtopicStatus =
      p === 0 ? "not_started" : p === 100 ? "completed" : "in_progress";
    setLocalSubtopics((prev) =>
      prev.map((s) =>
        s.id === subtopic.id ? { ...s, progress_percent: p, status: newStatus } : s
      )
    );
    await updateSubtopic(subtopic.id, { progress_percent: p });
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
        className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-accent/40 transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <h3 className="font-semibold text-foreground truncate">{subject.name}</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {completedCount}/{totalCount} done
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
          {avgProgress}%
        </span>
      </button>

      {open && (
        <div className="border-t bg-muted/20 px-6 py-4 space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              Subtopics
            </h4>
            <div className="space-y-1.5">
              {localSubtopics.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-background/60"
                >
                  <span className="flex-1 text-sm truncate" title={sub.name}>
                    {sub.name}
                  </span>
                  <Badge
                    variant={STATUS_VARIANT[sub.status]}
                    className="cursor-pointer select-none"
                    onClick={() => void handleStatusClick(sub)}
                  >
                    {STATUS_LABEL[sub.status]}
                  </Badge>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={sub.progress_percent}
                    onChange={(e) => void handleProgressChange(sub, Number(e.target.value))}
                    className="w-28 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
                    {sub.progress_percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
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
