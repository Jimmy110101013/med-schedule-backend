import { Course } from "./InteractiveTable";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CalendarEventModalProps {
  course: Course;
  position: { x: number; y: number };
  onUpdate: (id: number, updates: Partial<Course>) => void;
  onClose: () => void;
}

export default function CalendarEventModal({ course, position, onUpdate, onClose }: CalendarEventModalProps) {
  const handleProgressToggle = (type: string, checked: boolean) => {
    let newProgress = Array.isArray(course.study_progress) ? [...course.study_progress] : [];
    if (checked) {
      if (!newProgress.includes(type)) newProgress.push(type);
    } else {
      newProgress = newProgress.filter(p => p !== type);
    }
    onUpdate(course.id, { study_progress: newProgress });
  };

  const categoryColor = course.category === "Exam"
    ? "border-zinc-800 bg-zinc-800 text-white"
    : course.category === "PBL"
    ? "border-purple-200 bg-purple-50 text-purple-700"
    : "bg-zinc-100 text-zinc-800";

  // Clamp position so modal doesn't overflow viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(position.y, window.innerHeight - 380),
    left: Math.min(position.x + 12, window.innerWidth - 340),
    zIndex: 9999,
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Modal */}
      <div style={style} className="w-[320px] bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-zinc-50 px-4 py-3 flex items-start justify-between gap-2 border-b border-zinc-100">
          <div className="min-w-0">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 font-bold mb-1.5 ${categoryColor}`}>
              {course.category}
            </Badge>
            <p className="text-sm font-bold text-zinc-900 leading-snug line-clamp-2">{course.topic}</p>
            <p className="text-xs text-zinc-500 mt-1">{course.date} · {course.time_slot}</p>
            {course.teacher && <p className="text-xs text-zinc-400 mt-0.5">{course.teacher}</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-200 rounded-md transition-colors shrink-0">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-4">
          {/* Attendance */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">出席狀態</label>
            <select
              value={course.attendance}
              onChange={(e) => onUpdate(course.id, { attendance: e.target.value })}
              className="w-full bg-white border-2 border-zinc-200 text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-zinc-900 outline-none cursor-pointer text-zinc-800"
            >
              <option value="未標記">未標記</option>
              <option value="現場出席">現場出席</option>
              <option value="錄影補課">錄影補課</option>
              <option value="加強複習">加強複習</option>
            </select>
          </div>

          {/* Study Progress */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">內化進度</label>
            <div className="flex items-center gap-4">
              {["一刷", "二刷", "寫考古"].map(type => {
                const checked = Array.isArray(course.study_progress) && course.study_progress.includes(type);
                return (
                  <label key={type} className={`flex items-center gap-1.5 text-sm cursor-pointer transition-colors ${checked ? "text-green-700 font-extrabold" : "text-zinc-500 hover:text-zinc-800 font-bold"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleProgressToggle(type, e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-2 border-zinc-300 text-green-600 focus:ring-green-600 cursor-pointer accent-green-600"
                    />
                    {type}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Target Exam (read-only display) */}
          {course.target_exam && (
            <div className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg font-bold">
              🎯 {course.target_exam}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
