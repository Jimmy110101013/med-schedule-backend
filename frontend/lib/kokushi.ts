export type SubtopicStatus = "not_started" | "in_progress" | "completed";
export type ResourceType = "book" | "video" | "qbank" | "other";
export type ChecklistField = "first_pass_done" | "second_pass_done" | "past_exams_done";

export interface Subtopic {
  id: number;
  subject_id: number;
  name: string;
  order_index: number;
  status: SubtopicStatus;
  progress_percent: number;
  notes: string | null;
  first_pass_done: boolean;
  second_pass_done: boolean;
  past_exams_done: boolean;
}

export interface Subject {
  id: number;
  name: string;
  order_index: number;
  subtopics: Subtopic[];
}

export interface Resource {
  id: number;
  subject_id: number;
  type: ResourceType;
  name: string;
  total_units: number;
  completed_units: number;
  order_index: number;
}

export interface KokushiStats {
  totalSubtopics: number;
  completedSubtopics: number;
  inProgressSubtopics: number;
  daysToExam: number | null;
}

export interface ActivityRow {
  date: string;
  count: number;
}

export interface StreakSummary {
  current: number;
  longest: number;
  thisWeek: number;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function logActivity(): Promise<void> {
  if (!isTauri()) return;
  const db = await getDb();
  await db.execute(
    "INSERT INTO kokushi_activity (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1",
    [todayISO()]
  );
}

export async function getActivityMap(daysBack: number = 120): Promise<Map<string, number>> {
  ensureTauri();
  const db = await getDb();
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - daysBack);
  const rows = await db.select<ActivityRow[]>(
    "SELECT date, count FROM kokushi_activity WHERE date >= ? ORDER BY date",
    [isoDate(cutoff)]
  );
  return new Map(rows.map((r) => [r.date, r.count]));
}

