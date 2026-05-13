-- Reset inflated kokushi_activity counts from versions that logged every
-- check + uncheck + re-check as separate events. v0.2.4 onward uses a
-- dedup log to count each (date, subtopic, field) at most once per day.
DELETE FROM kokushi_activity;

CREATE TABLE IF NOT EXISTS kokushi_subtopic_check_log (
  date        TEXT NOT NULL,
  subtopic_id INTEGER NOT NULL,
  field       TEXT NOT NULL,
  PRIMARY KEY (date, subtopic_id, field)
);
