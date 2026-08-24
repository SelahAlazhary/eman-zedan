"use client";

/**
 * تفعيل إشعارات الجهاز (Web Push) للطالب.
 * • إذن الإشعارات لا يُطلب إلا بضغطة من الطالب (شرط المتصفّحات).
 * • بعد الإذن نشترك عبر Service Worker ونرسل الاشتراك للخادم.
 * • على iOS لا تعمل الإشعارات إلا بعد تثبيت التطبيق على الشاشة الرئيسية — نوضّح ذلك.
 */
import { useCallback, useEffect, useState } from "react";
import { IconBell, IconCheckCircle, IconSpinner, IconInstall } from "@/components/brand/icons";
import { CornerKnot } from "@/components/brand/pattern";
import { isStandalone } from "./install-app";

/** base64url → ArrayBuffer (صيغة مفتاح VAPID التي يطلبها المتصفّح). */
function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

type State = "unsupported" | "ios-needs-install" | "idle" | "busy" | "on" | "blocked";

export function EnableNotifications({ className = "" }: { className?: string }) {
  const [state, setState] = useState<State>("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState(ios && !isStandalone() ? "ios-needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") { setState("blocked"); return; }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub && Notification.permission === "granted" ? "on" : "idle");
      } catch {
        setState("idle");
      }
    })();
  }, []);

  const enable = useCallback(async () => {
    setErr(null);
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "blocked" : "idle"); return; }

      const res = await fetch("/api/push/subscribe");
      const { configured, key } = await res.json();
      if (!configured || !key) { setErr("خدمة الإشعارات غير مضبوطة على الخادم"); setState("idle"); return; }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBuffer(key),
        }));

      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const saved = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!saved.ok) { setErr("تعذّر حفظ الاشتراك"); setState("idle"); return; }
      setState("on");
    } catch (e) {
      setErr((e as Error).message || "تعذّر تفعيل الإشعارات");
      setState("idle");
    }
  }, []);

  if (state === "unsupported" || state === "on") return null;

  return (
    <div className={`glass relative overflow-hidden rounded-3xl p-5 shadow-bento ${className}`}>
      <CornerKnot size={68} className="pointer-events-none absolute left-0 top-0 -scale-x-100 text-primary/40" />
      <div className="relative flex flex-wrap items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
          <IconBell anim="swing" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold">إشعارات على شاشة جهازك</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {state === "blocked"
              ? "الإشعارات محظورة لهذا الموقع — فعّلها من إعدادات المتصفّح ثم أعد المحاولة."
              : state === "ios-needs-install"
                ? "على الآيفون: ثبّت التطبيق على الشاشة الرئيسية أولاً، ثم فعّل الإشعارات من داخله."
                : "تصلك مواعيد البث والدروس الجديدة فور نشرها — حتى والتطبيق مغلق."}
          </p>
          {err && <p className="mt-1 text-xs font-bold text-rose-500">{err}</p>}
        </div>

        {state === "ios-needs-install" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground">
            <IconInstall className="size-4" /> ثبّت التطبيق أولاً
          </span>
        ) : (
          <button
            onClick={enable}
            disabled={state === "busy" || state === "blocked"}
            className="inline-flex items-center gap-2 rounded-full btn-glow px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {state === "busy" ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />}
            تفعيل الإشعارات
          </button>
        )}
      </div>
    </div>
  );
}
