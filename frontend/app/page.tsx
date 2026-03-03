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
import interactionPlugin from "@fullcalendar/interaction";
import InteractiveTable, { Course } from "@/components/InteractiveTable";
import CalendarEventModal from "@/components/CalendarEventModal";

interface ExamRule { id: number; keyword: string; categories: string[]; }

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [rules, setRules] = useState<ExamRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventCourse, setSelectedEventCourse] = useState<{ course: Course; position: { x: number; y: number } } | null>(null);

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
    <main className="min-h-screen bg-zinc-50/50 p-4 md:p-8 text-zinc-900 font-sans text-sm md:text-base">
      <Toaster position="bottom-right" />
      <style dangerouslySetInnerHTML={{__html: `
        .fc-theme-standard td, .fc-theme-standard th { border-color: #e4e4e7; } 
        .fc-timegrid-slot { height: 3.5rem !important; } 
        .fc-event-main { white-space: normal !important; padding: 6px !important; line-height: 1.4; font-size: 0.85rem; font-weight: 600; overflow-y: auto !important; } 
        .fc-v-event { border-radius: 6px; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        /* 🚀 新增：全域表格防擠壓與文字截斷設定 */
        .table-container table { table-layout: fixed; width: 100%; }
        .course-truncate { max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
      `}} />
      
      {/* 關鍵修改：畫布寬度保留，但內部間距與字體稍微收斂 */}
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        <header className="border-b border-zinc-200 pb-4 pt-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-2">NYCU Med10 戰略儀表板</h1>
            <p className="text-zinc-500 text-lg font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5" /> 114-2 學期 臨床醫學進度追蹤</p>
          </div>
        </header>

        {loading ? <div className="flex justify-center items-center h-64 text-zinc-400 font-bold text-lg">系統核心啟動中...</div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-zinc-200 bg-white p-1">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-zinc-500 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> 下一場區段考倒數</CardTitle>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-none font-bold text-sm px-3 py-1">{nextExam?.date || "未知"}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-zinc-900">{daysToExam > 0 ? daysToExam : 0}</span>
                    <span className="text-xl text-zinc-500 font-bold">天</span>
                  </div>
                  <p className="text-base text-zinc-500 mt-3 font-bold truncate">目標：{nextExam?.topic || "尚未排定"}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-zinc-200 bg-white overflow-hidden p-1">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-zinc-500 flex items-center gap-2"><Target className="w-5 h-5 text-green-600" /> 該考區精準內化率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-zinc-900">{blockProgressRate.toFixed(1)} <span className="text-2xl text-zinc-400 font-bold">%</span></div>
                  <div className="flex items-center justify-between mt-4 text-sm font-bold text-zinc-500 mb-2">
                    <span>已掌握 <span className="text-zinc-800">{blockStudied}</span> 堂</span>
                    <span>範圍總計 <span className="text-zinc-800">{blockTotal}</span> 堂</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden mb-3">
                    <div className="bg-green-500 h-full transition-all duration-1000 ease-out" style={{ width: `${blockProgressRate}%` }} />
                  </div>
                  <div className="text-xs text-zinc-500 bg-zinc-50 p-2.5 rounded-lg flex items-start gap-2 border border-zinc-100 font-medium">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" /><span className="leading-relaxed">範圍涵蓋：{blockCategoriesIncluded || "無"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <h3 className="text-lg font-black text-zinc-800 mb-5 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> 各科目獨立進度追蹤</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
                {subjectStats.slice(0, 16).map(stat => (
                  <div key={stat.category} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-700 truncate pr-2" title={stat.category}>{stat.category}</span>
                      <span className="text-zinc-500 font-mono text-xs font-bold">{stat.studied}/{stat.total}</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${stat.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
              <div className="flex justify-between items-end mb-4 mt-8">
                <TabsList className="bg-zinc-100/80 p-1 rounded-lg">
                  <TabsTrigger value="list" className="font-bold text-sm px-5 py-1.5">📝 互動列表</TabsTrigger>
                  <TabsTrigger value="calendar" className="font-bold text-sm px-5 py-1.5">📅 戰略週曆</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="list" className="bg-white border border-zinc-200 rounded-2xl shadow-sm mt-0 p-5 table-container">
                <InteractiveTable courses={enrichedCourses} allExams={allExams} onUpdateCourse={handleUpdateCourse} />
              </TabsContent>
              <TabsContent value="calendar" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mt-0 relative">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
                  slotMinTime="08:00:00"
                  slotMaxTime="18:00:00"
                  height={900}
                  events={calendarEvents}
                  expandRows={true}
                  eventClick={(info) => {
                    const course = enrichedCourses.find(c => String(c.id) === info.event.id);
                    if (course) {
                      const rect = info.el.getBoundingClientRect();
                      setSelectedEventCourse({ course, position: { x: rect.right, y: rect.top } });
                    }
                  }}
                />
                {selectedEventCourse && (
                  <CalendarEventModal
                    course={enrichedCourses.find(c => c.id === selectedEventCourse.course.id) || selectedEventCourse.course}
                    position={selectedEventCourse.position}
                    onUpdate={handleUpdateCourse}
                    onClose={() => setSelectedEventCourse(null)}
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}