"use client";

/**
 * لوحة غلاف الكورس — SVG بالكامل.
 * • بغلاف مرفوع: الصورة تُقصّ داخل شكل قوسي بحدّ زخرفي وحجاب تدرّجي أسفلها.
 * • بلا غلاف: تُولَّد لوحة هندسية من معرّف الكورس نفسه (٤ زخارف × ٦ زوايا لون)،
 *   فيبقى لكل كورس هويّة بصرية ثابتة ومميّزة بلا صور.
 * • حلقة التقدّم وشارة القفل مرسومتان داخل نفس الـSVG (لا عناصر HTML فوقها).
 * كل المعرّفات فريدة عبر useUid، والحركة تحترم prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useUid } from "./use-uid";
import { mediaSrc } from "@/lib/media";
import type { FrameShape, ImageFit } from "@/lib/types";

const W = 400;
const H = 225;

/** بصمة ثابتة من نصّ (لاختيار الزخرفة والزاوية) — نفس الكورس ينتج نفس اللوحة دائماً. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** مستطيل بزوايا دائرية. */
function roundedPath(w: number, h: number, r: number): string {
  const rad = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  return [
    `M${rad} 0`,
    `H${w - rad}`, `a${rad} ${rad} 0 0 1 ${rad} ${rad}`,
    `V${h - rad}`, `a${rad} ${rad} 0 0 1 ${-rad} ${rad}`,
    `H${rad}`, `a${rad} ${rad} 0 0 1 ${-rad} ${-rad}`,
    `V${rad}`, `a${rad} ${rad} 0 0 1 ${rad} ${-rad}`,
    "Z",
  ].join(" ");
}

/** شكل اللوحة: مستطيل بزوايا دائرية وقمّة مقوّسة خفيفة. */
function platePath(w: number, h: number, r = 22): string {
  const rise = h * 0.09; // ارتفاع تقوّس القمّة
  return [
    `M0 ${h - r}`,
    `V${rise + r}`,
    `Q0 ${rise} ${r} ${rise * 0.62}`,
    `Q${w / 2} 0 ${w - r} ${rise * 0.62}`,
    `Q${w} ${rise} ${w} ${rise + r}`,
    `V${h - r}`,
    `q0 ${r} ${-r} ${r}`,
    `H${r}`,
    `q${-r} 0 ${-r} ${-r}`,
    "Z",
  ].join(" ");
}

/* ---------- زخارف البلاطات (٤ أنماط) ---------- */
function tileMotif(kind: number, t: number) {
  const m = t / 2;
  const q = t / 4;
  switch (kind) {
    case 0: // خاتم ثماني متشابك
      return (
        <>
          <rect x={q} y={q} width={m} height={m} />
          <path d={`M${m} 0 L${t} ${m} L${m} ${t} L0 ${m} Z`} />
          <circle cx={m} cy={m} r={q / 2} />
        </>
      );
    case 1: // تعشيق مربّعات
      return (
        <>
          <rect x={q * 0.6} y={q * 0.6} width={t - q * 1.2} height={t - q * 1.2} />
          <rect x={m - q * 0.7} y={m - q * 0.7} width={q * 1.4} height={q * 1.4} transform={`rotate(45 ${m} ${m})`} />
          <path d={`M0 0 L${t} ${t} M${t} 0 L0 ${t}`} opacity={0.35} />
        </>
      );
    case 2: // أقواس متتابعة
      return (
        <>
          <path d={`M0 ${t} V${m} A${m} ${m} 0 0 1 ${t} ${m} V${t}`} />
          <path d={`M${q} ${t} V${m + q * 0.4} A${q * 1.2} ${q * 1.2} 0 0 1 ${t - q} ${m + q * 0.4} V${t}`} opacity={0.5} />
        </>
      );
    default: // نسيج سداسي
      return (
        <>
          <path d={`M${m} 0 L${t} ${q} V${t - q} L${m} ${t} L0 ${t - q} V${q} Z`} />
          <path d={`M${m} ${q * 0.7} L${t - q * 0.7} ${q * 1.2} V${t - q * 1.2} L${m} ${t - q * 0.7} L${q * 0.7} ${t - q * 1.2} V${q * 1.2} Z`} opacity={0.4} />
        </>
      );
  }
}

