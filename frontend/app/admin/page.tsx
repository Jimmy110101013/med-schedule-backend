"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";
import { Settings, Plus, Trash2, ArrowLeft, UploadCloud, Edit2, Check, X, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  getExamRules, createExamRule, updateExamRule, deleteExamRule as apiDeleteExamRule,
  importPdf, insertParsedCourses,
  type ExamRule,
} from "@/lib/api";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function PdfUploadCard() {
  const [importing, setImporting] = useState(false);

  if (!isTauri()) {
    return (
      <Card className="shadow-sm border-border bg-card">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-card-foreground"><UploadCloud className="w-5 h-5 text-blue-500" /> 匯入新學期 PDF 課表</CardTitle></CardHeader>
        <CardContent><div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted"><p className="text-muted-foreground text-sm font-medium">PDF 匯入僅支援桌面版應用程式</p></div></CardContent>
      </Card>
    );
  }

  const handleUpload = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!selected) return;

      const filePath = selected as string;
      setImporting(true);
      toast.info("正在解析 PDF...");

      const parsed = await importPdf(filePath);
      if (parsed.length === 0) {
        toast.warning("未從 PDF 中解析出任何課程");
        return;
      }

      const count = await insertParsedCourses(parsed);
      toast.success(`成功匯入 ${count} 筆課程！`);
    } catch (err) {
      toast.error(`匯入失敗：${err instanceof Error ? err.message : "未知錯誤"}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="shadow-sm border-border bg-card">
      <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-card-foreground"><UploadCloud className="w-5 h-5 text-blue-500" /> 匯入新學期 PDF 課表</CardTitle></CardHeader>
      <CardContent>
        <button
          onClick={handleUpload}
          disabled={importing}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-muted-foreground text-sm font-medium">解析中，請稍候...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <p className="text-muted-foreground text-sm font-medium">點擊選擇 PDF 課表檔案</p>
            </div>
          )}
        </button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [rules, setRules] = useState<ExamRule[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategories, setNewCategories] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchRules = () => {
    getExamRules().then(data => setRules(data));
  };

  useEffect(() => { fetchRules(); }, []);

  const handleSave = async (id?: number) => {
    if (!newKeyword || !newCategories) return toast.error("請填寫完整資訊");
    const isEdit = id !== undefined;
    const categoryList = newCategories.split(";").map(s => s.trim()).filter(s => s);

    setIsSaving(true);
    try {
      const ok = isEdit
        ? await updateExamRule(id, newKeyword, categoryList)
        : await createExamRule(newKeyword, categoryList);
      if (ok) {
        toast.success(isEdit ? "規則已更新" : "規則建立成功！");
        setNewKeyword(""); setNewCategories(""); setEditingId(null);
        fetchRules();
      } else { toast.error("儲存失敗"); }
    } catch { toast.error("伺服器連線異常"); }
    finally { setIsSaving(false); }
  };

  const startEdit = (rule: ExamRule) => {
    setEditingId(rule.id);
    setNewKeyword(rule.keyword);
    setNewCategories(rule.categories.join("; "));
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("確定要刪除這條規則嗎？")) return;
    setIsDeleting(ruleId);
    try {
      const ok = await apiDeleteExamRule(ruleId);
      if (ok) { toast.success("規則已刪除"); fetchRules(); }
    } catch { toast.error("伺服器連線異常"); }
    finally { setIsDeleting(null); }
  };

  return (
    <main className="min-h-screen bg-background p-8 text-foreground font-sans">
      <Toaster position="bottom-right" />
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-border pb-6 pt-4">
          <div><h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="w-8 h-8 text-foreground/80" /> 系統管理中心</h1><p className="text-muted-foreground">動態設定考試範圍與課表資料庫</p></div>
          <Link href="/" className="text-sm font-medium text-blue-600 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回戰略儀表板</Link>
        </header>

        <PdfUploadCard />

        <Card className="shadow-sm border-border bg-card">
          <CardHeader><CardTitle className="text-lg text-card-foreground">{editingId ? "📝 編輯考試映射規則" : "➕ 新增區段考範圍規則"}</CardTitle></CardHeader>
          <CardContent className="flex gap-4">
            <input type="text" placeholder="關鍵字 (例: 骨)" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} className="border border-border bg-card text-foreground rounded-md px-3 py-2 w-1/3 text-sm font-medium" />
            <input type="text" placeholder="涵蓋科目 (逗號分隔，例: Orthopedics)" value={newCategories} onChange={e => setNewCategories(e.target.value)} className="border border-border bg-card text-foreground rounded-md px-3 py-2 flex-1 text-sm font-medium" />
            {editingId ? (
              <div className="flex gap-2">
                <button onClick={() => handleSave(editingId)} disabled={isSaving} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setEditingId(null); setNewKeyword(""); setNewCategories(""); }} className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-accent"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => handleSave()} disabled={isSaving} className="bg-foreground text-background px-4 py-2 rounded-md flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"><Plus className="w-4 h-4" /> {isSaving ? "儲存中..." : "新增"}</button>
            )}
          </CardContent>
        </Card>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-card-foreground">目前生效中的映射字典</h3>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="flex justify-between items-start border-b border-border/50 pb-4">
                <div>
                  <div className="font-bold text-lg text-foreground flex items-center gap-2">關鍵字：<span className="text-orange-600 dark:text-orange-400">{rule.keyword}</span></div>
                  <div className="mt-2 flex flex-wrap gap-2">{rule.categories.map(cat => <Badge key={cat} variant="secondary" className="bg-muted text-muted-foreground font-normal">{cat}</Badge>)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(rule)} className="p-2 text-muted-foreground hover:text-blue-600 bg-muted rounded-md"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRule(rule.id!)} disabled={isDeleting === rule.id} className="p-2 text-muted-foreground hover:text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
