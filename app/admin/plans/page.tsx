"use client";

/** الخطط — إضافة/تعديل خطط الاشتراك التي تظهر على الصفحة الرئيسية وفي بوابة الطالب. */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Pencil, X, Check, Eye, EyeOff, Layers, BookOpen, CalendarClock, Sparkles, Star,
  Percent, Palette, Tag,
} from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { planPrice } from "@/lib/plans";
import type { SitePlan, PlanKind, PlanScope, PlanDiscount } from "@/lib/types";

const KIND_LABEL: Record<PlanKind, string> = {
  term: "ترم كامل (ينتهي بتاريخ)",
  month: "شهري (ينتهي بعد مدّة)",
  custom: "مخصّص (مدّة بالأيام)",
};

type Form = {
  name: string; kind: PlanKind; scope: PlanScope; subjectId: string;
  price: number; durationDays: number; endsAt: string; badge: string;
  highlight: boolean; desc: string; perks: string; visible: boolean; order: number;
  color: string; cta: string; termNo: 1 | 2;
  discountOn: boolean; discountType: "percent" | "amount"; discountValue: number;
  discountLabel: string; discountUntil: string;
};

const EMPTY: Form = {
  name: "", kind: "term", scope: "all", subjectId: "", price: 0, durationDays: 0,
  endsAt: "", badge: "", highlight: false, desc: "", perks: "", visible: true, order: 0,
  color: "", cta: "", termNo: 1, discountOn: false, discountType: "percent", discountValue: 0,
  discountLabel: "", discountUntil: "",
};

/** ألوان جاهزة للخطط. */
const PLAN_COLORS = ["#12b981", "#2b8bf6", "#7c3aed", "#e11d48", "#f59e0b", "#0ea5e9", "#14b8a6", "#db2777"];

