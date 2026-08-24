"use client";

import { useId } from "react";

/**
 * معرّف فريد وآمن للاستخدام داخل SVG (defs / clipPath / mask / gradient).
 * useId يُنتج رموزاً مثل «:r3:» وهي غير صالحة في url(#…) داخل CSS، لذا نُنظّفها.
 * ضروري لأن نفس المكوّن قد يُرسم أكثر من مرة في الصفحة الواحدة.
 */
export function useUid(prefix: string): string {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  return `${prefix}-${raw}`;
}
