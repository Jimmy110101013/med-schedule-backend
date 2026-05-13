import type Database from "@tauri-apps/plugin-sql";

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

export function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let _dbPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const { default: Db } = await import("@tauri-apps/plugin-sql");
      return await Db.load("sqlite:med_tracker.db");
    })();
  }
  return _dbPromise;
}

function ensureTauri(): void {
  if (!isTauri()) {
    throw new Error("Kokushi tracker is only available in the desktop app");
  }
}

function deriveFromChecks(count: number): { status: SubtopicStatus; progress_percent: number } {
  if (count === 0) return { status: "not_started", progress_percent: 0 };
  if (count === 3) return { status: "completed", progress_percent: 100 };
  return { status: "in_progress", progress_percent: Math.round((count / 3) * 100) };
}

export async function logActivity(): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO kokushi_activity (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1",
    [todayISO()]
  );
}

async function logSubtopicCheckOnce(subtopicId: number, field: ChecklistField): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT OR IGNORE INTO kokushi_subtopic_check_log (date, subtopic_id, field) VALUES (?, ?, ?)",
    [todayISO(), subtopicId, field]
  );
  const inserted = (result.rowsAffected ?? 0) > 0;
  if (inserted) await logActivity();
  return inserted;
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
): Promise<{ status: SubtopicStatus; progress_percent: number; activityLogged: boolean }> {
  ensureTauri();
  const db = await getDb();
  const rows = await db.select<{
    first_pass_done: number;
    second_pass_done: number;
    past_exams_done: number;
  }[]>(
    "SELECT first_pass_done, second_pass_done, past_exams_done FROM kokushi_subtopics WHERE id = ?",
    [id]
  );
  const current = rows[0];
  if (!current) throw new Error(`Subtopic ${id} not found`);
  const updated = { ...current, [field]: value ? 1 : 0 };
  const count = updated.first_pass_done + updated.second_pass_done + updated.past_exams_done;
  const derived = deriveFromChecks(count);
  await db.execute(
    `UPDATE kokushi_subtopics SET ${field} = ?, status = ?, progress_percent = ?, updated_at = datetime('now') WHERE id = ?`,
    [value ? 1 : 0, derived.status, derived.progress_percent, id]
  );
  const activityLogged = value ? await logSubtopicCheckOnce(id, field) : false;
  return { ...derived, activityLogged };
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

export async function getTodayTarget(): Promise<number | null> {
  ensureTauri();
  const db = await getDb();
  const rows = await db.select<{ subtopic_id: number }[]>(
    "SELECT subtopic_id FROM kokushi_daily_target WHERE date = ?",
    [todayISO()]
  );
  return rows[0]?.subtopic_id ?? null;
}

export async function setTodayTarget(subtopicId: number | null): Promise<void> {
  ensureTauri();
  const db = await getDb();
  if (subtopicId === null) {
    await db.execute("DELETE FROM kokushi_daily_target WHERE date = ?", [todayISO()]);
    return;
  }
  await db.execute(
    "INSERT INTO kokushi_daily_target (date, subtopic_id) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET subtopic_id = excluded.subtopic_id",
    [todayISO(), subtopicId]
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

export function computeStreaks(activityMap: Map<string, number>): StreakSummary {
  if (activityMap.size === 0) return { current: 0, longest: 0, thisWeek: 0 };

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
  const sortedDates = Array.from(activityMap.keys()).sort();
  const earliest = new Date(sortedDates[0] + "T00:00:00");
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

  let thisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    thisWeek += activityMap.get(isoDate(d)) ?? 0;
  }

  return { current, longest, thisWeek };
}
