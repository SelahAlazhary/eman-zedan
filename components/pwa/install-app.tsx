"use client";

/**
 * تثبيت المنصّة كتطبيق (PWA).
 * • أندرويد/ويندوز: نلتقط beforeinstallprompt ونعرض زر تثبيت حقيقي.
 * • iOS (سفاري لا يدعم الحدث): نعرض خطوات «مشاركة ← إضافة إلى الشاشة الرئيسية».
 * • إذا كان التطبيق مثبّتاً بالفعل (display-mode: standalone) لا يظهر شيء.
 */
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconInstall, IconShare, IconPlus, IconClose, IconCheckCircle } from "@/components/brand/icons";
import { CornerKnot } from "@/components/brand/pattern";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "emz_install_dismissed";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // سفاري iOS
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallApp({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true); // نبدأ مخفيّين حتى تُقرأ الحالة
  const [ios, setIos] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === "1"); } catch { setDismissed(false); }

    const ua = window.navigator.userAgent;
    setIos(/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setInstalled(true);
  }, [deferred]);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* تجاهل */ }
  };

  // لا نعرض شيئاً: مثبّت بالفعل، أو مُستبعَد، أو متصفّح لا يدعم التثبيت
  if (installed || dismissed || (!deferred && !ios)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass relative overflow-hidden rounded-3xl p-5 shadow-bento ${className}`}
    >
      <CornerKnot size={72} className="pointer-events-none absolute left-0 top-0 -scale-x-100 text-primary/40" />
      <div className="relative flex flex-wrap items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
          <IconInstall anim="bob" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold">ثبّت المنصّة كتطبيق</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            افتح دروسك من أيقونة على شاشة جهازك مباشرة — بشاشة كاملة وبلا شريط متصفّح.
          </p>
        </div>

        {ios ? (
          <button
            onClick={() => setShowIosSteps((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full btn-glow px-5 py-2.5 text-sm font-bold text-white"
          >
            <IconShare className="size-4" /> طريقة التثبيت
          </button>
        ) : (
          <button
            onClick={install}
            className="inline-flex items-center gap-2 rounded-full btn-glow px-5 py-2.5 text-sm font-bold text-white"
          >
            <IconInstall className="size-4" /> تثبيت التطبيق
          </button>
        )}

        <button onClick={dismiss} aria-label="إخفاء" className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground">
          <IconClose className="size-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showIosSteps && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-4 space-y-2 overflow-hidden border-t border-border pt-4 text-sm text-muted-foreground"
          >
            <li className="flex items-center gap-2">
              <IconShare className="size-4 shrink-0 text-primary" /> اضغط زر «مشاركة» في شريط سفاري.
            </li>
            <li className="flex items-center gap-2">
              <IconPlus className="size-4 shrink-0 text-primary" /> اختر «إضافة إلى الشاشة الرئيسية».
            </li>
            <li className="flex items-center gap-2">
              <IconCheckCircle className="size-4 shrink-0 text-primary" /> اضغط «إضافة» — ستجد أيقونة المنصّة على شاشتك.
            </li>
          </motion.ol>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
