"use client";

/** مكوّنات واجهة قابلة لإعادة الاستخدام داخل لوحات التحكّم. */
import type { ReactNode } from "react";
import { motion } from "framer-motion";

const toneMap: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  emerald: "bg-emerald-500/12 text-emerald-500",
  amber: "bg-amber-500/12 text-amber-500",
  violet: "bg-violet-500/12 text-violet-500",
};

/* بطاقة إحصائية */
export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "primary",
  index = 0,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon: ReactNode;
  tone?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-3xl p-5 shadow-bento"
    >
      <div className="flex items-start justify-between">
        <span className={`grid size-11 place-items-center rounded-2xl ${toneMap[tone] ?? toneMap.primary}`}>
          {icon}
        </span>
        {delta && (
          <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs font-bold text-emerald-500">
            {delta}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}

/* رأس الصفحة */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* بطاقة عامة */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-5 shadow-bento ${className}`}>{children}</div>;
}

/* شارة حالة ملوّنة */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    نشط: "bg-emerald-500/15 text-emerald-500",
    منشور: "bg-emerald-500/15 text-emerald-500",
    منشورة: "bg-emerald-500/15 text-emerald-500",
    متاح: "bg-emerald-500/15 text-emerald-500",
    مكتمل: "bg-emerald-500/15 text-emerald-500",
    مغلقة: "bg-emerald-500/15 text-emerald-500",
    مباشر: "bg-rose-500/15 text-rose-500",
    "بانتظار التفعيل": "bg-amber-500/15 text-amber-500",
    مسودّة: "bg-amber-500/15 text-amber-500",
    مجدول: "bg-amber-500/15 text-amber-500",
    "قيد المعالجة": "bg-amber-500/15 text-amber-500",
    مفتوحة: "bg-sky-500/15 text-sky-500",
    مستخدم: "bg-sky-500/15 text-sky-500",
    موقوف: "bg-rose-500/15 text-rose-500",
    منتهي: "bg-muted text-muted-foreground",
    مسجّل: "bg-sky-500/15 text-sky-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status === "مباشر" && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {status}
    </span>
  );
}

/* شريط تقدّم */
export function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color ?? "hsl(var(--primary))" }}
      />
    </div>
  );
}

/* جدول بيانات بسيط ومتجاوب */
export function DataTable({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="glass overflow-hidden rounded-3xl shadow-bento">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              {head.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