export function CourseArt({
  seed,
  title,
  cover,
  coverFit,
  coverRatio,
  progress,
  locked = false,
  className = "",
}: {
  seed: string;
  title: string;
  cover?: string;
  coverFit?: ImageFit;
  coverRatio?: number;
  progress?: number;
  locked?: boolean;
  className?: string;
}) {
  const uid = useUid("art");
  const reduce = useReducedMotion();
  const h = hash(seed || title);
  const motif = h % 4;
  const angle = [0, 15, 30, 45, 60, 75][h % 6];
  const tile = 52 + (h % 3) * 10;
  /* ---------- الإطار ----------
   * مقاس البطاقة ثابت دائماً (١٦:٩) فلا تتمدّد مهما كانت نسبة الصورة.
   * الصورة تُعرض كاملة عند التكبير ١٠٠٪، وما يزيد عن الإطار عند التكبير
   * يُقصّ بإرادة الأدمن من أدوات المحاذاة — لا قصّ تلقائي إطلاقاً.
   */
  const artH = H;

  const shape: FrameShape = coverFit?.shape ?? "arch";
  const radius = coverFit?.radius ?? 22;
  const plate =
    shape === "arch" ? platePath(W, artH, radius)
      : shape === "square" ? roundedPath(W, artH, 0)
        : roundedPath(W, artH, radius);

  // ضبط الغلاف (محاذاة/تكبير) — تحويل من المركز بلا تشويه
  const fitScale = Math.min(3, Math.max(0.5, coverFit?.scale ?? 1));
  const fitDx = ((coverFit?.x ?? 0) / 100) * W;
  const fitDy = ((coverFit?.y ?? 0) / 100) * artH;
  const coverTransform = `translate(${W / 2 + fitDx} ${artH / 2 + fitDy}) scale(${fitScale}) translate(${-W / 2} ${-artH / 2})`;
  // الصورة كاملة دائماً — لا قصّ في أي وضع
  const coverPar = "xMidYMid meet";
  // عند التكبير يقصّ الأدمن بنفسه (تملأ الإطار)، وعند ١٠٠٪ تبقى كاملة بهامش بسيط
  const inset = fitScale > 1.02 ? 0 : 8;

  // حلقة التقدّم (تُرسم فقط للكورسات المفتوحة)
  const showRing = typeof progress === "number" && !locked;
  const rr = 21;
  const rc = 2 * Math.PI * rr;

  return (
    <svg
      viewBox={`0 0 ${W} ${artH}`}
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={`${uid}-plate`}>
          <path d={plate} />
        </clipPath>

        {/* أرضية متدرّجة من ألوان الثيم */}
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2={W} y2={artH} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.92} />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.92} />
        </linearGradient>

        {/* حجاب سفلي يضمن قراءة النصوص فوق الصورة */}
        <linearGradient id={`${uid}-veil`} x1="0" y1={artH * 0.35} x2="0" y2={artH} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#04121b" stopOpacity="0" />
          <stop offset="100%" stopColor="#04121b" stopOpacity="0.55" />
        </linearGradient>

        {/* بلاطة الزخرفة */}
        <pattern
          id={`${uid}-tile`}
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${angle})`}
        >
          <g fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.5} strokeLinejoin="round">
            {tileMotif(motif, tile)}
          </g>
        </pattern>

        {/* تلاشي الزخرفة من الأعلى */}
        <radialGradient id={`${uid}-fade`} cx="22%" cy="8%" r="105%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.85} />
          <stop offset="70%" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`${uid}-fademask`}>
          <rect width={W} height={artH} fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>

      <g clipPath={`url(#${uid}-plate)`}>
        {cover ? (
          <>
            {/* أرضية مزخرفة خلف الصورة: تظهر في الهوامش حين تُعرض الصورة كاملة بلا قصّ */}
            <rect width={W} height={artH} fill={`url(#${uid}-bg)`} />
            <rect width={W} height={artH} fill={`url(#${uid}-tile)`} mask={`url(#${uid}-fademask)`} />
            <g transform={coverTransform}>
              <image
                href={mediaSrc(cover)}
                x={inset}
                y={inset}
                width={W - inset * 2}
                height={artH - inset * 2}
                preserveAspectRatio={coverPar}
              />
            </g>
            {/* حجاب خفيف أسفل الصورة لقراءة الشارات — لا يمسّ حدودها */}
            <rect width={W} height={artH} fill={`url(#${uid}-veil)`} opacity={0.55} />
          </>
        ) : (
          <>
            <rect width={W} height={artH} fill={`url(#${uid}-bg)`} />
            <rect width={W} height={artH} fill={`url(#${uid}-tile)`} mask={`url(#${uid}-fademask)`} />
            {/* خاتم كبير في القلب */}
            <g
              fill="none"
              stroke="#fff"
              strokeOpacity={0.85}
              strokeWidth={1.6}
              strokeLinejoin="round"
              transform={`translate(${W / 2} ${artH / 2})`}
            >
              <rect x={-34} y={-34} width={68} height={68} rx={2} />
              <path d="M0 -48 L48 0 L0 48 L-48 0 Z" />
              <path d="M0 -22 L15 -15 L22 0 L15 15 L0 22 L-15 15 L-22 0 L-15 -15 Z" fill="#fff" fillOpacity={0.16} />
            </g>
            <rect width={W} height={artH} fill={`url(#${uid}-veil)`} opacity={0.5} />
          </>
        )}
      </g>

      {/* حدّ اللوحة + خطّ داخلي رفيع */}
      <path d={plate} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.5} />
      <path
        d={shape === "arch" ? platePath(W - 14, artH - 14, Math.max(0, radius - 5))
          : roundedPath(W - 14, artH - 14, shape === "square" ? 0 : Math.max(0, radius - 5))}
        transform="translate(7 7)"
        fill="none"
        stroke="#fff"
        strokeOpacity={0.18}
        strokeWidth={1}
      />

      {/* عقدة الزاوية العلوية */}
      <g stroke="#fff" strokeOpacity={0.35} strokeWidth={1} fill="none">
        <path d={`M${W - 16} 26 v22 a20 20 0 0 1 -20 20 h-18`} />
        <path d={`M${W - 16} 40 v8 a32 32 0 0 1 -32 32 h-8`} strokeOpacity={0.2} />
      </g>

      {/* حلقة التقدّم */}
      {showRing && (
        <g transform={`translate(${34} ${artH - 34})`}>
          <circle r={rr + 7} fill="#04121b" fillOpacity={0.45} />
          <circle r={rr} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={4} />
          <motion.circle
            r={rr}
            fill="none"
            stroke="#fff"
            strokeWidth={4}
            strokeLinecap="round"
            transform="rotate(-90)"
            strokeDasharray={rc}
            initial={reduce ? { strokeDashoffset: rc * (1 - (progress ?? 0) / 100) } : { strokeDashoffset: rc }}
            animate={{ strokeDashoffset: rc * (1 - (progress ?? 0) / 100) }}
            transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize="14"
            fontWeight="800"
            fontFamily="var(--font-display), sans-serif"
          >
            {Math.round(progress ?? 0)}٪
          </text>
        </g>
      )}

      {/* شارة القفل */}
      {locked && (
        <g transform={`translate(${W - 46} ${artH - 40})`}>
          <circle r={22} fill="#04121b" fillOpacity={0.5} />
          <g stroke="#fff" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x={-9} y={-3} width={18} height={13} rx={3} />
            <path d="M-5 -3v-4a5 5 0 0 1 10 0v4" />
            <path d="M0 2.5v3" />
          </g>
        </g>
      )}
    </svg>
  );
}
