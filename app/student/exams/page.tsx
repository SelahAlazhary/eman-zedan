"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconClipboardCheck, IconClock, IconCheckCircle, IconCalendar, IconLock, IconArrowLeft,
} from "@/components/brand/icons";
import { PageHeader, Card, StatusBadge } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";

export default function StudentExamsPage() {
  const { db, session } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;
  const exams = (db?.exams ?? []).filter((e) => e.status === "منشور");

  /** أفضل محاولة للطالب في اختبار. */
  const best = (examId: string) => {
    const tries = (me?.examAttempts ?? []).filter((a) => a.examId === examId);
    if (!tries.length) return null;
    return tries.reduce((a, b) => (b.percent > a.percent ? b : a));
  };
  // الأسئلة تصل فارغة إذا لم يكن الطالب مخوّلاً (يُفرض على الخادم)
  const locked = (examId: string) => {
    const e = exams.find((x) => x.id === examId);
    return !e || e.questions.length === 0;
  };

  const solved = exams.filter((e) => best(e.id)).length;
  const passed = exams.filter((e) => best(e.id)?.passed).length;

  return (
    <>
      <PageHeader title="الاختبارات" subtitle={`${y("حلّ")} اختباراتك داخل المنصّة — النتيجة تظهر فوراً`} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Summary icon={<IconClipboardCheck className="size-5" />} label="اختبارات متاحة" value={exams.length} tone="bg-primary/12 text-primary" />
        <Summary icon={<IconCheckCircle className="size-5" />} label="تم حلّها" value={solved} tone="bg-sky-500/12 text-sky-500" />
        <Summary icon={<IconCheckCircle className="size-5" />} label="نجحت فيها" value={passed} tone="bg-emerald-500/12 text-emerald-500" />
      </div>

      {exams.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary"><IconClipboardCheck className="size-7" /></span>
          <p className="font-display text-lg font-extrabold">لا توجد اختبارات بعد</p>
          <p className="max-w-sm text-sm text-muted-foreground">ستظهر اختباراتك هنا فور نشرها.</p>
        </Card>
      )}

      <div className="space-y-3">
        {exams.map((e, i) => {
          const b = best(e.id);
          const isLocked = locked(e.id);
          const tries = (me?.examAttempts ?? []).filter((a) => a.examId === e.id).length;
          const exhausted = (e.attempts ?? 0) > 0 && tries >= (e.attempts ?? 0);
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="!p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                    <IconClipboardCheck className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{e.title}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{e.subject}</span>
                      <span className="inline-flex items-center gap-1"><IconClipboardCheck className="size-3.5" /> {e.questions.length || "—"} سؤال</span>
                      {e.duration > 0 && <span className="inline-flex items-center gap-1"><IconClock className="size-3.5" /> {e.duration} دقيقة</span>}
                      <span className="inline-flex items-center gap-1"><IconCalendar className="size-3.5" /> {e.grade}</span>
                    </p>
                  </div>

                  {b && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${b.passed ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>
                      {b.score}/{b.total} · {b.percent}٪
                    </span>
                  )}

                  {isLocked ? (
                    <Link href="/student/subjects" className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-500 transition hover:bg-amber-500/10">
                      <IconLock className="size-3.5" /> للمشتركين فقط
                    </Link>
                  ) : exhausted ? (
                    <span className="rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground">انتهت محاولاتك</span>
                  ) : (
                    <Link href={`/student/exams/${e.id}`} className="inline-flex items-center gap-1 rounded-full btn-glow px-5 py-2.5 text-xs font-bold text-white">
                      {b ? y("أعد") + " المحاولة" : y("ابدأ") + " الاختبار"} <IconArrowLeft className="size-3.5" />
                    </Link>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

function Summary({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: string }) {
  return (
    <Card className="flex items-center gap-3">
      <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      <div>
        <p className="font-display text-xl font-extrabold">{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
