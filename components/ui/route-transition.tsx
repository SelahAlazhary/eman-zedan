"use client";

/**
 * RouteTransition — انتقالات صفحات ناعمة:
 * • شريط تقدّم علوي متدرّج عند تغيير المسار.
 * • دخول لطيف للمحتوى الجديد (بدون AnimatePresence/exit حتى لا تظهر شاشة بيضاء عند التنقّل).
 * يحترم prefers-reduced-motion.
 */

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [barKey, setBarKey] = useState(0);

  useEffect(() => { setBarKey((k) => k + 1); }, [pathname]);

  return (
    <>
      {/* شريط التقدّم العلوي */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]">
        <motion.div
          key={barKey}
          initial={{ width: "0%", opacity: 1 }}
          animate={{ width: "100%", opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--glow)))",
            boxShadow: "0 0 12px hsl(var(--glow) / 0.7)",
          }}
        />
      </div>

      {/* دخول المحتوى الجديد — أنيميشن تنقّل ناعم بدون exit لتفادي أي فراغ */}
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.985, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
