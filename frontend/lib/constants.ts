export const ATTENDANCE_OPTIONS = ["未標記", "現場出席", "錄影補課", "加強複習"];
export const PROGRESS_TYPES = ["一刷", "二刷", "寫考古"];
export const EXCLUDED_FROM_FOCUS = ["Exam", "PBL", "Holiday", "國考複習"];

export const isStudied = (progress: unknown): boolean => {
  if (!Array.isArray(progress)) return false;
  return progress.some(p => PROGRESS_TYPES.includes(p));
};
