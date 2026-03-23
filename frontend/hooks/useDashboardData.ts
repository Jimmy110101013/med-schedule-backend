"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import type { Course } from "@/components/InteractiveTable";
import { isStudied, isMastered, PROGRESS_TYPES, EXCLUDED_FROM_FOCUS } from "@/lib/constants";
import { getCourses, updateCourse as apiUpdateCourse, getExamRules } from "@/lib/api";
import type { ExamRule } from "@/lib/api";

export { isStudied, isMastered };
export type { ExamRule };

const getExamTargetCategories = (examTopic: string, courseTopic: string = "", rules: ExamRule[]): string[] => {
  const lowerExam = examTopic.toLowerCase();
  const lowerCourse = courseTopic.toLowerCase();
  const isCancerRelated = ["cancer", "tumor", "malignancy", "oncology"].some(k => lowerCourse.includes(k));
  if (isCancerRelated && (lowerExam.includes("腫瘤") || lowerExam.includes("oncology"))) {
    for (const rule of rules) {
      if (rule.keyword.includes("腫瘤") || rule.keyword.toLowerCase().includes("oncology")) {
        return rule.categories;
      }
    }
  }
  for (const rule of rules) {
    if (lowerExam.includes(rule.keyword.toLowerCase())) {
      return rule.categories;
    }
  }
  return [];
};

export function useDashboardData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [rules, setRules] = useState<ExamRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCourses(), getExamRules()])
      .then(([coursesData, rulesData]) => {
        setCourses(coursesData);
        setRules(rulesData);
        setLoading(false);
      })
      .catch(() => toast.error("Connection error"));
  }, []);

  const handleUpdateCourse = async (courseId: number, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
    try {
      await apiUpdateCourse(courseId, updates);
    } catch { toast.error("Save failed"); }
  };

  const allExams = useMemo(
    () => courses.filter(c => c.category === "Exam").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [courses]
  );

  const enrichedCourses = useMemo(() => courses.map(course => {
    if (course.target_exam_override) {
      return { ...course, target_exam: course.target_exam_override };
    }
    let target_exam = "";
    if (!EXCLUDED_FROM_FOCUS.includes(course.category)) {
      const matchedExam = allExams.find(exam => {
        const isAfter = new Date(exam.date) >= new Date(course.date);
        const targetCategories = getExamTargetCategories(exam.topic, course.topic, rules);
        const isIncluded = targetCategories.some(t => t.toLowerCase() === course.category.toLowerCase());
        return isAfter && isIncluded;
      });
      if (matchedExam) target_exam = matchedExam.topic;
    }
    return { ...course, target_exam };
  }), [courses, allExams, rules]);

  const subjectStats = useMemo(() => Array.from(new Set(courses.map(c => c.category)))
    .filter(cat => !["Exam", "國考複習", "PBL", "Skill"].includes(cat))
    .map(category => {
      const catCourses = courses.filter(c => c.category === category);
      const total = catCourses.length;
      const studied = catCourses.filter(c => isMastered(c)).length;
      return { category, total, studied, rate: total > 0 ? (studied / total) * 100 : 0 };
    }).sort((a, b) => b.total - a.total),
    [courses]
  );

  const calendarEvents = useMemo(() => enrichedCourses.map(course => {
    const [startT, endT] = course.time_slot.split("-");
    let bgColor = "var(--fc-default)";
    if (course.category === "Exam") bgColor = "var(--fc-exam)";
    else if (course.category === "PBL") bgColor = isMastered(course) ? "var(--fc-studied)" : "var(--fc-pbl)";
    else if (course.category === "Skill") bgColor = isMastered(course) ? "var(--fc-studied)" : "var(--fc-default)";
    else if (isStudied(course.study_progress)) bgColor = "var(--fc-studied)";
    else if (["現場出席", "錄影補課"].includes(course.attendance)) bgColor = "var(--fc-attended)";
    return { id: String(course.id), title: `[${course.category}] ${course.topic}`, start: `${course.date}T${startT}`, end: `${course.date}T${endT}`, backgroundColor: bgColor, borderColor: bgColor, textColor: "#f0ebe5" };
  }), [enrichedCourses]);

  return { enrichedCourses, allExams, loading, subjectStats, calendarEvents, handleUpdateCourse };
}
