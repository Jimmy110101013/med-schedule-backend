import { useState, useMemo, memo } from "react";
import { ATTENDANCE_OPTIONS, PROGRESS_TYPES, isStudied } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Filter, Target, Activity } from "lucide-react";

export interface Course {
  id: number;
  date: string;
  time_slot: string;
  category: string;
  topic: string;
  teacher: string;
  attendance: string;
  study_progress: string[];
  target_exam?: string;
  target_exam_override?: string;
  notes?: string;
}

interface InteractiveTableProps {
  courses: Course[];
  allExams: any[];
  onUpdateCourse: (id: number, updates: Partial<Course>) => void;
  focusMode?: boolean;
}


function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge
      variant="outline"
      title={category}
      className={`text-xs px-2 py-0.5 font-bold max-w-[130px] truncate inline-block align-middle ${
        category === "Exam"
          ? "border-foreground bg-foreground text-background"
          : category === "PBL"
          ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          : "bg-muted text-foreground"
      }`}
    >
      {category}
    </Badge>
  );
}

const ProgressCheckboxes = memo(function ProgressCheckboxes({
  course,
  onToggle,
}: {
  course: Course;
  onToggle: (course: Course, type: string, checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {PROGRESS_TYPES.map((type) => {
        const checked = Array.isArray(course.study_progress) && course.study_progress.includes(type);
        return (
          <label
            key={type}
            className={`flex items-center gap-1.5 text-sm cursor-pointer transition-colors ${
              checked
                ? "text-green-700 dark:text-green-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground font-bold"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onToggle(course, type, e.target.checked)}
              className="w-5 h-5 rounded border-2 border-border text-green-600 focus:ring-green-600 cursor-pointer accent-green-600"
            />
            {type}
          </label>
        );
      })}
    </div>
  );
});

const CourseCard = memo(function CourseCard({
  course,
  allExams,
  onUpdateCourse,
  onToggle,
}: {
  course: Course;
  allExams: any[];
  onUpdateCourse: (id: number, updates: Partial<Course>) => void;
  onToggle: (course: Course, type: string, checked: boolean) => void;
}) {
  const courseIsStudied = isStudied(course.study_progress);

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 glass-heavy shadow-mac ${
        courseIsStudied
          ? "border-green-200 dark:border-green-800"
          : "border-border"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
          <span>{course.date}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{course.time_slot}</span>
        </div>
        <CategoryBadge category={course.category} />
      </div>

      {/* Topic */}
      <p className="font-bold text-foreground text-base leading-snug">
        {course.topic}
      </p>

      {/* Target exam */}
      {!["Exam", "Holiday", "PBL"].includes(course.category) && (
        <select
          value={course.target_exam || ""}
          onChange={(e) => onUpdateCourse(course.id, { target_exam_override: e.target.value })}
          className={`w-full text-sm px-3 py-2 rounded-lg font-bold outline-none cursor-pointer border-2 transition-colors ${
            course.target_exam_override
              ? "bg-orange-100 border-orange-400 text-orange-900 dark:bg-orange-950/50 dark:border-orange-600 dark:text-orange-200"
              : "bg-orange-50/50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300"
          }`}
        >
          <option value="">(系統判定失敗)</option>
          {Array.from(new Map(allExams.map((exam) => [exam.topic, exam])).values()).map((exam) => (
            <option key={exam.id} value={exam.topic}>
              {exam.topic}
            </option>
          ))}
        </select>
      )}

      {/* Attendance */}
      <select
        value={course.attendance}
        onChange={(e) => onUpdateCourse(course.id, { attendance: e.target.value })}
        className="w-full bg-card border-2 border-border text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-foreground outline-none cursor-pointer text-foreground"
      >
        {ATTENDANCE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {/* Progress */}
      <ProgressCheckboxes course={course} onToggle={onToggle} />

      {/* Notes preview */}
      {course.notes && (
        <p className="text-xs text-muted-foreground truncate">
          📝 {course.notes}
        </p>
      )}
    </div>
  );
});

export default function InteractiveTable({ courses, allExams, onUpdateCourse, focusMode }: InteractiveTableProps) {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedExam, setSelectedExam] = useState<string>("All");

  const uniqueCategories = useMemo(
    () => ["All", ...Array.from(new Set(courses.map((c) => c.category)))],
    [courses]
  );
  const uniqueExams = useMemo(
    () => ["All", ...Array.from(new Set(courses.map((c) => c.target_exam).filter(Boolean)))],
    [courses]
  );

  const filteredCourses = useMemo(
    () => focusMode
      ? courses
      : courses.filter((c) => {
          const matchCategory = selectedCategory === "All" || c.category === selectedCategory;
          const matchExam = selectedExam === "All" || c.target_exam === selectedExam;
          return matchCategory && matchExam;
        }),
    [courses, selectedCategory, selectedExam, focusMode]
  );

  const totalFiltered = filteredCourses.length;
  const studiedFiltered = filteredCourses.filter((c) => isStudied(c.study_progress)).length;
  const progressRate = totalFiltered > 0 ? Math.round((studiedFiltered / totalFiltered) * 100) : 0;

  const handleProgressToggle = (course: Course, progressType: string, isChecked: boolean) => {
    let newProgress = Array.isArray(course.study_progress) ? [...course.study_progress] : [];
    if (isChecked) {
      if (!newProgress.includes(progressType)) newProgress.push(progressType);
    } else {
      newProgress = newProgress.filter((p) => p !== progressType);
    }
    onUpdateCourse(course.id, { study_progress: newProgress });
  };

  return (
    <div className="space-y-4">
      {/* Filter bar — hidden in focus mode */}
      {!focusMode && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 glass p-4 rounded-xl border border-border/60 shadow-mac">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-bold text-foreground/80 shrink-0">科目：</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 min-w-0 bg-card border border-border text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-foreground outline-none cursor-pointer text-foreground font-medium"
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "顯示所有科目" : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 sm:border-l-2 sm:border-border sm:pl-4">
              <Target className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-sm font-bold text-foreground/80 shrink-0">考試目標：</span>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="flex-1 min-w-0 bg-card border border-border text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer text-foreground font-medium"
              >
                {uniqueExams.map((exam) => (
                  <option key={exam as string} value={exam as string}>
                    {exam === "All" ? "顯示所有考試範圍" : exam}
                  </option>
                ))}
              </select>
            </div>

          <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border shadow-sm sm:ml-auto">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-muted-foreground">
              共 <span className="text-foreground">{totalFiltered}</span> 堂
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-sm font-bold text-muted-foreground">
              已掌握 <span className="text-green-600 dark:text-green-400">{studiedFiltered}</span> 堂
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-2 py-0.5 shadow-sm">
              {progressRate}%
            </Badge>
          </div>
        </div>
      )}

      {/* Mobile: Card List */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-base font-bold">
              {focusMode ? "🎉 太棒了！目前沒有高危課程" : "這個篩選條件下沒有找到任何課程喔！"}
            </div>
          ) : (
            filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                allExams={allExams}
                onUpdateCourse={onUpdateCourse}
                onToggle={handleProgressToggle}
              />
            ))
          )}
        </div>
      ) : (
        /* Desktop: Table */
        <div className="border border-border/60 rounded-xl overflow-x-auto glass-heavy shadow-mac">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="w-[120px] text-sm font-bold text-foreground/80 py-4">日期</TableHead>
                <TableHead className="w-[120px] text-sm font-bold text-foreground/80 py-4">時段</TableHead>
                <TableHead className="w-[160px] text-sm font-bold text-foreground/80 py-4">科目</TableHead>
                <TableHead className="text-sm font-bold text-foreground/80 py-4">課程主題</TableHead>
                <TableHead className="w-[240px] text-sm font-bold text-foreground/80 py-4">對應考試 (可點擊微調)</TableHead>
                <TableHead className="w-[150px] text-sm font-bold text-foreground/80 py-4">出席狀態</TableHead>
                <TableHead className="w-[220px] text-sm font-bold text-foreground/80 py-4">內化進度</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="text-muted-foreground font-semibold text-[15px] py-4">{course.date}</TableCell>
                  <TableCell className="text-muted-foreground text-[15px] py-4">{course.time_slot}</TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      title={course.category}
                      className={`text-sm px-3 py-1 font-bold max-w-[140px] truncate inline-block align-middle ${
                        course.category === "Exam"
                          ? "border-foreground bg-foreground text-background"
                          : course.category === "PBL"
                          ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {course.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-foreground text-[16px] py-4">
                    <span className="course-truncate" title={course.topic}>
                      {course.topic}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    {["Exam", "Holiday", "PBL"].includes(course.category) ? (
                      <span className="text-muted-foreground/50 text-base font-bold">-</span>
                    ) : (
                      <select
                        value={course.target_exam || ""}
                        onChange={(e) => onUpdateCourse(course.id, { target_exam_override: e.target.value })}
                        className={`w-full text-[14px] px-3 py-2 rounded-lg font-bold outline-none cursor-pointer border-2 transition-colors ${
                          course.target_exam_override
                            ? "bg-orange-100 border-orange-400 text-orange-900 dark:bg-orange-950/50 dark:border-orange-600 dark:text-orange-200"
                            : "bg-orange-50/50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300"
                        }`}
                      >
                        <option value="">(系統判定失敗)</option>
                        {Array.from(new Map(allExams.map((exam) => [exam.topic, exam])).values()).map((exam) => (
                          <option key={exam.id} value={exam.topic}>
                            {exam.topic}
                          </option>
                        ))}
                      </select>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <select
                      value={course.attendance}
                      onChange={(e) => onUpdateCourse(course.id, { attendance: e.target.value })}
                      className="w-full bg-card border-2 border-border text-[15px] font-medium rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-foreground outline-none cursor-pointer text-foreground"
                    >
                      {ATTENDANCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="py-4">
                    <ProgressCheckboxes course={course} onToggle={handleProgressToggle} />
                  </TableCell>
                </TableRow>
              ))}
              {filteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-lg font-bold">
                    {focusMode ? "🎉 太棒了！目前沒有高危課程" : "這個篩選條件下沒有找到任何課程喔！"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
