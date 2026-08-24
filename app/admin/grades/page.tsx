"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Plus, Trash2, X } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import type { GradeRow } from "@/lib/types";

const SWATCHES = ["#12b981", "#2b8bf6", "#7c3aed", "#e11d48", "#f59e0b", "#0ea5e9"];

export default function GradesPage() {
  const { db, save } = useContent();
  const grades = db?.grades ?? [];
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);

  const add = async () => {
    if (!name.trim()) return;
    const g: GradeRow = { id: `G-${Date.now()}`, name: name.trim(), students: 0, subjects: 0, color };
    await save({ grades: [...grades, g] });
    setName(""); setAdding(false);
  };
  const remove = (id: string) => save({ grades: grades.filter((g) => g.id !== id) });

  return (
    <>
      <PageHeader title="الصفوف الدراسية" subtitle="أضِف وأدِر الصفوف الدراسية — تظهر مباشرة على الموقع"
        action={<Button className="px-5 py-2.5" onClick={() => setAdding((v) => !v)}><Plus className="size-4" /> إضافة صف</Button>} />

      {adding && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1"><span className="mb-1 block text-xs font-semibold text-muted-foreground">اسم الصف</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="مثال: الصف الأول الثانوي" className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <div>
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">اللون</span>
              <div className="flex gap-1.5">
                {SWATCHES.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`size-8 rounded-lg ring-2 transition ${color === c ? "ring-primary" : "ring-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <Button className="px-5 py-2.5" onClick={add}>حفظ</Button>
            <button onClick={() => setAdding(false)} className="grid size-10 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>
        </Card>
      )}

      {grades.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد صفوف دراسية. أضِف أول صف ليظهر على الموقع.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="group relative overflow-hidden">
                <span className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40" style={{ background: g.color }} />
                <div className="flex items-start justify-between">
                  <span className="mb-4 grid size-12 place-items-center rounded-2xl text-white" style={{ background: g.color }}><BookOpen className="size-6" /></span>
                  <button onClick={() => remove(g.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
                <h3 className="font-display text-lg font-extrabold">{g.name}</h3>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="size-4" /> {g.students.toLocaleString("ar-EG")} طالب</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="size-4" /> {g.subjects} مواد</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
