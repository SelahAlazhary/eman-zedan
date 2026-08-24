"use client";

/**
 * قسم الخطط — بطاقات تسعير احترافية مبنية على SVG.
 * • لكل خطة لون خاص (من اللوحة) يلوّن ترويستها وزخرفتها وزرّها.
 * • الخصم يظهر كشريط مائل + السعر القديم مشطوباً + نسبة التوفير + عدّاد انتهاء العرض.
 * • الخطة المميّزة ترتفع وتُوسَم، والترتيب من اللوحة.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SectionHeading, Reveal, Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import {
  IconCheck, IconSparkle, IconCalendar, IconLayers, IconBook, IconWhatsapp, IconArrowLeft,
} from "@/components/brand/icons";
import { GeoBackdrop } from "@/components/brand/pattern";
import { EmptyPlans } from "@/components/brand/illustrations";
import { useUid } from "@/components/brand/use-uid";
import { planPrice, planColor } from "@/lib/plans";
import type { SitePlan } from "@/lib/types";

/** وصف مدّة الخطة بلغة الطالب. */
export function planDuration(p: SitePlan, termEnd?: string): string {
  if (p.kind === "term") {
    const end = p.endsAt || termEnd;
    return end
      ? `حتى نهاية الترم (${new Date(end).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })})`
      : "طوال الترم الدراسي";
  }
  if (p.kind === "month") return `لمدة ${(p.durationDays ?? 30).toLocaleString("ar-EG")} يوماً`;
  if (p.durationDays && p.durationDays > 0) return `لمدة ${p.durationDays.toLocaleString("ar-EG")} يوماً`;
  return "اشتراك دائم";
}

export function planScopeLabel(p: SitePlan, subjectName?: string): string {
  if (p.scope === "all") return "كل المواد (الفصلان)";
  if (p.scope === "term") return `كل مواد ${p.termNo === 2 ? "الفصل الدراسي الثاني" : "الفصل الدراسي الأول"}`;
  return subjectName || "كورس محدّد";
}

