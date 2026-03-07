"use client";

import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statCards = [
  { label: "總科目數", value: "--" },
  { label: "已完成", value: "--" },
  { label: "進行中", value: "--" },
  { label: "距國考天數", value: "--" },
];

export default function KokushiPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">醫師國考追蹤</h1>
        <p className="text-sm text-muted-foreground mt-1">
          追蹤各科複習進度，掌握國考備考狀況
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
            <CardTitle className="text-base">科目列表</CardTitle>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground">
            <GraduationCap className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">科目設定尚未完成</p>
            <p className="text-xs opacity-70">
              國考科目與複習紀錄功能正在建置中，敬請期待
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
