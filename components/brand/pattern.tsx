"use client";

/**
 * الطبقة الزخرفية للموقع — SVG بالكامل (بلا صور نقطية ولا هالات blur).
 * • GeoBackdrop : تبليط هندسي إسلامي (نجمة ثمانية متشابكة) بقناع تلاشٍ إشعاعي.
 * • RuleOrnament: فاصل سطري دقيق تحت عناوين الأقسام.
 * • ArchPath    : مسار قوس المحراب — يُعاد استخدامه في الإطار والبطاقات.
 * • CornerKnot  : عقدة زاوية للبطاقات.
 * كل الزخارف aria-hidden وترث اللون من الثيم عبر currentColor.
 */
import type { SVGProps } from "react";
import { useUid } from "./use-uid";

/** مسار قوس مدبّب داخل صندوق w×h (نسب ثابتة تُحافظ على الشكل عند أي مقاس). */
export function archPath(w: number, h: number, inset = 0): string {
  const x0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  const shoulder = h * 0.42; // ارتفاع بداية انحناء القوس
  const apex = inset + h * 0.02;
  const cy = h * 0.16;
  return `M${x0} ${y1} V${shoulder} Q${x0} ${cy} ${w / 2} ${apex} Q${x1} ${cy} ${x1} ${shoulder} V${y1} Z`;
}

/**
 * خلفية هندسية مبلّطة. density = مقاس بلاطة النمط بالبكسل.
 * التبليط بـ userSpaceOnUse ليبقى ثابت الحجم مهما اتّسع القسم.
 */
export function GeoBackdrop({
  density = 72,
  opacity = 0.5,
  fade = "top",
  tone = "text-primary/25",
  className = "",
}: {
  density?: number;
  opacity?: number;
  fade?: "top" | "center" | "bottom";
  /** لون النمط (يُمرَّر كصنف نصّي — النمط يرث currentColor). */
  tone?: string;
  className?: string;
}) {
  const uid = useUid("geo");
  const t = density;
  const m = t / 2;
  const q = t / 4;
  const focus = fade === "top" ? "50% 0%" : fade === "bottom" ? "50% 100%" : "50% 50%";
  const [fx, fy] = focus.split(" ");

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${tone} ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        {/* بلاطة النمط: مربّع + معيّن متشابكان = نجمة ثمانية، وعقد صغيرة عند الأركان */}
        <pattern id={`${uid}-tile`} width={t} height={t} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth={1} strokeLinejoin="round">
            <rect x={q} y={q} width={m} height={m} />
            <path d={`M${m} 0 L${t} ${m} L${m} ${t} L0 ${m} Z`} />
            <path d={`M${q} ${q} L0 0 M${t - q} ${q} L${t} 0 M${q} ${t - q} L0 ${t} M${t - q} ${t - q} L${t} ${t}`} opacity={0.6} />
            <circle cx={m} cy={m} r={q / 2.4} opacity={0.75} />
          </g>
        </pattern>
        {/* قناع تلاشٍ: النمط يظهر قرب البؤرة ويختفي عند الحواف */}
        <radialGradient id={`${uid}-fade`} cx={fx} cy={fy} r="78%">
          <stop offset="0%" stopColor="#fff" stopOpacity={opacity} />
          <stop offset="55%" stopColor="#fff" stopOpacity={opacity * 0.45} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse">
          <rect width="100%" height="100%" fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid}-tile)`} mask={`url(#${uid}-mask)`} />
    </svg>
  );
}

/** فاصل زخرفي دقيق — يُستخدم تحت عناوين الأقسام وفي الفوتر. */
export function RuleOrnament({ width = 148, className = "" }: { width?: number; className?: string }) {
  const w = width;
  const c = w / 2;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={w}
      height={14}
      viewBox={`0 0 ${w} 14`}
      fill="none"
      className={className}
    >
      <g stroke="currentColor" strokeWidth={1} strokeLinecap="round">
        <path d={`M0 7h${c - 24}`} opacity={0.35} />
        <path d={`M${c + 24} 7h${c - 24}`} opacity={0.35} />
        <path d={`M${c - 16} 7 ${c - 8} 1 ${c} 7 ${c - 8} 13Z`} opacity={0.8} />
        <path d={`M${c + 16} 7 ${c + 8} 1 ${c} 7 ${c + 8} 13Z`} opacity={0.8} />
        <circle cx={c - 22} cy={7} r={1.4} opacity={0.6} />
        <circle cx={c + 22} cy={7} r={1.4} opacity={0.6} />
      </g>
    </svg>
  );
}

/** عقدة زاوية للبطاقات — تُوضع مطلقة داخل بطاقة نسبية. */
export function CornerKnot({ size = 56, className = "", ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      {...rest}
    >
      <g stroke="currentColor" strokeWidth={1} fill="none">
        <path d="M56 0v18a18 18 0 0 1-18 18H20" opacity={0.5} />
        <path d="M56 10v8a28 28 0 0 1-28 28h-8" opacity={0.3} />
        <path d="M44 0 30 14M50 0 36 14" opacity={0.25} />
      </g>
    </svg>
  );
}

/** إطار قوسي صغير — يُستخدم كخلفية لأيقونات المزايا. */
export function ArchTile({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
    >
      <path d={archPath(48, 48, 1)} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
    </svg>
  );
}