/** ترويسة SVG للبطاقة: قوس + زخرفة + شريط خصم مائل. */
function PlanCrest({ tone, discount, featured }: { tone: string; discount?: number; featured?: boolean }) {
  const uid = useUid("crest");
  const W = 400;
  const H = 96;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-x-0 top-0 h-24 w-full" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={tone} stopOpacity={featured ? 0.28 : 0.18} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.04} />
        </linearGradient>
        <pattern id={`${uid}-t`} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <g fill="none" stroke={tone} strokeWidth="1" strokeOpacity="0.45">
            <rect x="8.5" y="8.5" width="17" height="17" />
            <path d="M17 0 34 17 17 34 0 17Z" />
          </g>
        </pattern>
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}-m`}>
          <rect width={W} height={H} fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-g)`} />
      <rect width={W} height={H} fill={`url(#${uid}-t)`} mask={`url(#${uid}-m)`} opacity="0.5" />
      <path d={`M0 ${H} Q${W / 2} ${H - 28} ${W} ${H}`} fill="none" stroke={tone} strokeOpacity="0.35" strokeWidth="1.5" />
      {discount ? (
        <g>
          <path d={`M${W - 128} -10 L${W + 10} -10 L${W + 10} 24 L${W - 150} 24 Z`} fill={tone} opacity="0.95" transform={`rotate(-8 ${W - 60} 8)`} />
          <text x={W - 62} y="14" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800" transform={`rotate(-8 ${W - 62} 10)`}>
            خصم {discount}٪
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/** عدّاد انتهاء العرض. */
function useCountdown(until?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const diff = new Date(until).getTime() - now;
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `ينتهي العرض بعد ${days.toLocaleString("ar-EG")} يوم`;
  if (hours > 0) return `ينتهي العرض بعد ${hours.toLocaleString("ar-EG")} ساعة`;
  return "ينتهي العرض اليوم";
}

function PlanCard({ plan, subjectName, termEnd, href, index, loggedIn }: {
  plan: SitePlan; subjectName?: string; termEnd?: string; href: string; index: number; loggedIn: boolean;
}) {
  const priced = planPrice(plan);
  const tone = planColor(plan) ?? "hsl(var(--primary))";
  const countdown = useCountdown(priced.active ? priced.until : null);
  const featured = Boolean(plan.highlight);

  return (
    <Reveal delay={index * 0.07} className="h-full">
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={`glass relative flex h-full flex-col overflow-hidden rounded-4xl pt-10 shadow-bento ${featured ? "md:-mt-4 md:pb-4" : ""}`}
        style={featured ? { boxShadow: `0 0 0 2px ${tone}55, 0 24px 60px -32px ${tone}` } : undefined}
      >
        <PlanCrest tone={tone} discount={priced.active ? priced.percent : undefined} featured={featured} />

        <div className="relative flex h-full flex-col p-6 pt-2">
          {/* الاسم والنطاق */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-extrabold leading-snug">{plan.name}</h3>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                {plan.scope === "subject" ? <IconBook className="size-3.5" /> : <IconLayers className="size-3.5" />}
                {planScopeLabel(plan, subjectName)}
              </p>
            </div>
            {plan.badge && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold text-white"
                style={{ background: tone }}>
                <IconSparkle anim="pulse" className="size-3" /> {plan.badge}
              </span>
            )}
          </div>

          {/* السعر */}
          <div className="mt-6">
            <div className="flex flex-wrap items-end gap-2">
              <span className="font-display text-[2.75rem] font-extrabold leading-none" style={{ color: tone }}>
                {priced.price.toLocaleString("ar-EG")}
              </span>
              <span className="pb-1.5 text-sm font-bold text-muted-foreground">ج.م</span>
              {priced.active && (
                <span className="pb-1.5 text-sm font-bold text-muted-foreground line-through decoration-2">
                  {priced.original.toLocaleString("ar-EG")}
                </span>
              )}
            </div>
            {priced.active && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600">
                {priced.label || "عرض خاص"} · وفّرت {priced.off.toLocaleString("ar-EG")} ج.م
              </p>
            )}
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconCalendar className="size-3.5" /> {planDuration(plan, termEnd)}
            </p>
            {countdown && (
              <p className="mt-1 text-[11px] font-bold text-rose-500">{countdown}</p>
            )}
          </div>

          {plan.desc && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.desc}</p>}

          {(plan.perks?.length ?? 0) > 0 && (
            <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
              {plan.perks!.map((perk, k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full" style={{ background: `${tone}22`, color: tone }}>
                    <IconCheck className="size-3.5" />
                  </span>
                  <span className="text-muted-foreground">{perk}</span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={href}
            className={`group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 pt-3.5 text-sm font-extrabold transition ${
              featured ? "text-white" : "border-2"
            }`}
            style={featured ? { background: tone } : { borderColor: `${tone}66`, color: tone }}
          >
            {plan.cta || (loggedIn ? "اشترك الآن" : "سجّل الدخول للاشتراك")}
            <IconArrowLeft className="ico-slide size-4" />
          </Link>
        </div>
      </motion.div>
    </Reveal>
  );
}

export function Plans() {
  const { db, content, wa, session } = useContent();
  if (content.ui?.["section.plans"]?.hidden) return null;

  const plans = (db?.plans ?? [])
    .filter((p) => p.visible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.price - b.price);
  const sec = content.plansSection ?? {};
  const subjectName = (id?: string) => db?.subjects.find((s) => s.id === id)?.name;
  // الاشتراك لا يُفتح إلا بعد تسجيل الدخول
  const joinHref = session ? "/student/subjects" : "/login?next=/student/subjects";
  const anyDiscount = plans.some((p) => planPrice(p).active);

  return (
    <section id="plans" className="relative py-24">
      <GeoBackdrop density={96} opacity={0.42} fade="center" />
      <div className="container">
        <SectionHeading
          eyebrow={sec.eyebrow || "الخطط"}
          title={<>{sec.title || "اختر خطة"} <span className="text-gradient">اشتراكك</span></>}
          desc={sec.desc || "خطط واضحة بأسعار ثابتة — فعّل خطتك بكود التفعيل وابدأ من الدرس الأول."}
        />

        {anyDiscount && (
          <p className="mx-auto -mt-6 mb-10 w-fit rounded-full bg-emerald-500/12 px-4 py-1.5 text-xs font-extrabold text-emerald-600">
            عروض سارية الآن — الأسعار المخفّضة ظاهرة بالأسفل
          </p>
        )}

        {plans.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center text-muted-foreground">
            <EmptyPlans className="text-primary" width={188} />
            <p className="text-sm">لم تُضَف خطط بعد.</p>
          </div>
        ) : (
          <div className={`grid items-stretch gap-6 ${plans.length === 1 ? "mx-auto max-w-md" : plans.length === 2 ? "sm:grid-cols-2 lg:mx-auto lg:max-w-3xl" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {plans.map((p, i) => (
              <PlanCard
                key={p.id}
                plan={p}
                index={i}
                subjectName={subjectName(p.subjectId)}
                termEnd={content.termEnd}
                href={joinHref}
                loggedIn={Boolean(session)}
              />
            ))}
          </div>
        )}

        {sec.note !== "" && (
          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
            {sec.note || "حوّل قيمة الخطة على فودافون كاش أو إنستاباي، وأرسل الإيصال على واتساب ليصلك كود التفعيل."}
          </p>
        )}

        <div className="mt-6 text-center">
          <Button as="a" href={wa("أريد الاشتراك في إحدى الخطط")}>
            <IconWhatsapp className="size-4" /> استفسر عن الخطط
          </Button>
        </div>
      </div>
    </section>
  );
}
