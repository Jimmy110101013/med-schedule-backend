"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import type { Course } from "@/components/InteractiveTable";

export interface ExamRule { id: number; keyword: string; categories: string[]; }

export const isStudied = (progress: any): boolean => {
  if (!Array.isArray(progress)) return false;
  return progress.some(p => ["一刷", "二刷", "寫考古"].includes(p));
};

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
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exam-rules`).then(res => res.json())
    ]).then(([coursesData, rulesData]) => {
      setCourses(coursesData);
      setRules(rulesData);
      setLoading(false);
    }).catch(() => toast.error("系統連線異常"));
  }, []);

  const handleUpdateCourse = async (courseId: number, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates)
      });
    } catch { toast.error("儲存失敗"); }
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
    if (!["Exam", "國考複習", "PBL", "Holiday"].includes(course.category)) {
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
      const studied = catCourses.filter(c => isStudied(c.study_progress)).length;
      return { category, total, studied, rate: total > 0 ? (studied / total) * 100 : 0 };
    }).sort((a, b) => b.total - a.total),
    [courses]
  );

  const calendarEvents = useMemo(() => enrichedCourses.map(course => {
    const [startT, endT] = course.time_slot.split("-");
    let bgColor = "#ef4444";
    if (course.category === "Exam") bgColor = "#000000";
    else if (course.category === "PBL") bgColor = "#a855f7";
    else if (isStudied(course.study_progress)) bgColor = "#22c55e";
    else if (["現場出席", "錄影補課"].includes(course.attendance)) bgColor = "#3b82f6";
    return { id: String(course.id), title: `[${course.category}] ${course.topic}`, start: `${course.date}T${startT}`, end: `${course.date}T${endT}`, backgroundColor: bgColor, borderColor: bgColor, textColor: "#ffffff" };
  }), [enrichedCourses]);

  return { enrichedCourses, allExams, loading, subjectStats, calendarEvents, handleUpdateCourse };
}
