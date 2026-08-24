"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconPlay, IconClipboardCheck, IconRadio, IconFlame, IconArrowLeft, IconClock,
  IconCalendar, IconLayers,
} from "@/components/brand/icons";
import { GeoBackdrop, CornerKnot } from "@/components/brand/pattern";
import { CourseArt } from "@/components/brand/course-art";
import { ProgressRing } from "@/components/brand/progress-ring";
import { EmptyCourses } from "@/components/brand/illustrations";
import { InstallApp } from "@/components/pwa/install-app";
import { EnableNotifications } from "@/components/pwa/enable-notifications";
import { Card, Progress, StatusBadge } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { subjectActive, activeSubs, daysLeft } from "@/lib/access";

const COLORS = ["#12b981", "#2b8bf6", "#7c3aed", "#e11d48"];

export default function StudentHome() {
  const { db, session } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const subjects = (db?.subjects ?? []).filter((s) => s.status === "منشورة");
  const live = db?.live ?? [];
  const exams = db?.exams ?? [];

  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`; // صيغة الأمر: أكمل/أكملي
  const owns = (s: { id: string; term?: 1 | 2 }) => subjectActive(me, s);
  const subs = activeSubs(me);
  const courses = subjects
    .filter((s) => owns(s))
    .map((s, i) => ({ ...s, color: COLORS[i % COLORS.length], progress: me?.progress?.[s.id] ?? 0 }));
  const liveNow = live.find((l) => l.status === "مباشر");
  // اختبار متاح فعلاً للطالب (الأسئلة تصل فارغة لمن لا يحقّ له)
  const nextExam = exams.find((e) => e.status === "منشور" && e.questions.length > 0);
  const avg = courses.length ? Math.round(courses.reduce((a, c) => a + c.progress, 0) / courses.length) : 0;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="btn-glow relative mb-6 overflow-hidden rounded-3xl p-6 text-white sm:p-8">
        <GeoBackdrop density={58} opacity={0.65} fade="center" tone="text-white/60" className="!z-0" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">أهلاً {fem ? "بكِ" : "بك"} 👋</p>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{session?.name}</h1>
            <p className="mt-1 text-sm text-white/80">{me?.grade || "طالب علم"}</p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing value={avg} size={78} label="متوسط تقدّمك" tone="#fff" trackOpacity={0.28} />
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/15 px-3 py-2">
              <IconFlame anim="flick" className="size-5" />
              <div className="leading-none"><p className="font-display text-lg font-extrabold">٧</p><p className="text-[10px] text-white/80">أيام متتالية</p></div>
            </div>
          </div>
        </div>
      </motion.div>

      {subs.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {subs.map((sb) => {
            const left = daysLeft(sb.expiresAt);
            const all = sb.subjectId === "*";
            return (
              <Card key={sb.id} className="flex items-center gap-3 !p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                  {all ? <IconLayers className="size-5" /> : <IconPlay className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{sb.planName ?? (all ? "الترم الكامل" : "اشتراك كورس")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {all ? "كل المواد المتاحة لصفّك" : subjects.find((s) => s.id === sb.subjectId)?.name ?? "كورس"}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${left !== null && left <= 7 ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"}`}>
                  <IconCalendar className="size-3" />
                  {left !== null ? `متبقٍ ${left.toLocaleString("ar-EG")} يوم` : "بلا انتهاء"}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      <InstallApp className="mb-4" />
      <EnableNotifications className="mb-6" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {liveNow && (
          <Card className="flex items-center gap-4 !p-4">
            <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-500/12 text-rose-500"><IconRadio anim="pulse" className="size-6" /><span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-rose-500/40" /></span>
            <div className="min-w-0 flex-1"><StatusBadge status="مباشر" /><p className="mt-1 truncate font-bold">{liveNow.title}</p></div>
            <Link href="/student/live" className="rounded-full btn-glow px-4 py-2 text-xs font-bold text-white">دخول</Link>
          </Card>
        )}
        {nextExam && (
          <Card className="flex items-center gap-4 !p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary"><IconClipboardCheck className="size-6" /></span>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold text-primary">اختبار متاح</p><p className="truncate font-bold">{nextExam.title}</p></div>
            <Link href={`/student/exams/${nextExam.id}`} className="rounded-full border border-border px-4 py-2.5 text-xs font-bold transition hover:border-primary hover:text-primary">{y("ابدأ")}</Link>
          </Card>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-lg font-extrabold">{y("أكمل")} المذاكرة</p>
        <Link href="/student/subjects" className="group -my-2 inline-flex items-center gap-1 py-2 text-xs font-bold text-primary">كل الكورسات <IconArrowLeft className="ico-slide size-4" /></Link>
      </div>
      {courses.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <EmptyCourses className="text-primary" width={168} />
          <p className="font-display text-lg font-extrabold">لم {y("تفعّل")} أي كورس بعد</p>
          <p className="max-w-sm text-sm text-muted-foreground">{y("تصفّح")} الكورسات المتاحة {y("واشتر")} ما يناسبك، ثم {y("فعّل")}ه بكود التفعيل.</p>
          <Link href="/student/subjects" className="mt-2 rounded-full btn-glow px-7 py-3 text-sm font-bold text-white">{y("تصفّح")} الكورسات</Link>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link href={`/student/course/${c.id}`} className="group block">
              <Card className="relative flex gap-4 overflow-hidden transition hover:border-primary/40 !p-4">
                <CornerKnot size={52} className="pointer-events-none absolute left-0 top-0 -scale-x-100 text-primary/25" />
                {/* لوحة مصغّرة من نفس نظام أغلفة الكورسات */}
                <span className="relative w-28 shrink-0 overflow-hidden rounded-2xl sm:w-32">
                  <CourseArt
                    seed={c.id}
                    title={c.name}
                    cover={c.cover}
                    coverFit={c.coverFit}
                    coverRatio={c.coverRatio}
                    progress={c.progress}
                    className="h-full transition-opacity duration-300 group-hover:opacity-95"
                  />
                </span>
                <span className="relative flex min-w-0 flex-1 flex-col justify-center">
                  <p className="truncate font-display font-extrabold">{c.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.teacher}</p>
                  <span className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><IconClock className="size-3.5" /> {c.lessons} درس</span>
                    <span>{c.grade}</span>
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    {y("أكمل")} من حيث توقّفت <IconArrowLeft className="ico-slide size-3.5" />
                  </span>
                </span>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
