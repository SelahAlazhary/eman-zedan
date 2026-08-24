"use client";

/**
 * حلقة تقدّم SVG — بديل شريط التقدّم في الأماكن التي تحتاج قراءة سريعة.
 * الطول المرسوم يُحسب من محيط الدائرة (stroke-dasharray) لا بحيَل CSS،
 * والحركة تُلغى مع prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";

export function ProgressRing({
  value,
  size = 72,
  thickness = 6,
  tone = "hsl(var(--primary))",
  trackOpacity = 0.18,
  label,
  className = "",
}: {
  value: number;
  size?: number;
  thickness?: number;
  tone?: string;
  trackOpacity?: number;
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <span className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <span className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${label ? label + ": " : ""}${pct}٪`}
          className="-rotate-90"
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeOpacity={trackOpacity} strokeWidth={thickness} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <span className="absolute font-display text-lg font-extrabold" style={{ color: tone }}>
          {pct}٪
        </span>
      </span>
      {label && <span className="text-[10px] opacity-80">{label}</span>}
    </span>
  );
}
