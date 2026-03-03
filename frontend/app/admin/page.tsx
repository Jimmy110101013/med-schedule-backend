"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";
import { Settings, Plus, Trash2, ArrowLeft, UploadCloud, Edit2, Check, X } from "lucide-react";
import Link from "next/link";

interface ExamRule { id: number; keyword: string; categories: string[]; }

export default function AdminDashboard() {
  const [rules, setRules] = useState<ExamRule[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategories, setNewCategories] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchRules = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exam-rules`).then(res => res.json()).then(data => setRules(data));
  };

  useEffect(() => { fetchRules(); }, []);

  const handleSave = async (id?: number) => {
    if (!newKeyword || !newCategories) return toast.error("請填寫完整資訊");
    const isEdit = id !== undefined;
    const categoryList = newCategories.split(";").map(s => s.trim()).filter(s => s);
    const url = isEdit ? `${process.env.NEXT_PUBLIC_API_URL}/api/exam-rules/${id}` : `${process.env.NEXT_PUBLIC_API_URL}/api/exam-rules`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword, categories: categoryList })
      });
      if (res.ok) {
        toast.success(isEdit ? "規則已更新" : "規則建立成功！");
        setNewKeyword(""); setNewCategories(""); setEditingId(null);
        fetchRules();
      } else { toast.error("儲存失敗"); }
    } catch { toast.error("伺服器連線異常"); }
  };

  const startEdit = (rule: ExamRule) => {
    setEditingId(rule.id);
    setNewKeyword(rule.keyword);
    setNewCategories(rule.categories.join(", "));
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("確定要刪除這條規則嗎？")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exam-rules/${ruleId}`, { method: "DELETE" });
      if (res.ok) { toast.success("規則已刪除"); fetchRules(); }
    } catch { toast.error("伺服器連線異常"); }
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-zinc-900 font-sans">
      <Toaster position="bottom-right" />
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-zinc-200 pb-6 pt-4">
          <div><h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="w-8 h-8 text-zinc-700" /> 系統管理中心</h1><p className="text-zinc-500">動態設定考試範圍與課表資料庫</p></div>
          <Link href="/" className="text-sm font-medium text-blue-600 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回戰略儀表板</Link>
        </header>

        <Card className="shadow-sm border-zinc-200 bg-white">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UploadCloud className="w-5 h-5 text-blue-500" /> 匯入新學期 PDF 課表</CardTitle></CardHeader>
          <CardContent><div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center bg-zinc-50"><p className="text-zinc-500 text-sm font-medium">功能建置中：即將整合 PDF 解析引擎</p></div></CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 bg-white">
          <CardHeader><CardTitle className="text-lg">{editingId ? "📝 編輯考試映射規則" : "➕ 新增區段考範圍規則"}</CardTitle></CardHeader>
          <CardContent className="flex gap-4">
            <input type="text" placeholder="關鍵字 (例: 骨)" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} className="border border-zinc-300 rounded-md px-3 py-2 w-1/3 text-sm font-medium" />
            <input type="text" placeholder="涵蓋科目 (逗號分隔，例: Orthopedics)" value={newCategories} onChange={e => setNewCategories(e.target.value)} className="border border-zinc-300 rounded-md px-3 py-2 flex-1 text-sm font-medium" />
            {editingId ? (
              <div className="flex gap-2">
                <button onClick={() => handleSave(editingId)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setEditingId(null); setNewKeyword(""); setNewCategories(""); }} className="bg-zinc-400 text-white px-4 py-2 rounded-md hover:bg-zinc-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => handleSave()} className="bg-zinc-900 text-white px-4 py-2 rounded-md flex items-center gap-1 text-sm"><Plus className="w-4 h-4" /> 新增</button>
            )}
          </CardContent>
        </Card>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">目前生效中的映射字典</h3>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="flex justify-between items-start border-b border-zinc-100 pb-4">
                <div>
                  <div className="font-bold text-lg text-zinc-800 flex items-center gap-2">關鍵字：<span className="text-orange-600">{rule.keyword}</span></div>
                  <div className="mt-2 flex flex-wrap gap-2">{rule.categories.map(cat => <Badge key={cat} variant="secondary" className="bg-zinc-100 text-zinc-600 font-normal">{cat}</Badge>)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(rule)} className="p-2 text-zinc-400 hover:text-blue-600 bg-zinc-50 rounded-md"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRule(rule.id!)} className="p-2 text-zinc-400 hover:text-red-600 bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}