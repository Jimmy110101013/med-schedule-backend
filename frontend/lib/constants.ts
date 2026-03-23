export const ATTENDANCE_OPTIONS = ["未標記", "現場出席", "錄影補課", "加強複習"];
export const PROGRESS_TYPES = ["一刷", "二刷", "寫考古"];
export const EXCLUDED_FROM_FOCUS = ["Exam", "PBL", "Holiday", "國考複習"];

export const ATTENDANCE_ONLY_CATEGORIES = ["PBL", "Skill"];

export const isStudied = (progress: unknown): boolean => {
  if (!Array.isArray(progress)) return false;
  return progress.some(p => PROGRESS_TYPES.includes(p));
};

export const isMastered = (course: { category: string; attendance: string; study_progress: string[] }): boolean => {
  if (ATTENDANCE_ONLY_CATEGORIES.includes(course.category)) {
    return course.attendance === "現場出席";
  }
  return isStudied(course.study_progress);
};
