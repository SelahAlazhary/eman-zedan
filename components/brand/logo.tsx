"use client";

/**
 * علامة المنصّة — نجمة ثمانية (خاتم) متشابكة داخل مثمّن، مرسومة بمسارات دقيقة.
 * • الشعار المرفوع من الأدمن (إن وُجد) له الأولوية؛ وإلا تُرسم العلامة المتّجهة.
 * • النص يبقى HTML (لا SVG) حفاظاً على البحث وقارئات الشاشة والاتجاه RTL.
 */
import Image from "next/image";
import { useUid } from "./use-uid";
import { mediaSrc } from "@/lib/media";

/** العلامة المتّجهة وحدها. */
export function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  const uid = useUid("mark");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      focusable="false"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <clipPath id={`${uid}-c`}>
          <path d="M24 2.4 32.6 6 36 14.6 36 33.4 32.6 42 24 45.6 15.4 42 12 33.4 12 14.6 15.4 6Z" />
        </clipPath>
      </defs>

      {/* الحقل: مثمّن منتظم */}
      <path
        d="M17.6 3.2h12.8L39.4 9.6v28.8l-9 6.4H17.6l-9-6.4V9.6l9-6.4Z"
        fill={`url(#${uid}-g)`}
      />

      {/* الخاتم: مربّع + معيّن متشابكان */}
      <g stroke="#fff" strokeWidth={1.6} fill="none" strokeLinejoin="round" opacity={0.92}>
        <rect x="14.1" y="14.1" width="19.8" height="19.8" rx="1" />
        <path d="M24 10.2 37.8 24 24 37.8 10.2 24 24 10.2Z" />
      </g>

      {/* القلب: مثمّن صغير مصمت */}
      <path
        d="M24 17.4 28.7 19.3 30.6 24 28.7 28.7 24 30.6 19.3 28.7 17.4 24 19.3 19.3Z"
        fill="#fff"
        fillOpacity={0.95}
      />
    </svg>
  );
}

/**
 * كتلة الهوية الكاملة: العلامة + الاسم والوصف (نص HTML).
 * tone="onDark" لاستخدامها فوق خلفية داكنة/ملوّنة.
 */
export function BrandLockup({
  brand,
  subtitle,
  logo,
  size = 40,
  compact = false,
  className = "",
}: {
  brand: string;
  subtitle?: string;
  logo?: string;
  size?: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="grid shrink-0 place-items-center overflow-hidden rounded-2xl"
        style={{ width: size, height: size }}
      >
        {logo ? (
          <Image src={mediaSrc(logo)} alt="" width={size} height={size} unoptimized referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          <BrandMark size={size} />
        )}
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-sm font-extrabold tracking-tight">{brand}</span>
          {subtitle && <span className="mt-1 text-[10px] text-muted-foreground">{subtitle}</span>}
        </span>
      )}
    </span>
  );
}
