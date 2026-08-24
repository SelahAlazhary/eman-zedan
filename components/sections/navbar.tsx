"use client";

/**
 * Navbar — شريط عائم على شكل كبسولة زجاجية، يتقلّص عند التمرير،
 * مع حبّة ممغنطة تتبع الهوفر (layoutId) وزر CTA متدرّج ودرج موبايل.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { IconMenu, IconClose, IconSun, IconMoon } from "@/components/brand/icons";
import { BrandLockup } from "@/components/brand/logo";
import { navLinks } from "@/lib/data";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { el, isHidden, btnStyle } from "@/lib/ui-style";

export function Navbar() {
  const { content, viewLayout, toggleView } = useContent();
  // إخفاء روابط الأقسام المخفيّة من الشريط
  const visibleLinks = navLinks.filter((l) =>
    l.id === "hero" || !content.ui?.[`section.${l.id}`]?.hidden
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState("hero");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    navLinks.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
        className="fixed inset-x-0 top-4 z-[90] mx-auto flex justify-center px-4"
      >
        <nav
          onMouseLeave={() => setHovered(null)}
          className="glass flex w-full max-w-5xl items-center justify-between gap-2 rounded-full px-4 py-2.5 shadow-glow"
        >
          <a href="#hero" className="shrink-0 ps-1">
            <BrandLockup brand={content.brand} subtitle={content.platformSubtitle} logo={content.teacher.logo} size={36} />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {visibleLinks.map((l) => (
              <li key={l.id} className="relative">
                <a
                  href={`#${l.id}`}
                  onMouseEnter={() => setHovered(l.id)}
                  className={`relative z-10 block rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active === l.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </a>
                {hovered === l.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button onClick={toggleView} aria-label="تبديل المظهر"
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground">
              {viewLayout === "dark" ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
            </button>
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground sm:block">
              دخول
            </Link>
            {!isHidden(content, "nav.register") && (
              <Button as="a" href={content.cta?.registerUrl || "/register"} style={btnStyle(el(content, "nav.register"))} className="hidden px-5 py-2 sm:inline-flex">
                {content.cta?.registerLabel || "سجّل الآن"}
              </Button>
            )}
            <button onClick={() => setOpen(true)} aria-label="القائمة" className="grid size-9 place-items-center rounded-full border border-border lg:hidden">
              <IconMenu className="size-5" />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm lg:hidden" />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-[96] flex w-[82%] max-w-xs flex-col gap-2 bg-background p-6 shadow-2xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-lg font-extrabold">{content.brand}</span>
                <button onClick={() => setOpen(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full border border-border">
                  <IconClose className="size-5" />
                </button>
              </div>
              {navLinks.map((l, i) => (
                <motion.a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  {l.label}
                </motion.a>
              ))}
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-base font-semibold text-muted-foreground transition hover:bg-muted">
                تسجيل الدخول
              </Link>
              <Button as="a" href={content.cta?.registerUrl || "/register"} className="mt-4 w-full">{content.cta?.registerLabel || "سجّل الآن"}</Button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
