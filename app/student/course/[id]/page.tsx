"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconPlay, IconCheckCircle, IconLock, IconArrowLeft, IconListVideo, IconGift, IconFile,
  IconDownload, IconListChecks, IconXCircle, IconRotate, IconSpinner, IconTrophy,
} from "@/components/brand/icons";
import { EmptyLock } from "@/components/brand/illustrations";
import { PageHeader, Card, Progress } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { subjectActive, subscriptionFor, daysLeft } from "@/lib/access";
import type { Lesson } from "@/lib/types";

/** تحويل رابط الفيديو إلى صيغة تضمين (YouTube / Vimeo / Bunny Stream / mp4). */
function toEmbed(url: string): { kind: "video" | "iframe"; src: string } {
  const u = url.trim();
  // Bunny Stream (iframe.mediadelivery.net) — نحوّل /play/ إلى /embed/
  if (u.includes("mediadelivery.net")) {
    return { kind: "iframe", src: u.replace("/play/", "/embed/") };
  }
  // Google Drive: أي صيغة رابط → صفحة المعاينة القابلة للتضمين
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/) ||
    u.match(/lh3\.googleusercontent\.com\/d\/([\w-]{20,})/);
  if (drive) return { kind: "iframe", src: `https://drive.google.com/file/d/${drive[1]}/preview` };
  // معرّف Bunny بصيغة "libraryId/videoGuid"
  const bunny = u.match(/^(\d{3,7})\/([0-9a-f-]{20,})$/i);
  if (bunny) return { kind: "iframe", src: `https://iframe.mediadelivery.net/embed/${bunny[1]}/${bunny[2]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return { kind: "video", src: u };
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if (vm) return { kind: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  return { kind: "iframe", src: u };
}

export default function CoursePlayer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, session, refresh } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const subject = db?.subjects.find((s) => s.id === id);
  const owned = subjectActive(me, subject);
  const fem = me?.gender === "female";
  const videos = subject?.videos ?? [];
  const canPlay = (_lid: string, isFree?: boolean) => Boolean(isFree) || owned;

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const storeKey = `emz_done_${session?.uid}_${id}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setDone(new Set(JSON.parse(raw)));
    } catch { /* تجاهل */ }
  }, [storeKey]);

  const percent = videos.length ? Math.round((done.size / videos.length) * 100) : 0;

  const markDone = async (lessonId: string) => {
    const next = new Set(done); next.add(lessonId);
    setDone(next);
    try { localStorage.setItem(storeKey, JSON.stringify([...next])); } catch { /* تجاهل */ }
    const pct = videos.length ? Math.round((next.size / videos.length) * 100) : 0;
    await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: id, value: pct }) });
    await refresh();
  };

  const current = videos[idx];
  const embed = useMemo(() => (current ? toEmbed(current.url) : null), [current]);
  const sub = subscriptionFor(me, id);
  const left = daysLeft(sub?.expiresAt);

  if (!subject) {
    return <NotFound msg="الكورس غير موجود." />;
  }
  if (!owned) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <EmptyLock className="mx-auto mb-2 text-primary" width={176} />
        <h2 className="font-display text-xl font-extrabold">هذا الكورس غير مُفعّل</h2>
        <p className="mt-2 text-sm text-muted-foreground">{fem ? "فعّلي" : "فعّل"} الكورس بكود التفعيل لمشاهدة الدروس.</p>
        <Link href="/student/subjects" className="mt-5 inline-flex rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white">{fem ? "اذهبي للتفعيل" : "اذهب للتفعيل"}</Link>
      </Card>
    );
  }

  return (
    <>
      <Link href="/student/subjects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <IconArrowLeft className="size-4 rotate-180" /> كل الكورسات
      </Link>
      <PageHeader
        title={subject.name}
        subtitle={`${subject.teacher} · ${videos.length} درس`}
        action={
          sub ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500">
              <IconCheckCircle className="size-4" />
              {sub.planName ?? (sub.subjectId === "*" ? "الترم الكامل" : "اشتراك الكورس")}
              {left !== null && <span className="text-muted-foreground">· متبقٍ {left.toLocaleString("ar-EG")} يوم</span>}
            </span>
          ) : undefined
        }
      />

      {videos.length === 0 ? (
        <NotFound msg="لم تُضَف دروس لهذا الكورس بعد." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          {/* المشغّل */}
          <div>
            <div className="relative -mx-4 aspect-video overflow-hidden border-y border-border bg-black shadow-bento sm:mx-0 sm:rounded-3xl sm:border">
              {!canPlay(current.id, current.isFree) ? (
                <div className="grid size-full place-items-center bg-slate-900 p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white"><IconLock className="size-7" /></span>
                    <p className="font-display text-lg font-extrabold text-white">هذا الكورس غير مُفعّل</p>
                    <p className="max-w-xs text-sm text-white/70">اشترك شهرياً في هذا الكورس أو خُذ الترم الكامل لمشاهدة كل الدروس.</p>
                    <Link href="/student/subjects" className="rounded-full btn-glow px-5 py-2 text-xs font-bold text-white">خيارات الاشتراك</Link>
                  </div>
                </div>
              ) : embed?.kind === "video" ? (
                <video key={current.id} src={embed.src} controls className="size-full" />
              ) : (
                <iframe key={current.id} src={embed?.src} title={current.title} allowFullScreen
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture" className="size-full" />
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-extrabold">{current.title}</h3>
                {current.duration && <p className="text-xs text-muted-foreground">{current.duration}</p>}
              </div>
              <button onClick={() => markDone(current.id)} disabled={done.has(current.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${done.has(current.id) ? "border border-emerald-500/40 text-emerald-500" : "btn-glow text-white"}`}>
                <IconCheckCircle className="size-4" /> {done.has(current.id) ? "تمّت المشاهدة" : "وضع علامة مكتمل"}
              </button>
            </div>

            {/* الاختبار التفاعلي على الفيديو (إن فعّله الأدمن) */}
            {canPlay(current.id, current.isFree) && current.quiz?.enabled && current.quiz.questions.length > 0 && (
              <LessonQuiz
                key={current.id}
                subjectId={id}
                lesson={current}
                fem={fem}
                previous={me?.quizResults?.find((r) => r.lessonId === current.id) ?? null}
                onGraded={refresh}
              />
            )}

            {/* مواد وملفات الكورس */}
            {(subject.materials?.length ?? 0) > 0 && (
              <div className="mt-6">
                <p className="mb-3 flex items-center gap-2 font-display font-extrabold"><IconFile className="size-5 text-primary" /> ملفات الكورس</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {subject.materials!.map((m) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noreferrer" download
                      className="glass flex items-center gap-3 rounded-2xl p-3 transition hover:border-primary/40">
                      <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary"><IconFile className="size-5" /></span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.title}</span>
                      <IconDownload className="size-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* قائمة الدروس */}
          <Card className="!p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 font-display font-extrabold"><IconListVideo className="size-5 text-primary" /> الدروس</p>
              <span className="text-xs font-bold text-primary">{percent}٪</span>
            </div>
            <Progress value={percent} />
            <div className="mt-4 space-y-1.5">
              {videos.map((v, i) => (
                <button key={v.id} onClick={() => setIdx(i)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-right transition ${i === idx ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted"}`}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${done.has(v.id) ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                    {done.has(v.id) ? <IconCheckCircle className="size-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{v.title}</span>
                    {v.duration && <span className="text-[11px] text-muted-foreground">{v.duration}</span>}
                  </span>
                  {v.isFree && <IconGift className="size-3.5 shrink-0 text-emerald-500" />}
                  {canPlay(v.id, v.isFree)
                    ? <IconPlay className={`size-4 shrink-0 ${i === idx ? "text-primary" : "text-muted-foreground"}`} />
                    : <IconLock className="size-4 shrink-0 text-muted-foreground" />}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function NotFound({ msg }: { msg: string }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="py-6 text-sm text-muted-foreground">{msg}</p>
      <Link href="/student/subjects" className="inline-flex rounded-full border border-border px-5 py-2 text-sm font-bold transition hover:border-primary hover:text-primary">كل الكورسات</Link>
    </Card>
  );
}

/* ---------- الاختبار التفاعلي على الفيديو ---------- */
function LessonQuiz({
  subjectId, lesson, fem, previous, onGraded,
}: {
  subjectId: string;
  lesson: Lesson;
  fem: boolean;
  previous: { score: number; total: number; percent: number; passed: boolean } | null;
  onGraded: () => Promise<void> | void;
}) {
  const questions = lesson.quiz?.questions ?? [];
  const [answers, setAnswers] = useState<number[]>(() => Array(questions.length).fill(-1));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [graded, setGraded] = useState<{ correct: number[]; score: number; total: number; percent: number; passed: boolean } | null>(null);
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;

  const answered = answers.filter((a) => a >= 0).length;
  const pick = (qi: number, oi: number) =>
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));

  const submit = async () => {
    setErr(null);
    if (answered < questions.length) { setErr(`${y("أجب")} عن كل الأسئلة أولاً`); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, lessonId: lesson.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "تعذّر تسليم الاختبار"); return; }
      setGraded({ correct: data.correct, ...data.result });
      await onGraded();
    } catch {
      setErr("تعذّر الاتصال — حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  const retry = () => { setGraded(null); setAnswers(Array(questions.length).fill(-1)); setErr(null); };

  return (
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 font-display font-extrabold">
          <IconListChecks className="size-5 text-primary" /> اختبار الدرس
        </p>
        {graded ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${graded.passed ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>
            <IconTrophy className="size-3.5" /> {graded.score}/{graded.total} · {graded.percent}٪ {graded.passed ? "ناجح" : "لم تنجح"}
          </span>
        ) : previous ? (
          <span className="text-xs text-muted-foreground">آخر نتيجة: {previous.score}/{previous.total} ({previous.percent}٪)</span>
        ) : (
          <span className="text-xs text-muted-foreground">{questions.length.toLocaleString("ar-EG")} أسئلة اختيار من متعدّد</span>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="rounded-2xl border border-border p-4">
            <p className="mb-3 flex gap-2 text-sm font-bold">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs text-primary">{qi + 1}</span>
              {q.text}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const chosen = answers[qi] === oi;
                const right = graded ? graded.correct[qi] === oi : false;
                const wrong = graded ? chosen && graded.correct[qi] !== oi : false;
                return (
                  <button key={oi} disabled={Boolean(graded)} onClick={() => pick(qi, oi)}
                    className={`flex items-center gap-2 rounded-2xl border p-3 text-right text-sm transition ${
                      right ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                      : wrong ? "border-rose-500/50 bg-rose-500/10 text-rose-500"
                      : chosen ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                    }`}>
                    <span className="grid size-5 shrink-0 place-items-center rounded-full border border-current text-[10px]">
                      {right ? <IconCheckCircle className="size-4" /> : wrong ? <IconXCircle className="size-4" /> : chosen ? "●" : ""}
                    </span>
                    <span className="min-w-0 flex-1">{o}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {err && <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-500">{err}</p>}

      <div className="mt-4 flex items-center gap-3">
        {graded ? (
          <button onClick={retry} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
            <IconRotate className="size-4" /> {y("أعد")} المحاولة
          </button>
        ) : (
          <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />} تسليم الإجابات
          </button>
        )}
        <span className="text-xs text-muted-foreground">{answered.toLocaleString("ar-EG")} / {questions.length.toLocaleString("ar-EG")}</span>
      </div>
    </Card>
  );
}
