"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Settings, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: BookOpen, label: "Dashboard", route: "/" },
  { icon: GraduationCap, label: "Board Exam", route: "/kokushi" },
  { icon: Settings, label: "Settings", route: "/admin" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setIsOpen(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    leaveTimer.current = setTimeout(() => setIsOpen(false), 300);
  }, [isMobile]);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const navContent = (
    <>
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground truncate">
          Med Tracker
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ icon: Icon, label, route }) => {
          const isActive = pathname === route;
          return (
            <Link
              key={route}
              href={route}
              onClick={() => isMobile && setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-xl glass-heavy shadow-mac border border-border"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-64 glass-heavy shadow-mac-elevated border-r border-border animate-in slide-in-from-left duration-300">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
              {navContent}
            </aside>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Invisible hover zone */}
      <div
        className="fixed left-0 top-0 h-full w-4 z-40"
        onMouseEnter={handleMouseEnter}
      />

      {/* Sidebar drawer */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed left-0 top-0 h-full w-56 z-40 glass-heavy shadow-mac-elevated border-r border-border",
          "transition-all duration-300 ease-out",
          isOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
