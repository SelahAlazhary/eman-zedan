"use client";

/**
 * النسخ الاحتياطي — نسخة كاملة من المنصّة إلى Google Drive والتخزين السحابي،
 * نسخة تلقائية كل يوم، ونقل أي ملفات متبقّية على الخادم إلى Drive.
 */
import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck, RefreshCw, CloudUpload, HardDriveUpload, Loader2, Check, AlertTriangle, Clock, FileArchive, Download, RotateCcw, Upload,
} from "lucide-react";
import { PageHeader, Card, StatCard, DataTable } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";

type Entry = {
  at: string;
  reason: "manual" | "auto";
  size: number;
  driveFileId?: string;
  driveName?: string;
  firebase?: boolean;
  error?: string;
};

type State = {
  last?: string;
  items: Entry[];
  counts: Record<string, number>;
  localFiles: number;
  driveReady: boolean;
};

const LABELS: Record<string, string> = {
  users: "الحسابات", subjects: "الكورسات", plans: "الخطط", codes: "الأكواد",
  exams: "الاختبارات", live: "جلسات البث", notifications: "الإشعارات",
};

function size(n: number): string {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} م.ب`;
  if (n > 1024) return `${Math.round(n / 1024)} ك.ب`;
  return `${n} بايت`;
}

export default function BackupPage() {
  const [st, setSt] = useState<State | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/backup", { cache: "no-store" });
    if (res.ok) setSt(await res.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  /** تنزيل نسخة على جهاز الأدمن. */
  const downloadCopy = async () => {
    try {
      const res = await fetch("/api/backup/download", { cache: "no-store" });
      if (!res.ok) return;
      const blob = await res.blob();
      const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "emz-backup.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* التنزيل إضافة — لا يُفشل العملية */
    }
  };

  const run = async (action: "backup" | "migrate") => {
    setBusy(action); setMsg(null); setErr(null);
    try {
      const res = await fetch("/api/backup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (action === "backup") {
        const r = data.result;
        if (r?.ok) {
          const where = [r.drive.ok && "Google Drive", r.firebase.ok && "التخزين السحابي"].filter(Boolean).join(" و");
          await downloadCopy(); // نسخة على جهازك أيضاً
          setMsg(`تمّت النسخة الاحتياطية (${size(r.size)}) — حُفظت على جهازك${where ? ` وعلى ${where}` : ""}`);
        } else {
          await downloadCopy();
          setErr(`حُفظت نسخة على جهازك، لكن تعذّر الرفع السحابي: ${r?.drive?.error || r?.firebase?.error || "خطأ غير معروف"}`);
        }
      } else {
        data.moved > 0
          ? setMsg(`نُقل ${data.moved} ملفاً إلى Drive وحُذف من الخادم`)
          : setErr(data.skipped ? "اربط حساب جوجل أولاً" : "لا توجد ملفات محلية للنقل");
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  /** استعادة من ملف على جهاز الأدمن. */
  const restoreFromFile = async (file: File) => {
    setBusy("restore"); setMsg(null); setErr(null);
    try {
      const text = await file.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { setErr("الملف ليس JSON صالحاً"); return; }
      const res = await fetch("/api/backup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", data }),
      });
      const r = await res.json();
      r.ok ? setMsg(`تمّت الاستعادة (${r.users} حساب)${r.safetyBackup ? " — وأُخذت نسخة أمان قبلها" : ""}`)
           : setErr(r.error || "تعذّرت الاستعادة");
      await load();
    } finally {
      setBusy(null);
    }
  };

  /** استعادة من نسخة محفوظة في Drive. */
  const restoreFromDrive = async (fileId: string, at: string) => {
    if (!confirm(`استعادة نسخة ${new Date(at).toLocaleString("ar-EG")}؟ ستُستبدل البيانات الحالية (وتُؤخذ نسخة أمان أولاً).`)) return;
    setBusy("restore"); setMsg(null); setErr(null);
    try {
      const res = await fetch("/api/backup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restoreDrive", fileId }),
      });
      const r = await res.json();
      r.ok ? setMsg(`تمّت الاستعادة (${r.users} حساب)`) : setErr(r.error || "تعذّرت الاستعادة");
      await load();
    } finally {
      setBusy(null);
    }
  };

  const lastAt = st?.last ? new Date(st.last) : null;
  const stale = lastAt ? Date.now() - lastAt.getTime() > 36 * 3600 * 1000 : true;

  return (
    <>
      <PageHeader
        title="النسخ الاحتياطي"
        subtitle="نسخة كاملة من المنصّة — تلقائياً كل يوم، أو بضغطة متى شئت"
        action={<Button variant="outline" className="px-4 py-2.5" onClick={() => void load()}><RefreshCw className="size-4" /> تحديث</Button>}
      />

      {(msg || err) && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold ${err ? "bg-rose-500/12 text-rose-600" : "bg-emerald-500/12 text-emerald-600"}`}>
          {err || msg}
        </div>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${stale ? "bg-amber-500/12 text-amber-500" : "bg-emerald-500/12 text-emerald-500"}`}>
            {stale ? <AlertTriangle className="size-6" /> : <ShieldCheck className="size-6" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold">
              {lastAt ? `آخر نسخة: ${lastAt.toLocaleString("ar-EG")}` : "لم تُؤخذ نسخة بعد"}
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> نسخة تلقائية كل ٢٤ ساعة · النسخة اليدوية تُحفظ على جهازك وعلى Google Drive
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="px-5 py-2.5" onClick={() => run("backup")} disabled={busy !== null}>
              {busy === "backup" ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
              نسخة احتياطية الآن
            </Button>
            <Button variant="outline" className="px-4 py-2.5" onClick={downloadCopy} disabled={busy !== null}>
              <Download className="size-4" /> تنزيل نسخة فقط
            </Button>
          </div>
        </div>
      </Card>

      {/* الاستعادة */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-500/12 text-sky-500">
            <RotateCcw className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold">استعادة نسخة احتياطية</p>
            <p className="text-xs text-muted-foreground">
              اختر ملف نسخة من جهازك، أو استعِد أي نسخة من الجدول بالأسفل. تُؤخذ نسخة أمان تلقائياً قبل الاستبدال،
              ويبقى ربط جوجل كما هو.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
            {busy === "restore" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            استعادة من ملف
            <input type="file" accept="application/json,.json" hidden disabled={busy !== null}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void restoreFromFile(f); e.target.value = ""; }} />
          </label>
        </div>
      </Card>

      {/* ما تحتويه النسخة */}
      {st && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(st.counts).map(([k, v], i) => (
            <StatCard key={k} index={i} label={LABELS[k] ?? k} value={v.toLocaleString("ar-EG")}
              tone={i % 2 ? "emerald" : "primary"} icon={<FileArchive className="size-5" />} />
          ))}
        </div>
      )}

      {/* ملفات متبقّية على الخادم */}
      {st && st.localFiles > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/12 text-amber-500">
              <HardDriveUpload className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-extrabold">{st.localFiles.toLocaleString("ar-EG")} ملف ما زال على الخادم</p>
              <p className="text-xs text-muted-foreground">
                انقلها إلى Google Drive ليصبح كل شيء سحابياً — تُحدَّث روابطها في المنصّة تلقائياً ثم تُحذف من الخادم.
              </p>
            </div>
            <Button variant="outline" className="px-5 py-2.5" onClick={() => run("migrate")} disabled={busy !== null || !st.driveReady}>
              {busy === "migrate" ? <Loader2 className="size-4 animate-spin" /> : <HardDriveUpload className="size-4" />}
              نقل الملفات إلى Drive
            </Button>
          </div>
        </Card>
      )}

      {/* سجلّ النسخ */}
      {st && st.items.length > 0 && (
        <DataTable head={["التاريخ", "النوع", "الحجم", "Google Drive", "السحابة", "استعادة"]}>
          {st.items.map((b) => (
            <tr key={b.at} className="transition hover:bg-muted/50">
              <td className="px-4 py-3">{new Date(b.at).toLocaleString("ar-EG")}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${b.reason === "auto" ? "bg-sky-500/15 text-sky-600" : "bg-primary/12 text-primary"}`}>
                  {b.reason === "auto" ? "تلقائية" : "يدوية"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{size(b.size)}</td>
              <td className="px-4 py-3">
                {b.driveName ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><Check className="size-3.5" /> {b.driveName}</span>
                  : <span className="text-xs text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                {b.firebase ? <Check className="size-4 text-emerald-500" /> : <span className="text-xs text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                {b.driveFileId ? (
                  <button onClick={() => restoreFromDrive(b.driveFileId!, b.at)} disabled={busy !== null}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-primary transition hover:border-primary disabled:opacity-50">
                    <RotateCcw className="size-3.5" /> استعادة
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
