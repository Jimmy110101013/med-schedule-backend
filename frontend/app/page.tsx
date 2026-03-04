"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Target, Flame, Activity, Info, Sun, Moon, Zap } from "lucide-react";
import { Toaster } from "sonner";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import InteractiveTable from "@/components/InteractiveTable";
import type { Course } from "@/components/InteractiveTable";
import CalendarEventModal from "@/components/CalendarEventModal";
import { useDashboardData, isStudied } from "@/hooks/useDashboardData";

const EXCLUDED_FROM_FOCUS = ["Exam", "PBL", "Holiday", "國考複習"];

export default function Home() {
  const { enrichedCourses, allExams, loading, subjectStats, calendarEvents, handleUpdateCourse } = useDashboardData();
  const [selectedEventCourse, setSelectedEventCourse] = useState<{ course: Course; position: { x: number; y: number } } | null>(null);
  const { theme, setTheme } = useTheme();
  const [focusMode, setFocusMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const focusFilteredCourses = useMemo(() => {
    if (!focusMode) return enrichedCourses;
    const today = new Date();
    return enrichedCourses.filter(course => {
      if (!course.target_exam) return false;
      if (EXCLUDED_FROM_FOCUS.includes(course.category)) return false;
      const exam = allExams.find(e => e.topic === course.target_exam);
      if (!exam) return false;
      const days = Math.ceil((new Date(exam.date).getTime() - today.getTime()) / (1000 * 3600 * 24));
      return days >= 0 && days < 7 && !isStudied(course.study_progress);
    });
  }, [enrichedCourses, focusMode, allExams]);

  const { nextExam, blockCourses, daysToExam, blockProgressRate, blockStudied, blockTotal, blockCategoriesIncluded } = useMemo(() => {
    const today = new Date();
    const nextExam = allExams.find(e => new Date(e.date) >= today) || allExams[0];
    let blockCourses: Course[] = [];
    let daysToExam = 0;
    if (nextExam) {
      daysToExam = Math.ceil((new Date(nextExam.date).getTime() - today.getTime()) / (1000 * 3600 * 24));
      blockCourses = enrichedCourses.filter(c => c.target_exam === nextExam.topic && !["Exam", "國考複習", "PBL"].includes(c.category));
    }
    const blockTotal = blockCourses.length;
    const blockStudied = blockCourses.filter(c => isStudied(c.study_progress)).length;
    const blockProgressRate = blockTotal > 0 ? (blockStudied / blockTotal) * 100 : 0;
    const blockCategoriesIncluded = Array.from(new Set(blockCourses.map(c => c.category))).join("、");
    return { nextExam, blockCourses, daysToExam, blockProgressRate, blockStudied, blockTotal, blockCategoriesIncluded };
  }, [enrichedCourses, allExams]);

  return (
    <main className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-4 md:p-8 text-zinc-900 dark:text-zinc-100 font-sans text-sm md:text-base">
      <Toaster position="bottom-right" />

      <div className="max-w-[1400px] mx-auto space-y-8">

        <header className="border-b border-zinc-200 dark:border-zinc-700 pb-4 pt-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">NYCU Med10 戰略儀表板</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg font-bold flex items-center gap-2"><CalendarIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> 114-2 學期 臨床醫學進度追蹤</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Focus Mode toggle */}
            <button
              onClick={() => setFocusMode(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                focusMode
                  ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 hover:border-orange-300"
              }`}
            >
              <Zap className="w-4 h-4" />
              {focusMode ? "專注中" : "專注模式"}
            </button>
            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 transition-colors"
              aria-label="Toggle dark mode"
            >
              {mounted ? (theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-zinc-600" />) : <Moon className="w-5 h-5 text-zinc-600" />}
            </button>
          </div>
        </header>

        {loading ? <div className="flex justify-center items-center h-64 text-zinc-400 font-bold text-lg">系統核心啟動中...</div> : (
          <>
            {/* Focus Mode banner */}
            {focusMode && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 font-bold">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 shrink-0" />
                  <span>⚠️ 專注模式：僅顯示 <strong>{focusFilteredCourses.length}</strong> 門高危科目（考期不到 7 天，進度為零）</span>
                </div>
                <button
                  onClick={() => setFocusMode(false)}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 font-bold text-lg leading-none px-1"
                  aria-label="Exit focus mode"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-1">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> 下一場區段考倒數</CardTitle>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-none font-bold text-sm px-3 py-1">{nextExam?.date || "未知"}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-zinc-900 dark:text-zinc-100">{daysToExam > 0 ? daysToExam : 0}</span>
                    <span className="text-xl text-zinc-500 dark:text-zinc-400 font-bold">天</span>
                  </div>
                  <p className="text-base text-zinc-500 dark:text-zinc-400 mt-3 font-bold truncate">目標：{nextExam?.topic || "尚未排定"}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 overflow-hidden p-1">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><Target className="w-5 h-5 text-green-600" /> 該考區精準內化率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{blockProgressRate.toFixed(1)} <span className="text-2xl text-zinc-400 dark:text-zinc-500 font-bold">%</span></div>
                  <div className="flex items-center justify-between mt-4 text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-2">
                    <span>已掌握 <span className="text-zinc-800 dark:text-zinc-200">{blockStudied}</span> 堂</span>
                    <span>範圍總計 <span className="text-zinc-800 dark:text-zinc-200">{blockTotal}</span> 堂</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden mb-3">
                    <div className="bg-green-500 h-full transition-all duration-1000 ease-out" style={{ width: `${blockProgressRate}%` }} />
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-700/50 p-2.5 rounded-lg flex items-start gap-2 border border-zinc-100 dark:border-zinc-600 font-medium">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" /><span className="leading-relaxed">範圍涵蓋：{blockCategoriesIncluded || "無"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white dark:bg-zinc-800/80 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 mb-5 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> 各科目獨立進度追蹤</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
                {subjectStats.slice(0, 16).map(stat => (
                  <div key={stat.category} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate pr-2" title={stat.category}>{stat.category}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs font-bold">{stat.studied}/{stat.total}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${stat.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
              <div className="flex justify-between items-end mb-4 mt-8">
                <TabsList className="bg-zinc-100/80 dark:bg-zinc-800 p-1 rounded-lg">
                  <TabsTrigger value="list" className="font-bold text-sm px-5 py-1.5">📝 互動列表</TabsTrigger>
                  <TabsTrigger value="calendar" className="font-bold text-sm px-5 py-1.5">📅 戰略週曆</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="list" className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm mt-0 p-5 table-container">
                <InteractiveTable
                  courses={focusFilteredCourses}
                  allExams={allExams}
                  onUpdateCourse={handleUpdateCourse}
                  focusMode={focusMode}
                />
              </TabsContent>
              <TabsContent value="calendar" className="bg-white dark:bg-zinc-800/80 p-3 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm mt-0 relative overflow-hidden">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  initialView={isMobile ? "listWeek" : "timeGridWeek"}
                  headerToolbar={
                    isMobile
                      ? { left: "prev,next", center: "title", right: "listWeek,timeGridDay" }
                      : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }
                  }
                  slotMinTime="08:00:00"
                  slotMaxTime="18:00:00"
                  height={isMobile ? "auto" : 900}
                  events={calendarEvents}
                  expandRows={!isMobile}
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
