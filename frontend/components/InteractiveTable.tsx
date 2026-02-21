import { useState } from "react";
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
}

interface InteractiveTableProps {
  courses: Course[];
  allExams: any[];
  onUpdateCourse: (id: number, updates: Partial<Course>) => void;
}

export default function InteractiveTable({ courses, allExams, onUpdateCourse }: InteractiveTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedExam, setSelectedExam] = useState<string>("All");

  const uniqueCategories = ["All", ...Array.from(new Set(courses.map(c => c.category)))];
  const uniqueExams = ["All", ...Array.from(new Set(courses.map(c => c.target_exam).filter(Boolean)))];

  const filteredCourses = courses.filter(c => {
    const matchCategory = selectedCategory === "All" || c.category === selectedCategory;
    const matchExam = selectedExam === "All" || c.target_exam === selectedExam;
    return matchCategory && matchExam;
  });

  const isStudied = (progress: any) => {
    if (!Array.isArray(progress)) return false;
    return progress.some(p => ["一刷", "二刷", "寫考古"].includes(p));
  };

  const totalFiltered = filteredCourses.length;
  const studiedFiltered = filteredCourses.filter(c => isStudied(c.study_progress)).length;
  const progressRate = totalFiltered > 0 ? Math.round((studiedFiltered / totalFiltered) * 100) : 0;

  const handleProgressToggle = (course: Course, progressType: string, isChecked: boolean) => {
    let newProgress = Array.isArray(course.study_progress) ? [...course.study_progress] : [];
    if (isChecked) {
      if (!newProgress.includes(progressType)) newProgress.push(progressType);
    } else {
      newProgress = newProgress.filter(p => p !== progressType);
    }
    onUpdateCourse(course.id, { study_progress: newProgress });
  };

  return (
    <div className="space-y-6">
      {/* 🎛️ 放大的戰略控制台 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 bg-zinc-50/80 p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-zinc-500" />
            <span className="text-base font-bold text-zinc-700">科目：</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-zinc-300 text-base rounded-lg px-4 py-2 focus:ring-2 focus:ring-zinc-900 outline-none cursor-pointer text-zinc-800 font-medium min-w-[200px]"
            >
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "顯示所有科目" : cat}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:border-l-2 sm:border-zinc-200 sm:pl-6">
            <Target className="w-5 h-5 text-orange-500" />
            <span className="text-base font-bold text-zinc-700">考試目標：</span>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-white border border-zinc-300 text-base rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer text-zinc-800 font-medium min-w-[280px] truncate"
            >
              {uniqueExams.map(exam => <option key={exam as string} value={exam as string}>{exam === "All" ? "顯示所有考試範圍" : exam}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm">
          <Activity className="w-5 h-5 text-green-500" />
          <span className="text-base font-bold text-zinc-600">共 <span className="text-zinc-900 text-lg">{totalFiltered}</span> 堂</span>
          <span className="text-zinc-300 text-lg">|</span>
          <span className="text-base font-bold text-zinc-600">已掌握 <span className="text-green-600 text-lg">{studiedFiltered}</span> 堂</span>
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 hover:bg-green-100 text-base px-3 py-1 shadow-sm">{progressRate}%</Badge>
        </div>
      </div>

      {/* 📝 放大的表格本體 */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-100/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px] text-base font-bold text-zinc-700 py-4">日期</TableHead>
              <TableHead className="w-[120px] text-base font-bold text-zinc-700 py-4">時段</TableHead>
              <TableHead className="w-[160px] text-base font-bold text-zinc-700 py-4">科目</TableHead>
              <TableHead className="text-base font-bold text-zinc-700 py-4">課程主題</TableHead>
              <TableHead className="w-[240px] text-base font-bold text-zinc-700 py-4">對應考試 (可點擊微調)</TableHead>
              <TableHead className="w-[150px] text-base font-bold text-zinc-700 py-4">出席狀態</TableHead>
              <TableHead className="w-[220px] text-base font-bold text-zinc-700 py-4">內化進度</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course.id} className="hover:bg-zinc-50/80 transition-colors">
                <TableCell className="text-zinc-600 font-semibold text-[15px] py-4">{course.date}</TableCell>
                <TableCell className="text-zinc-600 text-[15px] py-4">{course.time_slot}</TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className={`text-sm px-3 py-1 font-bold ${course.category === 'Exam' ? 'border-zinc-800 bg-zinc-800 text-white' : course.category === 'PBL' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'bg-zinc-100 text-zinc-800'}`}>
                    {course.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-zinc-900 text-[16px] py-4">
                  {/* 🚀 關鍵修改：加入 course-truncate 樣式防止欄位被撐爆 */}
                  <span className="course-truncate" title={course.topic}>
                    {course.topic}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  {["Exam", "Holiday", "PBL"].includes(course.category) ? (
                    <span className="text-zinc-300 text-base font-bold">-</span>
                  ) : (
                    <select
                      value={course.target_exam || ""}
                      onChange={(e) => onUpdateCourse(course.id, { target_exam_override: e.target.value })}
                      className={`w-full text-[14px] px-3 py-2 rounded-lg font-bold outline-none cursor-pointer border-2 transition-colors ${
                        course.target_exam_override 
                          ? "bg-orange-100 border-orange-400 text-orange-900" 
                          : "bg-orange-50/50 border-orange-200 text-orange-700 hover:bg-orange-100"
                      }`}
                    >
                      <option value="">(系統判定失敗)</option>
                      {Array.from(new Map(allExams.map(exam => [exam.topic, exam])).values()).map(exam => (
                        <option key={exam.id} value={exam.topic}>{exam.topic}</option>
                      ))}
                    </select>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <select
                    value={course.attendance}
                    onChange={(e) => onUpdateCourse(course.id, { attendance: e.target.value })}
                    className="w-full bg-white border-2 border-zinc-200 text-[15px] font-medium rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-zinc-900 outline-none cursor-pointer text-zinc-800"
                  >
                    <option value="未標記">未標記</option>
                    <option value="現場出席">現場出席</option>
                    <option value="錄影補課">錄影補課</option>
                    <option value="加強複習">加強複習</option>
                  </select>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    {['一刷', '二刷', '寫考古'].map(type => {
                      const checked = Array.isArray(course.study_progress) && course.study_progress.includes(type);
                      return (
                        <label key={type} className={`flex items-center gap-1.5 text-[15px] cursor-pointer transition-colors ${checked ? 'text-green-700 font-extrabold' : 'text-zinc-500 hover:text-zinc-800 font-bold'}`}>
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            onChange={(e) => handleProgressToggle(course, type, e.target.checked)} 
                            className="w-5 h-5 rounded border-2 border-zinc-300 text-green-600 focus:ring-green-600 cursor-pointer accent-green-600" 
                          />
                          {type}
                        </label>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredCourses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500 text-lg font-bold">
                  這個篩選條件下沒有找到任何課程喔！
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}