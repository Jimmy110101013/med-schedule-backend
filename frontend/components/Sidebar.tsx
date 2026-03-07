"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: BookOpen, label: "週課表儀表板", route: "/" },
  { icon: GraduationCap, label: "醫師國考追蹤", route: "/kokushi" },
  { icon: Settings, label: "管理設定", route: "/admin" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-200",
        isMobile ? "w-14" : "w-56"
      )}
    >
      <div className="flex h-14 items-center border-b px-3">
        {!isMobile && (
          <span className="text-sm font-semibold text-foreground truncate">
            Med Tracker
          </span>
        )}
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ icon: Icon, label, route }) => {
          const isActive = pathname === route;
          return (
            <Link
              key={route}
              href={route}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isMobile && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
