CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT,
  date TEXT NOT NULL,
  time_slot TEXT,
  category TEXT,
  topic TEXT,
  teacher TEXT,
  attendance TEXT DEFAULT '未標記',
  study_progress TEXT DEFAULT '[]',
  target_exam_override TEXT,
  notes TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_course_date_time_slot ON courses(date, time_slot);

CREATE TABLE IF NOT EXISTS exam_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_keyword TEXT UNIQUE,
  target_categories TEXT DEFAULT '[]'
);
