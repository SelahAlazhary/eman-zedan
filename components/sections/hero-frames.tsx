"use client";

/**
 * HeroFrame — ٨ إطارات للصورة، كلّها SVG متّجه بالكامل (لا حدود CSS ولا هالات blur).
 * البنية الموحّدة لكل إطار:
 *   defs: clipPath للشكل + قناع تلاشٍ سفلي  →  <image> مقصوصة  →  حدود وزخارف فوقها.
 * القياس 400×500 ثابت لكل الإطارات حتى لا يتغيّر تخطيط الهيرو عند تبديل الإطار.
 * الحركة خفيفة وتُلغى تلقائياً مع prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useUid } from "@/components/brand/use-uid";
import { archPath } from "@/components/brand/pattern";
import { mediaSrc } from "@/lib/media";
import type { ImageFit } from "@/lib/types";

export const FRAME_COUNT = 8;
export const FRAME_NAMES: Record<number, string> = {
  1: "قوس المحراب",
  2: "مدالية دائرية",
  3: "خاتم ثماني",
  4: "مثمّن مضلّع",
  5: "قوس مفصّص",
  6: "طاق معقود",
  7: "حلقات مدارية",
  8: "طاق مزدوج",
};

const W = 400;
const H = 500;

/* ---------- مسارات الأشكال (نقاط محسوبة لا تقديرية) ---------- */

/** مثمّن منتظم داخل صندوق. */
function octagonPath(w: number, h: number, inset = 0): string {
  const k = 0.2929; // 1 - cos45 = نسبة قطع الركن للمثمّن المنتظم
  const cx = w * k;
  const cy = h * k;
  const x0 = inset;
  const x1 = w - inset;
  const y0 = inset;
  const y1 = h - inset;
  return [
    `M${x0 + cx} ${y0}`,
    `H${x1 - cx}`,
    `L${x1} ${y0 + cy}`,
    `V${y1 - cy}`,
    `L${x1 - cx} ${y1}`,
    `H${x0 + cx}`,
    `L${x0} ${y1 - cy}`,
    `V${y0 + cy}`,
    "Z",
  ].join(" ");
}

/** قوس مفصّص: نصف علوي بفصوص متتابعة. */
function foilArchPath(w: number, h: number, lobes = 5, inset = 0): string {
  const x0 = inset;
  const x1 = w - inset;
  const shoulder = h * 0.46;
  const span = (x1 - x0) / lobes;
  const r = span / 2;
  let d = `M${x0} ${h - inset} V${shoulder}`;
  for (let i = 0; i < lobes; i++) {
    const from = x0 + i * span;
    const rise = i === Math.floor(lobes / 2) ? 1.35 : 1;
    d += ` A${r} ${r * rise} 0 0 1 ${from + span} ${shoulder}`;
  }
  d += ` V${h - inset} Z`;
  return d;
}