export default function PlansPage() {
  const { db, save, content } = useContent();
  const plans = db?.plans ?? [];
  const subjects = db?.subjects ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);

  const set = (patch: Partial<Form>) => setF((prev) => ({ ...prev, ...patch }));

  const startAdd = () => { setEditing(null); setF({ ...EMPTY, order: plans.length }); setOpen(true); };
  const startEdit = (p: SitePlan) => {
    setEditing(p.id);
    setF({
      name: p.name, kind: p.kind, scope: p.scope, subjectId: p.subjectId ?? "",
      price: p.price, durationDays: p.durationDays ?? 0, endsAt: (p.endsAt ?? "").slice(0, 10),
      badge: p.badge ?? "", highlight: Boolean(p.highlight), desc: p.desc ?? "",
      perks: (p.perks ?? []).join("\n"), visible: p.visible, order: p.order ?? 0,
      color: p.color ?? "", cta: p.cta ?? "", termNo: p.termNo ?? 1,
      discountOn: Boolean(p.discount?.active),
      discountType: p.discount?.type ?? "percent",
      discountValue: p.discount?.value ?? 0,
      discountLabel: p.discount?.label ?? "",
      discountUntil: (p.discount?.until ?? "").slice(0, 10),
    });
    setOpen(true);
  };

  const commit = () => {
    if (!f.name.trim()) return;
    if (f.scope === "subject" && !f.subjectId) return;
    const base: SitePlan = {
      id: editing ?? `PLAN-${Date.now()}`,
      name: f.name.trim(),
      kind: f.kind,
      scope: f.scope,
      subjectId: f.scope === "subject" ? f.subjectId : undefined,
      termNo: f.scope === "term" ? f.termNo : undefined,
      price: Number(f.price) || 0,
      durationDays: f.durationDays > 0 ? Number(f.durationDays) : null,
      endsAt: f.kind === "term" && f.endsAt ? f.endsAt : null,
      badge: f.badge.trim() || undefined,
      highlight: f.highlight,
      desc: f.desc.trim() || undefined,
      perks: f.perks.split("\n").map((x) => x.trim()).filter(Boolean),
      visible: f.visible,
      order: Number(f.order) || 0,
      color: f.color || undefined,
      cta: f.cta.trim() || undefined,
      discount: f.discountOn && Number(f.discountValue) > 0
        ? {
            active: true,
            type: f.discountType,
            value: Number(f.discountValue),
            label: f.discountLabel.trim() || undefined,
            until: f.discountUntil || null,
          } as PlanDiscount
        : undefined,
      createdAt: plans.find((p) => p.id === editing)?.createdAt ?? new Date().toISOString(),
    };
    const next = editing ? plans.map((p) => (p.id === editing ? base : p)) : [...plans, base];
    save({ plans: next });
    setOpen(false); setEditing(null); setF(EMPTY);
  };

  const remove = (id: string) => save({ plans: plans.filter((p) => p.id !== id) });
  const toggleVisible = (id: string) =>
    save({ plans: plans.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)) });

  const durationText = (p: SitePlan) => {
    if (p.kind === "term") {
      const end = p.endsAt || content.termEnd;
      return end ? `حتى ${new Date(end).toLocaleDateString("ar-EG")}` : `${p.durationDays ?? 120} يوماً`;
    }
    if (p.kind === "month") return `${p.durationDays ?? 30} يوماً`;
    return p.durationDays ? `${p.durationDays} يوماً` : "بلا انتهاء";
  };

  return (
    <>
      <PageHeader
        title="الخطط"
        subtitle="أنشئ خطط الاشتراك بأسمائها وأنواعها — تظهر في الصفحة الرئيسية وتُولَّد منها أكواد التفعيل"
        action={<Button className="px-5 py-2.5" onClick={startAdd}><Plus className="size-4" /> إضافة خطة</Button>}
      />

      {open && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-extrabold">{editing ? "تعديل الخطة" : "خطة جديدة"}</h3>
            <button onClick={() => { setOpen(false); setEditing(null); }} className="grid size-8 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2"><span className="lbl">اسم الخطة</span>
              <input className="inp" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: الترم الكامل — كل المواد" />
            </label>
            <label><span className="lbl">نوع الخطة</span>
              <select className="inp" value={f.kind} onChange={(e) => set({ kind: e.target.value as PlanKind })}>
                {(Object.keys(KIND_LABEL) as PlanKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </label>
            <label><span className="lbl">نطاق الخطة</span>
              <select className="inp" value={f.scope} onChange={(e) => set({ scope: e.target.value as PlanScope })}>
                <option value="all">كل المواد (الفصلان معاً)</option>
                <option value="term">كل مواد فصل دراسي</option>
                <option value="subject">كورس محدّد</option>
              </select>
            </label>
            {f.scope === "term" && (
              <label><span className="lbl">الفصل الدراسي</span>
                <select className="inp" value={f.termNo} onChange={(e) => set({ termNo: Number(e.target.value) as 1 | 2 })}>
                  <option value={1}>الفصل الدراسي الأول</option>
                  <option value={2}>الفصل الدراسي الثاني</option>
                </select>
              </label>
            )}
            {f.scope === "subject" && (
              <label><span className="lbl">الكورس</span>
                <select className="inp" value={f.subjectId} onChange={(e) => set({ subjectId: e.target.value })}>
                  <option value="">— اختر الكورس —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            )}
            <label><span className="lbl">السعر (ج.م)</span>
              <input type="number" className="inp" value={f.price} onChange={(e) => set({ price: Number(e.target.value) })} />
            </label>
            {f.kind === "term" ? (
              <label><span className="lbl">تاريخ انتهاء الترم (فارغ = تاريخ الترم العام)</span>
                <input type="date" dir="ltr" className="inp text-right" value={f.endsAt} onChange={(e) => set({ endsAt: e.target.value })} />
              </label>
            ) : (
              <label><span className="lbl">المدّة بالأيام {f.kind === "month" ? "(٣٠ افتراضياً)" : "(٠ = بلا انتهاء)"}</span>
                <input type="number" className="inp" value={f.durationDays} onChange={(e) => set({ durationDays: Number(e.target.value) })} />
              </label>
            )}
            <label><span className="lbl">شارة (اختياري)</span>
              <input className="inp" value={f.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="الأوفر" />
            </label>
            <label><span className="lbl">ترتيب العرض</span>
              <input type="number" className="inp" value={f.order} onChange={(e) => set({ order: Number(e.target.value) })} />
            </label>
            <label className="sm:col-span-3"><span className="lbl">وصف مختصر</span>
              <input className="inp" value={f.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="يفتح كل المواد حتى نهاية الترم" />
            </label>
            <label><span className="lbl">نص الزر (اختياري)</span>
              <input className="inp" value={f.cta} onChange={(e) => set({ cta: e.target.value })} placeholder="اشترك الآن" />
            </label>

            {/* لون الخطة */}
            <div className="sm:col-span-3">
              <span className="lbl"><Palette className="inline size-3.5" /> لون الخطة</span>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => set({ color: "" })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${!f.color ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  لون الثيم
                </button>
                {PLAN_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => set({ color: c })} title={c}
                    className={`size-8 rounded-full ring-offset-2 ring-offset-[hsl(var(--card))] transition ${f.color === c ? "ring-2 ring-primary" : ""}`}
                    style={{ background: c }} />
                ))}
                <input type="color" value={f.color || "#12b981"} onChange={(e) => set({ color: e.target.value })}
                  className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" title="لون مخصّص" />
              </div>
            </div>

            {/* الخصم */}
            <div className="sm:col-span-3 rounded-2xl border border-border p-4">
              <label className="mb-3 flex items-center gap-2">
                <input type="checkbox" checked={f.discountOn} onChange={(e) => set({ discountOn: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
                <span className="inline-flex items-center gap-1.5 text-sm font-bold"><Percent className="size-4 text-primary" /> تفعيل خصم على هذه الخطة</span>
              </label>
              {f.discountOn && (
                <div className="grid gap-3 sm:grid-cols-4">
                  <label><span className="lbl">نوع الخصم</span>
                    <select className="inp" value={f.discountType} onChange={(e) => set({ discountType: e.target.value as "percent" | "amount" })}>
                      <option value="percent">نسبة ٪</option>
                      <option value="amount">مبلغ ثابت (ج.م)</option>
                    </select>
                  </label>
                  <label><span className="lbl">القيمة</span>
                    <input type="number" min={0} className="inp" value={f.discountValue} onChange={(e) => set({ discountValue: Number(e.target.value) })} />
                  </label>
                  <label><span className="lbl">نص العرض (اختياري)</span>
                    <input className="inp" value={f.discountLabel} onChange={(e) => set({ discountLabel: e.target.value })} placeholder="عرض بداية الترم" />
                  </label>
                  <label><span className="lbl">ينتهي في (اختياري)</span>
                    <input type="date" dir="ltr" className="inp text-right" value={f.discountUntil} onChange={(e) => set({ discountUntil: e.target.value })} />
                  </label>
                  <p className="sm:col-span-4 rounded-2xl bg-primary/8 px-3 py-2 text-xs font-bold text-primary">
                    السعر بعد الخصم:{" "}
                    {(f.discountType === "percent"
                      ? Math.max(0, f.price - Math.round((f.price * Math.min(100, f.discountValue)) / 100))
                      : Math.max(0, f.price - f.discountValue)
                    ).toLocaleString("ar-EG")} ج.م
                    <span className="mr-2 font-normal text-muted-foreground line-through">{f.price.toLocaleString("ar-EG")}</span>
                  </p>
                </div>
              )}
            </div>

            <label className="sm:col-span-3"><span className="lbl">المزايا (سطر لكل ميزة)</span>
              <textarea rows={4} className="inp" value={f.perks} onChange={(e) => set({ perks: e.target.value })} placeholder="كل الدروس والملفات" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.visible} onChange={(e) => set({ visible: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
              <span className="text-sm text-muted-foreground">إظهارها في الصفحة الرئيسية</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.highlight} onChange={(e) => set({ highlight: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
              <span className="text-sm text-muted-foreground">إبرازها (الأكثر طلباً)</span>
            </label>
            <div className="flex items-end">
              <Button className="w-full px-5 py-2.5" onClick={commit}><Check className="size-4" /> {editing ? "حفظ التعديل" : "حفظ الخطة"}</Button>
            </div>
          </div>
        </Card>
      )}

      {plans.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد خطط بعد. أضِف أول خطة لتظهر على الصفحة الرئيسية ويُولَّد منها كود تفعيل.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...plans].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`flex h-full flex-col ${p.highlight ? "ring-1 ring-primary/40" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: p.color || "hsl(var(--primary))" }} />
                    <div className="min-w-0">
                    <p className="font-display text-lg font-extrabold">{p.name}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {p.scope === "subject" ? <BookOpen className="size-3.5" /> : <Layers className="size-3.5" />}
                      {p.scope === "all" ? "كل المواد"
                        : p.scope === "term" ? `كل مواد ${p.termNo === 2 ? "الفصل الثاني" : "الفصل الأول"}`
                          : subjects.find((s) => s.id === p.subjectId)?.name ?? "كورس محذوف"}
                    </p>
                    </div>
                  </div>
                  {p.badge && <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary"><Sparkles className="size-3" /> {p.badge}</span>}
                </div>
                {(() => {
                  const priced = planPrice(p);
                  return (
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <p className="font-display text-2xl font-extrabold" style={{ color: p.color || "hsl(var(--primary))" }}>
                        {priced.price.toLocaleString("ar-EG")} <span className="text-xs font-normal text-muted-foreground">ج.م</span>
                      </p>
                      {priced.active && (
                        <>
                          <span className="pb-1 text-xs font-bold text-muted-foreground line-through">{priced.original.toLocaleString("ar-EG")}</span>
                          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            <Tag className="size-3" /> خصم {priced.percent}٪{p.discount?.until ? ` · حتى ${new Date(p.discount.until).toLocaleDateString("ar-EG")}` : ""}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> {durationText(p)}</p>
                {p.desc && <p className="mt-3 text-xs text-muted-foreground">{p.desc}</p>}
                {(p.perks?.length ?? 0) > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {p.perks!.slice(0, 4).map((x, k) => <li key={k} className="flex gap-1.5"><Check className="mt-0.5 size-3 shrink-0 text-primary" />{x}</li>)}
                  </ul>
                )}
                <div className="mt-auto flex items-center gap-1 border-t border-border pt-4">
                  <span className={`ml-auto inline-flex items-center gap-1 text-[11px] font-bold ${p.visible ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {p.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {p.visible ? "ظاهرة" : "مخفيّة"}
                  </span>
                  {p.highlight && <Star className="size-4 text-amber-500" />}
                  <button onClick={() => toggleVisible(p.id)} title="إظهار/إخفاء" className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary">
                    {p.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button onClick={() => startEdit(p)} title="تعديل" className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary"><Pencil className="size-4" /></button>
                  <button onClick={() => remove(p.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`.inp{width:100%;border-radius:0.9rem;border:1px solid hsl(var(--border));background:hsl(var(--card)/0.6);padding:0.55rem 0.8rem;font-size:0.85rem;outline:none;color:inherit;font-family:inherit}.inp:focus{border-color:hsl(var(--primary)/0.6)}.lbl{margin-bottom:0.25rem;display:block;font-size:0.7rem;font-weight:600;color:hsl(var(--muted-foreground))}`}</style>
    </>
  );
}
