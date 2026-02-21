"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Target, Flame, Activity, Info } from "lucide-react";
import { Toaster, toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import InteractiveTable, { Course } from "@/components/InteractiveTable";

interface ExamRule { id: number; keyword: string; categories: string[]; }

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [rules, setRules] = useState<ExamRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("https://med-schedule-backend.onrender.com/api/courses").then(res => res.json()),
      fetch("https://med-schedule-backend.onrender.com/api/exam-rules").then(res => res.json())
    ]).then(([coursesData, rulesData]) => {
      setCourses(coursesData);
      setRules(rulesData);
      setLoading(false);
    }).catch(() => toast.error("系統連線異常"));
  }, []);

  const handleUpdateCourse = async (courseId: number, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
    try {
      await fetch(`https://med-schedule-backend.onrender.com/api/courses/${courseId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates)
      });
    } catch { toast.error("儲存失敗"); }
  };

  const isStudied = (progress: any) => {
    if (!Array.isArray(progress)) return false;
    return progress.some(p => ["一刷", "二刷", "寫考古"].includes(p));
  };

  const today = new Date();
  const allExams = courses.filter(c => c.category === "Exam").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const getExamTargetCategories = (examTopic: string, courseTopic: string = ""): string[] => {
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

  const enrichedCourses = courses.map(course => {
    if (course.target_exam_override) {
      return { ...course, target_exam: course.target_exam_override };
    }
    let target_exam = "";
    if (!["Exam", "國考複習", "PBL", "Holiday"].includes(course.category)) {
      const matchedExam = allExams.find(exam => {
        const isAfter = new Date(exam.date) >= new Date(course.date);
        const targetCategories = getExamTargetCategories(exam.topic, course.topic);
        const isIncluded = targetCategories.some(t => t.toLowerCase() === course.category.toLowerCase());
        return isAfter && isIncluded;
      });
      if (matchedExam) target_exam = matchedExam.topic;
    }
    return { ...course, target_exam };
  });

  let nextExam = allExams.find(e => new Date(e.date) >= today) || allExams[0];
  let blockCourses: Course[] = [];
  let daysToExam = 0;
  
  if (nextExam) {
    const nextExamDate = new Date(nextExam.date);
    daysToExam = Math.ceil((nextExamDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    blockCourses = enrichedCourses.filter(c => c.target_exam === nextExam?.topic && !["Exam", "國考複習", "PBL"].includes(c.category));
  }

  const blockTotal = blockCourses.length;
  const blockStudied = blockCourses.filter(c => isStudied(c.study_progress)).length;
  const blockProgressRate = blockTotal > 0 ? (blockStudied / blockTotal) * 100 : 0;
  const blockCategoriesIncluded = Array.from(new Set(blockCourses.map(c => c.category))).join("、");

  const subjectStats = Array.from(new Set(courses.map(c => c.category)))
    .filter(cat => !["Exam", "國考複習", "PBL", "Skill"].includes(cat))
    .map(category => {
      const catCourses = courses.filter(c => c.category === category);
      const total = catCourses.length;
      return { category, total, studied: catCourses.filter(c => isStudied(c.study_progress)).length, rate: total > 0 ? (catCourses.filter(c => isStudied(c.study_progress)).length / total) * 100 : 0 };
    }).sort((a, b) => b.total - a.total);

  const calendarEvents = enrichedCourses.map(course => {
    const [startT, endT] = course.time_slot.split("-");
    let bgColor = "#ef4444"; 
    if (course.category === "Exam") bgColor = "#000000"; 
    else if (course.category === "PBL") bgColor = "#a855f7"; 
    else if (isStudied(course.study_progress)) bgColor = "#22c55e"; 
    else if (["現場出席", "錄影補課"].includes(course.attendance)) bgColor = "#3b82f6";
    return { id: String(course.id), title: `[${course.category}] ${course.topic}`, start: `${course.date}T${startT}`, end: `${course.date}T${endT}`, backgroundColor: bgColor, borderColor: bgColor, textColor: "#ffffff" };
  });

  return (
    <main className="min-h-screen bg-zinc-50/50 p-6 md:p-10 text-zinc-900 font-sans">
      <Toaster position="bottom-right" />
      <style dangerouslySetInnerHTML={{__html: `.fc-theme-standard td, .fc-theme-standard th { border-color: #e4e4e7; } .fc-timegrid-slot { height: 4rem !important; } .fc-event-main { white-space: normal !important; padding: 8px !important; line-height: 1.5; font-size: 0.95rem; font-weight: 600; overflow-y: auto !important; } .fc-v-event { border-radius: 6px; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }`}} />
      
      {/* 🚀 關鍵修改：將畫布大幅加寬至 max-w-[1600px] */}
      <div className="max-w-[1600px] mx-auto space-y-10">
        
        <header className="border-b border-zinc-200 pb-6 pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-zinc-900 mb-3">NYCU Med10 戰略儀表板</h1>
            <p className="text-zinc-500 text-xl font-bold flex items-center gap-2"><CalendarIcon className="w-6 h-6" /> 114-2 學期 臨床醫學進度追蹤</p>
          </div>
        </header>

        {loading ? <div className="flex justify-center items-center h-64 text-zinc-400 font-bold text-xl">系統核心啟動中...</div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="shadow-sm border-zinc-200 bg-white p-2">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-zinc-500 flex items-center gap-2"><Flame className="w-6 h-6 text-orange-500" /> 下一場區段考倒數</CardTitle>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-none font-bold text-base px-3 py-1">{nextExam?.date || "未知"}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-3">
                    <span className="text-7xl font-black text-zinc-900">{daysToExam > 0 ? daysToExam : 0}</span>
                    <span className="text-2xl text-zinc-500 font-bold">天</span>
                  </div>
                  <p className="text-lg text-zinc-500 mt-4 font-bold truncate">目標：{nextExam?.topic || "尚未排定"}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-zinc-200 bg-white overflow-hidden p-2">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-zinc-500 flex items-center gap-2"><Target className="w-6 h-6 text-green-600" /> 該考區精準內化率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-black text-zinc-900">{blockProgressRate.toFixed(1)} <span className="text-3xl text-zinc-400 font-bold">%</span></div>
                  <div className="flex items-center justify-between mt-5 text-base font-bold text-zinc-500 mb-2">
                    <span>已掌握 <span className="text-zinc-800">{blockStudied}</span> 堂</span>
                    <span>範圍總計 <span className="text-zinc-800">{blockTotal}</span> 堂</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden mb-4">
                    <div className="bg-green-500 h-full transition-all duration-1000 ease-out" style={{ width: `${blockProgressRate}%` }} />
                  </div>
                  <div className="text-sm text-zinc-500 bg-zinc-50 p-3 rounded-lg flex items-start gap-2 border border-zinc-100 font-medium">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" /><span className="leading-relaxed">範圍涵蓋：{blockCategoriesIncluded || "無"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <h3 className="text-xl font-black text-zinc-800 mb-6 flex items-center gap-2"><Activity className="w-6 h-6 text-blue-500" /> 各科目獨立進度追蹤</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
                {subjectStats.slice(0, 16).map(stat => (
                  <div key={stat.category} className="space-y-2">
                    <div className="flex justify-between items-center text-base">
                      <span className="font-bold text-zinc-700 truncate pr-2" title={stat.category}>{stat.category}</span>
                      <span className="text-zinc-500 font-mono text-sm font-bold">{stat.studied}/{stat.total}</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${stat.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
              <div className="flex justify-between items-end mb-6 mt-10">
                <TabsList className="bg-zinc-100/80 p-1.5 rounded-lg">
                  <TabsTrigger value="list" className="font-bold text-base px-6 py-2">📝 互動列表</TabsTrigger>
                  <TabsTrigger value="calendar" className="font-bold text-base px-6 py-2">📅 戰略週曆</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="list" className="bg-white border border-zinc-200 rounded-2xl shadow-sm mt-0 p-6">
                <InteractiveTable courses={enrichedCourses} allExams={allExams} onUpdateCourse={handleUpdateCourse} />
              </TabsContent>
              <TabsContent value="calendar" className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm mt-0">
                <FullCalendar plugins={[dayGridPlugin, timeGridPlugin]} initialView="timeGridWeek" headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }} slotMinTime="08:00:00" slotMaxTime="18:00:00" height={1000} events={calendarEvents} expandRows={true} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}