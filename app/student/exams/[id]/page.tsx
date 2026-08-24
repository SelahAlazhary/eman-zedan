"use client";

/**
 * صفحة أداء الاختبار داخل المنصّة:
 * مؤقّت تنازلي · تنقّل بين الأسئلة · شريط تقدّم · تسليم تلقائي عند انتهاء الوقت.
 * التصحيح كلّه على الخادم — الإجابات الصحيحة تصل فقط بعد التسليم.
 */
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconArrowLeft, IconCheck, IconCheckCircle, IconXCircle, IconClock,
  IconSpinner, IconTrophy, IconLock, IconRotate,
} from "@/components/brand/icons";
import { PageHeader, Card, Progress } from "@/components/dashboard/ui";
import { ProgressRing } from "@/components/brand/progress-ring";
import { useContent } from "@/components/content/content-provider";

type Graded = { score: number; total: number; percent: number; passed: boolean; correct: number[] };

export default function ExamRunner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, session, refresh } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const exam = db?.exams.find((e) => e.id === id);
  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;

  const questions = useMemo(() => exam?.questions ?? [], [exam]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const submitted = useRef(false);

  // تهيئة الإجابات عند وصول الأسئلة
  useEffect(() => {
    if (questions.length && answers.length !== questions.length) {
      setAnswers(Array(questions.length).fill(-1));
    }
  }, [questions.length, answers.length]);

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: id, answers }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "تعذّر تسليم الاختبار"); submitted.current = false; return; }
      setGraded({ ...data.attempt, correct: data.correct });
      setLeft(null);
      await refresh();
    } catch {
      setErr("تعذّر الاتصال — حاول مرة أخرى");
      submitted.current = false;
    } finally {
      setBusy(false);
    }
  }, [answers, id, refresh]);

  // المؤقّت التنازلي (يبدأ مع فتح الصفحة)
  useEffect(() => {
    if (!exam || !exam.duration || graded) return;
    setLeft(exam.duration * 60);
    const t = setInterval(() => {
      setLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) { clearInterval(t); void submit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id, graded]);

  if (!exam) return <Missing msg="الاختبار غير موجود أو أُزيل." />;
  if (exam.status !== "منشور") return <Missing msg="هذا الاختبار غير متاح حالياً." />;
  if (!questions.length) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-amber-500/12 text-amber-500"><IconLock className="size-7" /></span>
        <h2 className="font-display text-xl font-extrabold">هذا الاختبار للمشتركين</h2>
        <p className="mt-2 text-sm text-muted-foreground">{y("فعّل")} اشتراكك لتتمكّن من دخول الاختبار.</p>
        <Link href="/student/subjects" className="mt-5 inline-flex rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white">خيارات الاشتراك</Link>
      </Card>
    );
  }

  const answered = answers.filter((a) => a >= 0).length;
  const percentDone = Math.round((answered / questions.length) * 100);
  const mm = left !== null ? String(Math.floor(left / 60)).padStart(2, "0") : null;
  const ss = left !== null ? String(left % 60).padStart(2, "0") : null;
  const q = questions[idx];

  /* ---------- النتيجة ---------- */
  if (graded) {
    return (
      <>
        <Link href="/student/exams" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
          <IconArrowLeft className="size-4 rotate-180" /> كل الاختبارات
        </Link>
        <Card className="mb-6 text-center">
          <ProgressRing value={graded.percent} size={132} thickness={9} className="mx-auto" />
          <h2 className="mt-3 font-display text-2xl font-extrabold">
            {graded.passed ? (fem ? "مبروك، نجحتِ 🎉" : "مبروك، نجحت 🎉") : "لم تبلغ درجة النجاح"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            درجتك {graded.score} من {graded.total} · نسبة النجاح {exam.passScore ?? 60}٪
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/student/exams" className="rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white">كل الاختبارات</Link>
            <button
              onClick={() => { setGraded(null); setAnswers(Array(questions.length).fill(-1)); setIdx(0); submitted.current = false; }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
            >
              <IconRotate className="size-4" /> {y("أعد")} المحاولة
            </button>
          </div>
        </Card>

        <p className="mb-3 inline-flex items-center gap-2 font-display font-extrabold"><IconTrophy className="size-5 text-primary" /> مراجعة الإجابات</p>
        <div className="space-y-3">
          {questions.map((item, i) => {
            const mine = answers[i];
            const right = graded.correct[i];
            return (
              <Card key={item.id} className="!p-4">
                <p className="mb-3 flex gap-2 text-sm font-bold">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${mine === right ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>{i + 1}</span>
                  {item.text}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {item.options.map((o, k) => (
                    <span key={k} className={`flex items-center gap-2 rounded-2xl border p-2.5 text-sm ${
                      k === right ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                        : k === mine ? "border-rose-500/50 bg-rose-500/10 text-rose-500"
                          : "border-border text-muted-foreground"
                    }`}>
                      {k === right ? <IconCheckCircle anim="tick" className="size-4 shrink-0" /> : k === mine ? <IconXCircle className="size-4 shrink-0" /> : <span className="size-4 shrink-0" />}
                      {o}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  }

  /* ---------- أداء الاختبار ---------- */
  return (
    <>
      <Link href="/student/exams" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <IconArrowLeft className="size-4 rotate-180" /> كل الاختبارات
      </Link>
      <PageHeader
        title={exam.title}
        subtitle={`${exam.subject} · ${questions.length} سؤال`}
        action={
          left !== null ? (
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-lg font-extrabold tabular-nums ${
              left <= 60 ? "bg-rose-500/15 text-rose-500" : "bg-primary/12 text-primary"
            }`}>
              <IconClock anim="pulse" className="size-5" /> {mm}:{ss}
            </span>
          ) : undefined
        }
      />

      {/* شريط التقدّم + مربّعات الأسئلة */}
      <Card className="mb-5 !p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{y("أجبت")} عن {answered.toLocaleString("ar-EG")} من {questions.length.toLocaleString("ar-EG")}</span>
          <span className="font-bold text-primary">{percentDone}٪</span>
        </div>
        <Progress value={percentDone} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {questions.map((item, i) => (
            <button key={item.id} onClick={() => setIdx(i)} aria-label={`السؤال ${i + 1}`}
              className={`size-8 rounded-xl text-xs font-bold transition ${
                i === idx ? "btn-glow text-white"
                  : answers[i] >= 0 ? "bg-primary/12 text-primary"
                    : "border border-border text-muted-foreground"
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      </Card>

      {/* السؤال الحالي */}
      <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <Card>
          <p className="mb-4 flex gap-2 font-display text-lg font-extrabold">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-sm text-primary">{idx + 1}</span>
            {q.text}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const chosen = answers[idx] === k;
              return (
                <button key={k}
                  onClick={() => setAnswers((prev) => prev.map((a, i) => (i === idx ? k : a)))}
                  className={`flex min-h-[3.25rem] items-center gap-3 rounded-2xl border p-3 text-right text-sm transition ${
                    chosen ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${chosen ? "border-primary bg-primary text-white" : "border-border"}`}>
                    {chosen && <IconCheck className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">{o}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
            <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-bold disabled:opacity-40">السابق</button>
            {idx < questions.length - 1 ? (
              <button onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white">التالي</button>
            ) : (
              <button onClick={submit} disabled={busy}
                className="inline-flex items-center gap-2 rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {busy ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />} تسليم الاختبار
              </button>
            )}
            <span className="mr-auto text-xs text-muted-foreground">{idx + 1} / {questions.length}</span>
          </div>
        </Card>
      </motion.div>

      {err && <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-500">{err}</p>}

      {/* تسليم دائم في الأسفل على الجوّال */}
      {idx < questions.length - 1 && (
        <div className="sticky-cta mt-5 flex justify-center lg:hidden">
          <button onClick={submit} disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/90 px-6 py-3 text-sm font-bold text-primary backdrop-blur">
            {busy ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />} تسليم الآن
          </button>
        </div>
      )}
    </>
  );
}

function Missing({ msg }: { msg: string }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="py-6 text-sm text-muted-foreground">{msg}</p>
      <Link href="/student/exams" className="inline-flex rounded-full border border-border px-5 py-2 text-sm font-bold transition hover:border-primary hover:text-primary">
        كل الاختبارات
      </Link>
    </Card>
  );
}
