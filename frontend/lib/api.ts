import type { Course } from "@/components/InteractiveTable";

export interface ExamRule {
  id: number;
  keyword: string;
  categories: string[];
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ---------------------------------------------------------------------------
// Tauri (SQLite) helpers
// ---------------------------------------------------------------------------

async function getDb() {
  const { default: Database } = await import("@tauri-apps/plugin-sql");
  return await Database.load("sqlite:med_tracker.db");
}

interface CourseRow {
  id: number;
  course_code: string;
  date: string;
  time_slot: string;
  category: string;
  topic: string;
  teacher: string;
  attendance: string;
  study_progress: string;
  target_exam_override: string | null;
  notes: string | null;
}

interface ExamRuleRow {
  id: number;
  exam_keyword: string;
  target_categories: string;
}

function parseStudyProgress(raw: string): string[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function parseCourseRow(row: CourseRow): Course {
  return {
    ...row,
    study_progress: parseStudyProgress(row.study_progress),
    target_exam_override: row.target_exam_override ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function parseExamRuleRow(row: ExamRuleRow): ExamRule {
  let categories: string[] = [];
  try {
    categories = JSON.parse(row.target_categories);
  } catch {
    /* empty */
  }
  return { id: row.id, keyword: row.exam_keyword, categories };
}

// ---------------------------------------------------------------------------
// Public API — each function branches on isTauri()
// ---------------------------------------------------------------------------

const API = process.env.NEXT_PUBLIC_API_URL;

export async function getCourses(): Promise<Course[]> {
  if (isTauri()) {
    const db = await getDb();
    const rows = await db.select<CourseRow[]>("SELECT * FROM courses ORDER BY date, time_slot");
    return rows.map(parseCourseRow);
  }
  const res = await fetch(`${API}/api/courses`);
  return res.json();
}

export async function updateCourse(id: number, updates: Partial<Course>): Promise<void> {
  if (isTauri()) {
    const db = await getDb();
    const setClauses: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (key === "id") continue;
      const col = key === "study_progress" ? "study_progress" : key;
      setClauses.push(`${col} = ?`);
      values.push(key === "study_progress" ? JSON.stringify(value) : value);
    }
    if (setClauses.length === 0) return;
    values.push(id);
    await db.execute(`UPDATE courses SET ${setClauses.join(", ")} WHERE id = ?`, values);
    return;
  }
  await fetch(`${API}/api/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function getExamRules(): Promise<ExamRule[]> {
  if (isTauri()) {
    const db = await getDb();
    const rows = await db.select<ExamRuleRow[]>("SELECT * FROM exam_rules");
    return rows.map(parseExamRuleRow);
  }
  const res = await fetch(`${API}/api/exam-rules`);
  return res.json();
}

export async function createExamRule(keyword: string, categories: string[]): Promise<boolean> {
  if (isTauri()) {
    const db = await getDb();
    await db.execute(
      "INSERT INTO exam_rules (exam_keyword, target_categories) VALUES (?, ?)",
      [keyword, JSON.stringify(categories)]
    );
    return true;
  }
  const res = await fetch(`${API}/api/exam-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, categories }),
  });
  return res.ok;
}

export async function updateExamRule(id: number, keyword: string, categories: string[]): Promise<boolean> {
  if (isTauri()) {
    const db = await getDb();
    await db.execute(
      "UPDATE exam_rules SET exam_keyword = ?, target_categories = ? WHERE id = ?",
      [keyword, JSON.stringify(categories), id]
    );
    return true;
  }
  const res = await fetch(`${API}/api/exam-rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, categories }),
  });
  return res.ok;
}

export async function deleteExamRule(id: number): Promise<boolean> {
  if (isTauri()) {
    const db = await getDb();
    await db.execute("DELETE FROM exam_rules WHERE id = ?", [id]);
    return true;
  }
  const res = await fetch(`${API}/api/exam-rules/${id}`, { method: "DELETE" });
  return res.ok;
}

// ---------------------------------------------------------------------------
// PDF Import (Tauri-only via sidecar)
// ---------------------------------------------------------------------------

export async function importPdf(filePath: string): Promise<Course[]> {
  const { Command } = await import("@tauri-apps/plugin-shell");
  const result = await Command.sidecar("binaries/pdf-parser", [filePath]).execute();
  if (result.code !== 0) {
    throw new Error(result.stderr || "PDF parser failed");
  }
  return JSON.parse(result.stdout);
}

export interface ParsedCourse {
  course_code?: string;
  date: string;
  time_slot: string;
  category: string;
  topic: string;
  teacher: string;
}

export async function insertParsedCourses(courses: ParsedCourse[]): Promise<number> {
  const db = await getDb();
  let inserted = 0;
  for (const c of courses) {
    await db.execute(
      `INSERT OR REPLACE INTO courses (course_code, date, time_slot, category, topic, teacher, attendance, study_progress)
       VALUES (?, ?, ?, ?, ?, ?, '未標記', '[]')`,
      [c.course_code ?? "", c.date, c.time_slot, c.category, c.topic, c.teacher]
    );
    inserted++;
  }
  return inserted;
}
