"use client";

import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statCards = [
  { label: "Total Subjects", value: "--" },
  { label: "Completed", value: "--" },
  { label: "In Progress", value: "--" },
  { label: "Days to Exam", value: "--" },
];

export default function KokushiPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Board Exam Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track review progress across all subjects
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Subjects</CardTitle>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground">
            <GraduationCap className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Subject setup not complete</p>
            <p className="text-xs opacity-70">
              Subject and review tracking features are coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
