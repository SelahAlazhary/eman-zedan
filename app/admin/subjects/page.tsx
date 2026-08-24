"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, PlayCircle, Users, Trash2, ToggleLeft, ToggleRight, X, ListVideo } from "lucide-react";
import { PageHeader, DataTable, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import type { Subject } from "@/lib/types";

export default function SubjectsPage() {
  const { db, save, content } = useContent();
  const subjects = db?.subjects ?? [];
  const grades = db?.grades ?? [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", price: 150, lessons: 0, grade: "كل الصفوف", track: "الكل", term: 1 as 1 | 2 });

  const add = async () => {
    if (!form.name.trim()) return;
    const s: Subject = {
      id: `SUB-${Date.now()}`, name: form.name.trim(), teacher: content.teacher.name,
      grade: form.grade, track: form.track, term: form.term, lessons: Number(form.lessons) || 0, students: 0,
      price: Number(form.price) || 0, videos: [], status: "مسودّة",
    };
    await save({ subjects: [...subjects, s] });
    setForm({ name: "", price: 150, lessons: 0, grade: "كل الصفوف", track: "الكل", term: 1 });
    setAdding(false);
  };
  const remove = (id: string) => save({ subjects: subjects.filter((s) => s.id !== id) });
  const toggle = (id: string) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...s, status: s.status === "منشورة" ? "مسودّة" : "منشورة" } : s)) });
  const setPrice = (id: string, price: number) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...s, price } : s)) });
  const setTrack = (id: string, track: string) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...s, track } : s)) });
  const setTerm = (id: string, term: 1 | 2) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...s, term } : s)) });

  return (
    <>
      <PageHeader title="الكورسات" subtitle={`${subjects.length} كورس — حدّد سعر كل كورس`}
        action={<Button className="px-5 py-2.5" onClick={() => setAdding((v) => !v)}><Plus className="size-4" /> إضافة كورس</Button>} />

      {adding && (
        <div className="glass mb-4 rounded-3xl p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">اسم الكورس</span>
              <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">السعر الشهري (ج.م)</span>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">عدد الدروس</span>
              <input type="number" value={form.lessons} onChange={(e) => setForm({ ...form, lessons: Number(e.target.value) })} className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">الصف الدراسي</span>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none">
                <option>كل الصفوف</option>
                {grades.map((g) => <option key={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">الشعبة</span>
              <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none">
                <option value="الكل">الكل (علمي وأدبي)</option>
                <option value="علمي">علمي</option>
                <option value="أدبي">أدبي</option>
              </select>
            </label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">الفصل الدراسي</span>
              <select value={form.term} onChange={(e) => setForm({ ...form, term: Number(e.target.value) as 1 | 2 })} className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none">
                <option value={1}>الفصل الدراسي الأول</option>
                <option value={2}>الفصل الدراسي الثاني</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button className="flex-1 px-5 py-2.5" onClick={add}>حفظ الكورس</Button>
              <button onClick={() => setAdding(false)} className="grid size-10 place-items-center rounded-full border border-border"><X className="size-4" /></button>
            </div>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد كورسات بعد. أضِف أول كورس ليظهر على الموقع.</p>
      ) : (
        <DataTable head={["الكورس", "الصف الدراسي", "الفصل", "الشعبة", "الدروس", "الطلاب", "السعر / شهر", "الحالة", "إجراءات"]}>
          {subjects.map((s) => (
            <tr key={s.id} className="transition hover:bg-muted/50">
              <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-2xl bg-primary/12 text-primary"><PlayCircle className="size-5" /></span><p className="font-semibold">{s.name}</p></div></td>
              <td className="px-4 py-3 text-muted-foreground">{s.grade}</td>
              <td className="px-4 py-3">
                <select value={s.term ?? 1} onChange={(e) => setTerm(s.id, Number(e.target.value) as 1 | 2)}
                  className="rounded-lg border border-border bg-card/60 px-2 py-1 text-xs outline-none focus:border-primary/50">
                  <option value={1}>الأول</option><option value={2}>الثاني</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <select value={s.track || "الكل"} onChange={(e) => setTrack(s.id, e.target.value)}
                  className="rounded-lg border border-border bg-card/60 px-2 py-1 text-xs outline-none focus:border-primary/50">
                  <option value="الكل">الكل</option><option value="علمي">علمي</option><option value="أدبي">أدبي</option>
                </select>
              </td>
              <td className="px-4 py-3 font-semibold">{s.lessons}</td>
              <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="size-3.5" /> {s.students.toLocaleString("ar-EG")}</span></td>
              <td className="px-4 py-3">
                <input type="number" defaultValue={s.price} onBlur={(e) => setPrice(s.id, Number(e.target.value))}
                  className="w-24 rounded-lg border border-border bg-card/60 px-2 py-1 text-sm outline-none focus:border-primary/50" />
              </td>
              <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link href={`/admin/courses/${s.id}`} title="إدارة الدروس" className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary"><ListVideo className="size-4" /></Link>
                  <button onClick={() => toggle(s.id)} title="نشر/إخفاء" className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary">
                    {s.status === "منشورة" ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                  </button>
                  <button onClick={() => remove(s.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