/** نقاط موزّعة على محيط دائرة (للعلامات والعقد). */
function ring(cx: number, cy: number, r: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

/* ---------- الغلاف المشترك ---------- */

function FrameShell({
  children,
  float = true,
}: {
  children: React.ReactNode;
  float?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full overflow-visible"
      role="presentation"
      animate={!reduce && float ? { y: [0, -9, 0] } : undefined}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.svg>
  );
}

/** الصورة مقصوصة على شكل، مع تدرّج تلاشٍ سفلي وحدّ داخلي.
 *  img: ضبط الأدمن للصورة داخل الإطار (ملء/إزاحة/تكبير). */
function Portrait({
  uid,
  shape,
  avatar,
  alt,
  img,
}: {
  uid: string;
  shape: string;
  avatar: string;
  alt: string;
  img?: ImageFit;
}) {
  const scale = Math.min(3, Math.max(0.5, img?.scale ?? 1));
  const dx = ((img?.x ?? 0) / 100) * W;
  const dy = ((img?.y ?? 0) / 100) * H;
  // التكبير من مركز اللوحة ثم الإزاحة — يعطي تحكّماً سلساً بلا تشويه
  const transform = `translate(${W / 2 + dx} ${H / 2 + dy}) scale(${scale}) translate(${-W / 2} ${-H / 2})`;
  // الافتراضي «كاملة» — لا يُقصّ أي جزء من الصورة، والمحاذاة تُضبط يدوياً من اللوحة
  const par = (img?.fit ?? "contain") === "cover" ? "xMidYMid slice" : "xMidYMid meet";
  return (
    <>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <path d={shape} />
        </clipPath>
        <linearGradient id={`${uid}-veil`} x1="0" y1={H * 0.55} x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        <rect width={W} height={H} fill="hsl(var(--muted))" />
        {avatar ? (
          <g transform={transform}>
            <image
              href={mediaSrc(avatar)}
              x="0"
              y="0"
              width={W}
              height={H}
              preserveAspectRatio={par}
            >
              <title>{alt}</title>
            </image>
          </g>
        ) : null}
        <rect width={W} height={H} fill={`url(#${uid}-veil)`} />
      </g>
    </>
  );
}

/* ---------- الإطارات ---------- */

export function HeroFrame({ frame, avatar, alt, img }: { frame: number; avatar: string; alt: string; img?: ImageFit }) {
  const f = Math.min(Math.max(frame || 1, 1), FRAME_COUNT);
  const uid = useUid(`hf${f}`);
  const reduce = useReducedMotion();
  const stroke = "hsl(var(--primary))";

  /* 1) قوس المحراب — قوس مدبّب بحدّ مزدوج وقاعدة */
  if (f === 1) {
    const outer = archPath(W, H, 6);
    const inner = archPath(W - 34, H - 34, 6);
    return (
      <FrameShell>
        <Portrait uid={uid} shape={outer} avatar={avatar} alt={alt} img={img} />
        <path d={outer} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={0.55} />
        <g transform="translate(17 17)">
          <path d={inner} fill="none" stroke="#fff" strokeWidth={1.25} strokeOpacity={0.35} />
        </g>
        <path d={`M40 ${H - 6} H${W - 40}`} stroke={stroke} strokeWidth={3} strokeOpacity={0.5} strokeLinecap="round" />
        <path d={`M64 ${H - 18} H${W - 64}`} stroke={stroke} strokeWidth={1.25} strokeOpacity={0.3} strokeLinecap="round" />
      </FrameShell>
    );
  }

  /* 2) مدالية دائرية — حلقة بعلامات ثمانية */
  if (f === 2) {
    const cx = W / 2;
    const cy = H / 2;
    const r = 178;
    return (
      <FrameShell>
        <Portrait uid={uid} shape={`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`} avatar={avatar} alt={alt} img={img} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={0.5} />
        <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.28} />
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          {ring(cx, cy, r + 14, 8).map((p, i) => (
            <path
              key={i}
              d={`M${p.x - 5} ${p.y} L${p.x} ${p.y - 5} L${p.x + 5} ${p.y} L${p.x} ${p.y + 5} Z`}
              fill={stroke}
              fillOpacity={0.5}
            />
          ))}
          <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={stroke} strokeWidth={1} strokeOpacity={0.2} strokeDasharray="2 10" />
        </motion.g>
      </FrameShell>
    );
  }

  /* 3) خاتم ثماني — مثمّن مقصوص مع مربّع ومعيّن متشابكين */
  if (f === 3) {
    const box = 356;
    const x = (W - box) / 2;
    const y = (H - box) / 2;
    const shape = `M${x + box * 0.2929} ${y} H${x + box * 0.7071} L${x + box} ${y + box * 0.2929} V${y + box * 0.7071} L${x + box * 0.7071} ${y + box} H${x + box * 0.2929} L${x} ${y + box * 0.7071} V${y + box * 0.2929} Z`;
    const c = { x: x + box / 2, y: y + box / 2 };
    const h = box / 2;
    return (
      <FrameShell>
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={0.5} />
        <g fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.25}>
          <rect x={c.x - h * 0.72} y={c.y - h * 0.72} width={h * 1.44} height={h * 1.44} />
          <path d={`M${c.x} ${c.y - h} L${c.x + h} ${c.y} L${c.x} ${c.y + h} L${c.x - h} ${c.y} Z`} />
        </g>
      </FrameShell>
    );
  }

  /* 4) مثمّن مضلّع — حدّ سميك وعقد عند الأركان */
  if (f === 4) {
    const shape = octagonPath(W, H, 8);
    return (
      <FrameShell>
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={stroke} strokeWidth={2.5} strokeOpacity={0.55} />
        <path d={octagonPath(W - 30, H - 30, 8)} transform="translate(15 15)" fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.3} />
        {[
          [W * 0.2929, 8],
          [W - W * 0.2929, 8],
          [W * 0.2929, H - 8],
          [W - W * 0.2929, H - 8],
        ].map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={4} fill={stroke} fillOpacity={0.6} />
        ))}
      </FrameShell>
    );
  }

  /* 5) قوس مفصّص — فصوص متتابعة أعلى الإطار */
  if (f === 5) {
    const shape = foilArchPath(W, H, 5, 8);
    return (
      <FrameShell>
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={0.55} />
        <path d={foilArchPath(W - 32, H - 30, 5, 8)} transform="translate(16 14)" fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.28} />
        <path d={`M28 ${H - 8} H${W - 28}`} stroke={stroke} strokeWidth={3} strokeOpacity={0.45} strokeLinecap="round" />
      </FrameShell>
    );
  }

  /* 6) طاق معقود — مستطيل بزوايا دائرية وعقد زاويّة */
  if (f === 6) {
    const r = 46;
    const shape = `M${8 + r} 8 H${W - 8 - r} A${r} ${r} 0 0 1 ${W - 8} ${8 + r} V${H - 8 - r} A${r} ${r} 0 0 1 ${W - 8 - r} ${H - 8} H${8 + r} A${r} ${r} 0 0 1 8 ${H - 8 - r} V${8 + r} A${r} ${r} 0 0 1 ${8 + r} 8 Z`;
    return (
      <FrameShell>
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={0.5} />
        <g fill="none" stroke={stroke} strokeWidth={1.25} strokeOpacity={0.45}>
          <path d="M8 74 Q8 8 74 8" transform="translate(6 6)" />
          <path d={`M${W - 8} 74 Q${W - 8} 8 ${W - 74} 8`} transform="translate(-6 6)" />
          <path d={`M8 ${H - 74} Q8 ${H - 8} 74 ${H - 8}`} transform="translate(6 -6)" />
          <path d={`M${W - 8} ${H - 74} Q${W - 8} ${H - 8} ${W - 74} ${H - 8}`} transform="translate(-6 -6)" />
        </g>
      </FrameShell>
    );
  }

  /* 7) حلقات مدارية — قرص مع مدارين ونقاط */
  if (f === 7) {
    const cx = W / 2;
    const cy = H / 2;
    const r = 168;
    return (
      <FrameShell>
        <Portrait uid={uid} shape={`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`} avatar={avatar} alt={alt} img={img} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={0.5} />
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          <ellipse cx={cx} cy={cy} rx={r + 26} ry={r - 34} fill="none" stroke={stroke} strokeWidth={1.25} strokeOpacity={0.35} />
          <circle cx={cx + r + 26} cy={cy} r={5} fill={stroke} fillOpacity={0.75} />
        </motion.g>
        <motion.g
          animate={reduce ? undefined : { rotate: -360 }}
          transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          <ellipse cx={cx} cy={cy} rx={r - 30} ry={r + 22} fill="none" stroke={stroke} strokeWidth={1} strokeOpacity={0.25} />
          <circle cx={cx} cy={cy - r - 22} r={4} fill={stroke} fillOpacity={0.6} />
        </motion.g>
      </FrameShell>
    );
  }

  /* 8) طاق مزدوج — قوس داخل إطار مستطيل بحدّ مشرشر */
  const arch = archPath(W - 48, H - 48, 0);
  return (
    <FrameShell>
      <g transform="translate(24 24)">
        <Portrait uid={uid} shape={arch} avatar={avatar} alt={alt} img={img} />
        <path d={arch} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={0.55} />
      </g>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="18" fill="none" stroke={stroke} strokeWidth={1.5} strokeOpacity={0.4} />
      <rect
        x="14"
        y="14"
        width={W - 28}
        height={H - 28}
        rx="14"
        fill="none"
        stroke={stroke}
        strokeWidth={1}
        strokeOpacity={0.3}
        strokeDasharray="6 8"
      />
    </FrameShell>
  );
}