export function computeStreaks(activityMap: Map<string, number>): StreakSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if ((activityMap.get(isoDate(d)) ?? 0) > 0) {
      current++;
    } else {
      break;
    }
  }

  let longest = 0;
  let running = 0;
  const dates = Array.from(activityMap.keys()).sort();
  if (dates.length > 0) {
    const earliest = new Date(dates[0] + "T00:00:00");
    const cursor = new Date(earliest);
    while (cursor <= today) {
      if ((activityMap.get(isoDate(cursor)) ?? 0) > 0) {
        running++;
        if (running > longest) longest = running;
      } else {
        running = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  let thisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    thisWeek += activityMap.get(isoDate(d)) ?? 0;
  }

  return { current, longest, thisWeek };
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function getDb() {
  const { default: Database } = await import("@tauri-apps/plugin-sql");
  return await Database.load("sqlite:med_tracker.db");
}

function ensureTauri(): void {
  if (!isTauri()) {
    throw new Error("Kokushi tracker is only available in the desktop app");
  }
}

interface SubjectRow {
  id: number;
  name: string;
  order_index: number;
}

interface SubtopicRow {
  id: number;
  subject_id: number;
  name: string;
  order_index: number;
  status: SubtopicStatus;
  progress_percent: number;
  notes: string | null;
  first_pass_done: number;
  second_pass_done: number;
  past_exams_done: number;
}

function rowToSubtopic(r: SubtopicRow): Subtopic {
  return {
    ...r,
    first_pass_done: !!r.first_pass_done,
    second_pass_done: !!r.second_pass_done,
    past_exams_done: !!r.past_exams_done,
  };
}

export async function getSubjects(): Promise<Subject[]> {
  ensureTauri();
  const db = await getDb();
  const subjectRows = await db.select<SubjectRow[]>(
    "SELECT id, name, order_index FROM kokushi_subjects ORDER BY order_index, id"
  );
  const subtopicRows = await db.select<SubtopicRow[]>(
    "SELECT id, subject_id, name, order_index, status, progress_percent, notes, first_pass_done, second_pass_done, past_exams_done FROM kokushi_subtopics ORDER BY subject_id, order_index, id"
  );
  const bySubject = new Map<number, Subtopic[]>();
  for (const r of subtopicRows) {
    const s = rowToSubtopic(r);
    if (!bySubject.has(s.subject_id)) bySubject.set(s.subject_id, []);
    bySubject.get(s.subject_id)!.push(s);
  }
  return subjectRows.map((s) => ({ ...s, subtopics: bySubject.get(s.id) ?? [] }));
}

export async function setSubtopicCheck(
  id: number,
  field: ChecklistField,
  value: boolean
): Promise<{ status: SubtopicStatus; progress_percent: number }> {
  ensureTauri();
  const db = await getDb();
  await db.execute(
    `UPDATE kokushi_subtopics SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`,
    [value ? 1 : 0, id]
  );
  const rows = await db.select<{
    first_pass_done: number;
    second_pass_done: number;
    past_exams_done: number;
  }[]>(
    "SELECT first_pass_done, second_pass_done, past_exams_done FROM kokushi_subtopics WHERE id = ?",
    [id]
  );
  const r = rows[0];
  const count = (r?.first_pass_done ?? 0) + (r?.second_pass_done ?? 0) + (r?.past_exams_done ?? 0);
  const status: SubtopicStatus =
    count === 0 ? "not_started" : count === 3 ? "completed" : "in_progress";
  const progress_percent = count === 0 ? 0 : count === 3 ? 100 : Math.round((count / 3) * 100);
  await db.execute(
    "UPDATE kokushi_subtopics SET status = ?, progress_percent = ? WHERE id = ?",
    [status, progress_percent, id]
  );
  await logActivity();
  return { status, progress_percent };
}

export interface SubtopicUpdate {
  status?: SubtopicStatus;
  progress_percent?: number;
  notes?: string | null;
}

export async function updateSubtopic(id: number, updates: SubtopicUpdate): Promise<void> {
  ensureTauri();
  const db = await getDb();
  const set: string[] = [];
  const vals: unknown[] = [];
  if (updates.status !== undefined) {
    set.push("status = ?");
    vals.push(updates.status);
    if (updates.progress_percent === undefined) {
      if (updates.status === "completed") {
        set.push("progress_percent = 100");
      } else if (updates.status === "not_started") {
        set.push("progress_percent = 0");
      }
    }
  }
  if (updates.progress_percent !== undefined) {
    const p = Math.max(0, Math.min(100, Math.round(updates.progress_percent)));
    set.push("progress_percent = ?");
    vals.push(p);
    if (updates.status === undefined) {
      if (p === 0) set.push("status = 'not_started'");
      else if (p === 100) set.push("status = 'completed'");
      else set.push("status = 'in_progress'");
    }
  }
  if (updates.notes !== undefined) {
    set.push("notes = ?");
    vals.push(updates.notes);
  }
  if (set.length === 0) return;
  set.push("updated_at = datetime('now')");
  vals.push(id);
  await db.execute(`UPDATE kokushi_subtopics SET ${set.join(", ")} WHERE id = ?`, vals);
}

export async function getResources(subjectId: number): Promise<Resource[]> {
  ensureTauri();
  const db = await getDb();
  return await db.select<Resource[]>(
    "SELECT id, subject_id, type, name, total_units, completed_units, order_index FROM kokushi_resources WHERE subject_id = ? ORDER BY order_index, id",
    [subjectId]
  );
}

export async function createResource(
  subjectId: number,
  type: ResourceType,
  name: string,
  totalUnits: number
): Promise<number> {
  ensureTauri();
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO kokushi_resources (subject_id, type, name, total_units, completed_units, order_index) VALUES (?, ?, ?, ?, 0, (SELECT COALESCE(MAX(order_index)+1, 0) FROM kokushi_resources WHERE subject_id = ?))",
    [subjectId, type, name, Math.max(1, totalUnits), subjectId]
  );
  await logActivity();
  return result.lastInsertId ?? 0;
}

export async function updateResource(
  id: number,
  updates: { name?: string; total_units?: number; completed_units?: number }
): Promise<void> {
  ensureTauri();
  const db = await getDb();
  const set: string[] = [];
  const vals: unknown[] = [];
  if (updates.name !== undefined) {
    set.push("name = ?");
    vals.push(updates.name);
  }
  if (updates.total_units !== undefined) {
    set.push("total_units = ?");
    vals.push(Math.max(1, updates.total_units));
  }
  if (updates.completed_units !== undefined) {
    set.push("completed_units = ?");
    vals.push(Math.max(0, updates.completed_units));
  }
  if (set.length === 0) return;
  vals.push(id);
  await db.execute(`UPDATE kokushi_resources SET ${set.join(", ")} WHERE id = ?`, vals);
  if (updates.completed_units !== undefined) {
    await logActivity();
  }
}

export async function deleteResource(id: number): Promise<void> {
  ensureTauri();
  const db = await getDb();
  await db.execute("DELETE FROM kokushi_resources WHERE id = ?", [id]);
}

interface SettingRow {
  value: string;
}

export async function getExamDate(): Promise<string | null> {
  ensureTauri();
  const db = await getDb();
  const rows = await db.select<SettingRow[]>(
    "SELECT value FROM kokushi_settings WHERE key = 'exam_date'"
  );
  return rows[0]?.value ?? null;
}

export async function setExamDate(date: string | null): Promise<void> {
  ensureTauri();
  const db = await getDb();
  if (date === null || date === "") {
    await db.execute("DELETE FROM kokushi_settings WHERE key = 'exam_date'");
    return;
  }
  await db.execute(
    "INSERT INTO kokushi_settings (key, value) VALUES ('exam_date', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [date]
  );
}

export function computeDaysToExam(examDate: string | null): number | null {
  if (!examDate) return null;
  const target = new Date(examDate + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function computeStats(subjects: Subject[], examDate: string | null): KokushiStats {
  let total = 0;
  let completed = 0;
  let inProgress = 0;
  for (const s of subjects) {
    for (const t of s.subtopics) {
      total++;
      if (t.status === "completed") completed++;
      else if (t.status === "in_progress") inProgress++;
    }
  }
  return {
    totalSubtopics: total,
    completedSubtopics: completed,
    inProgressSubtopics: inProgress,
    daysToExam: computeDaysToExam(examDate),
  };
}
