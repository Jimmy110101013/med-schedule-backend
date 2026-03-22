import { useCallback, useState, useEffect, useRef } from "react";
import { Course } from "./InteractiveTable";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ATTENDANCE_OPTIONS, PROGRESS_TYPES } from "@/lib/constants";

interface CalendarEventModalProps {
  course: Course;
  position: { x: number; y: number };
  onUpdate: (id: number, updates: Partial<Course>) => void;
  onClose: () => void;
}

export default function CalendarEventModal({ course, position, onUpdate, onClose }: CalendarEventModalProps) {
  const [localNotes, setLocalNotes] = useState(course.notes || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalNotes(course.notes || "");
  }, [course.id]);

  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(course.id, { notes: value });
    }, 500);
  }, [course.id, onUpdate]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleProgressToggle = useCallback((type: string, checked: boolean) => {
    let newProgress = Array.isArray(course.study_progress) ? [...course.study_progress] : [];
    if (checked) {
      if (!newProgress.includes(type)) newProgress.push(type);
    } else {
      newProgress = newProgress.filter(p => p !== type);
    }
    onUpdate(course.id, { study_progress: newProgress });
  }, [course, onUpdate]);

  const categoryColor = course.category === "Exam"
    ? "border-foreground bg-foreground text-background"
    : course.category === "PBL"
    ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    : "bg-muted text-foreground";

  // On mobile, center the modal; on desktop, anchor near the clicked event
  const isMobile = window.innerWidth < 768;
  const style: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        width: "calc(100vw - 32px)",
        maxWidth: 400,
      }
    : {
        position: "fixed",
        top: Math.min(position.y, window.innerHeight - 380),
        left: Math.min(position.x + 12, window.innerWidth - 340),
        zIndex: 9999,
      };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div style={style} className="glass-heavy rounded-xl border border-border/60 shadow-mac-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-150 w-[320px] md:w-[320px]">
        {/* Header */}
        <div className="bg-muted/50 px-4 py-3 flex items-start justify-between gap-2 border-b border-border">
          <div className="min-w-0">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 font-bold mb-1.5 ${categoryColor}`}>
              {course.category}
            </Badge>
            <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{course.topic}</p>
            <p className="text-xs text-muted-foreground mt-1">{course.date} · {course.time_slot}</p>
            {course.teacher && <p className="text-xs text-muted-foreground/70 mt-0.5">{course.teacher}</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md transition-colors shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Attendance */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Attendance</label>
            <select
              value={course.attendance}
              onChange={(e) => onUpdate(course.id, { attendance: e.target.value })}
              className="w-full bg-card border-2 border-border text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-foreground outline-none cursor-pointer text-foreground"
            >
              {ATTENDANCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Study Progress */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Study Progress</label>
            <div className="flex items-center gap-4">
              {PROGRESS_TYPES.map(type => {
                const checked = Array.isArray(course.study_progress) && course.study_progress.includes(type);
                return (
                  <label key={type} className={`flex items-center gap-1.5 text-sm cursor-pointer transition-colors ${checked ? "text-green-700 dark:text-green-400 font-extrabold" : "text-muted-foreground hover:text-foreground font-bold"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleProgressToggle(type, e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-2 border-border text-green-600 focus:ring-green-600 cursor-pointer accent-green-600"
                    />
                    {type}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Target Exam (read-only display) */}
          {course.target_exam && (
            <div className="text-xs text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 px-3 py-2 rounded-lg font-bold">
              🎯 {course.target_exam}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Notes</label>
            <textarea
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-card border-2 border-border text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-foreground outline-none resize-y text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </>
  );
}
