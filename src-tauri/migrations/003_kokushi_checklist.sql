-- 一刷 / 二刷 / 考古 checklist per subtopic
ALTER TABLE kokushi_subtopics ADD COLUMN first_pass_done  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE kokushi_subtopics ADD COLUMN second_pass_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE kokushi_subtopics ADD COLUMN past_exams_done  INTEGER NOT NULL DEFAULT 0;

-- Backfill from prior slider/status data
UPDATE kokushi_subtopics
  SET first_pass_done = 1, second_pass_done = 1, past_exams_done = 1
  WHERE status = 'completed';

UPDATE kokushi_subtopics
  SET first_pass_done = 1
  WHERE status = 'in_progress' AND progress_percent >= 33;

UPDATE kokushi_subtopics
  SET second_pass_done = 1
  WHERE status = 'in_progress' AND progress_percent >= 67;

-- Re-normalize status & progress_percent so derived values match the checklist
UPDATE kokushi_subtopics
  SET
    progress_percent = CASE (first_pass_done + second_pass_done + past_exams_done)
      WHEN 0 THEN 0
      WHEN 1 THEN 33
      WHEN 2 THEN 67
      WHEN 3 THEN 100
    END,
    status = CASE (first_pass_done + second_pass_done + past_exams_done)
      WHEN 0 THEN 'not_started'
      WHEN 3 THEN 'completed'
      ELSE 'in_progress'
    END;

-- Default exam date if user hasn't set one
INSERT OR IGNORE INTO kokushi_settings (key, value) VALUES ('exam_date', '2026-07-17');
