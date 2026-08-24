import type { SitePlan } from "./types";

/**
 * سعر الخطة بعد الخصم — مصدر واحد للحساب يستخدمه الموقع والبوابة واللوحة.
 * الخصم يسري فقط إذا كان مفعّلاً ولم تنتهِ مدّته.
 */
export type PricedPlan = {
  price: number;      // السعر المعروض (بعد الخصم)
  original: number;   // السعر قبل الخصم
  off: number;        // قيمة التوفير
  percent: number;    // نسبة التوفير ٪
  active: boolean;    // هل الخصم ساري؟
  label?: string;
  until?: string | null;
};

export function planPrice(plan: SitePlan, now = Date.now()): PricedPlan {
  const original = Math.max(0, plan.price ?? 0);
  const d = plan.discount;
  const notExpired = !d?.until || new Date(d.until).getTime() > now;
  const active = Boolean(d?.active && d.value > 0 && notExpired);

  if (!active || !d) {
    return { price: original, original, off: 0, percent: 0, active: false };
  }

  const off = d.type === "percent"
    ? Math.round((original * Math.min(100, d.value)) / 100)
    : Math.min(original, Math.round(d.value));
  const price = Math.max(0, original - off);

  return {
    price,
    original,
    off,
    percent: original ? Math.round((off / original) * 100) : 0,
    active: off > 0,
    label: d.label,
    until: d.until ?? null,
  };
}

/** لون الخطة (أو لون الثيم الافتراضي). */
export function planColor(plan: SitePlan): string | undefined {
  return plan.color && /^#?[0-9a-fA-F]{3,8}$/.test(plan.color) ? plan.color : undefined;
}
