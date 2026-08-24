"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, Search, X, Trash2, BookOpen, Smartphone, ShieldOff, Check, Loader2 } from "lucide-react";
import { PageHeader, DataTable, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import type { PublicUser } from "@/lib/types";

export default function StudentsPage() {
  const { db, refresh } = useContent();
  const students = (db?.users ?? []).filter((u) => u.role === "student");
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  /** السماح للطالب بالدخول من جهاز جديد (يفكّ ارتباط الجهاز الحالي). */
  const allowNewDevice = async (id: string) => {
    setResetting(id);
    await fetch("/api/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "resetDevice" }),
    });
    await refresh();
    setResetting(null);
    setDone(id);
    setTimeout(() => setDone(null), 2500);
  };

  const rows = students.filter((s) => s.name.includes(q) || s.username.includes(q) || (s.phone ?? "").includes(q));

  const del = async (id: string) => {
    await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await refresh();
  };

  return (
    <>
      <PageHeader title="الطلاب" subtitle={`${students.length} حساب طالب · كل حساب مرتبط بجهاز واحد`}
        action={<Button className="px-5 py-2.5" onClick={() => setOpenAdd(true)}><UserPlus className="size-4" /> إضافة طالب</Button>} />

      <div className="mb-4 relative sm:max-w-xs">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الرقم…"
          className="w-full rounded-full border border-border bg-card/60 py-2 pr-10 pl-4 text-sm outline-none focus:border-primary/50" />
      </div>

      {students.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا يوجد طلاب بعد — الحسابات تُنشأ من صفحة التسجيل أو بإضافتها هنا.</p>
      ) : (
        <DataTable head={["الطالب", "البريد", "الصف الدراسي", "الشعبة", "المحافظة", "الجهاز المرتبط", "الكورسات", "إجراءات"]}>
          {rows.map((s) => (
            <tr key={s.id} className="transition hover:bg-muted/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">{s.name.charAt(0)}</span>
                  <div><p className="font-semibold">{s.name}</p><p className="text-[11px] text-muted-foreground">{s.phone || "—"}</p></div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">{s.username}</td>
              <td className="px-4 py-3">{s.grade || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{s.track || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{s.governorate || "—"}</td>
              <td className="px-4 py-3">
                {s.deviceId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                    <Smartphone className="size-3.5" />
                    {s.deviceLabel || "جهاز مرتبط"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                    <ShieldOff className="size-3.5" /> بانتظار أول جهاز
                  </span>
                )}
              </td>
              <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-muted-foreground"><BookOpen className="size-3.5" /> {new Set((s.subscriptions ?? []).map((x) => x.subjectId)).size}</span></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => allowNewDevice(s.id)}
                    disabled={resetting === s.id || !s.deviceId}
                    title={s.deviceId ? "السماح بالدخول من جهاز جديد" : "لا يوجد جهاز مرتبط بعد"}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-primary transition hover:border-primary disabled:opacity-40"
                  >
                    {resetting === s.id ? <Loader2 className="size-3.5 animate-spin" />
                      : done === s.id ? <Check className="size-3.5 text-emerald-500" />
                        : <Smartphone className="size-3.5" />}
                    {done === s.id ? "تم" : "جهاز جديد"}
                  </button>
                  <button onClick={() => del(s.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (<tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد نتائج.</td></tr>)}
        </DataTable>
      )}

      <AnimatePresence>
        {openAdd && <AddStudent grades={(db?.grades ?? []).map((g) => g.name)} onClose={() => setOpenAdd(false)} onDone={refresh} />}
      </AnimatePresence>
    </>
  );
}

function AddStudent({ grades, onClose, onDone }: { grades: string[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", phone: "", username: "", password: "", grade: grades[0] ?? "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(null);
    if (!form.name || !form.username || !form.password) { setErr("الاسم والبريد وكلمة المرور مطلوبة"); return; }
    setBusy(true);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role: "student", active: true }) });
    if (!res.ok) { setErr((await res.json()).error || "تعذّر إنشاء الحساب"); setBusy(false); return; }
    await onDone(); setBusy(false); onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }} onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-md rounded-3xl p-6 shadow-bento">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-lg font-extrabold">إضافة طالب جديد</p>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full border border-border"><X className="size-4" /></button>
        </div>
        <div className="grid gap-3">
          <Field label="الاسم"><input value={form.name} onChange={(e) => set("name", e.target.value)} className="inp" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="البريد الإلكتروني"><input type="email" dir="ltr" value={form.username} onChange={(e) => set("username", e.target.value)} className="inp text-right" /></Field>
            <Field label="كلمة المرور"><input value={form.password} onChange={(e) => set("password", e.target.value)} className="inp" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم الموبايل"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="inp" /></Field>
            <Field label="الصف الدراسي">
              <select value={form.grade} onChange={(e) => set("grade", e.target.value)} className="inp">
                {grades.length === 0 && <option value="">—</option>}
                {grades.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          {err && <p className="text-xs font-bold text-rose-500">{err}</p>}
          <Button onClick={submit} disabled={busy} className="mt-2 w-full">{busy ? "جارٍ الحفظ…" : "إنشاء الحساب"}</Button>
        </div>
      </motion.div>
      <style>{`.inp{width:100%;border-radius:0.9rem;border:1px solid hsl(var(--border));background:hsl(var(--card)/0.6);padding:0.55rem 0.8rem;font-size:0.85rem;outline:none;color:inherit;font-family:inherit}.inp:focus{border-color:hsl(var(--primary)/0.6)}`}</style>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>);
}
