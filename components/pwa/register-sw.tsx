"use client";

/**
 * تسجيل Service Worker — يُفعّل التثبيت كتطبيق وصفحة «بلا اتصال».
 * لا يُخزَّن أي محتوى خاص بالحساب (انظر التعليق في public/sw.js).
 */
import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* التثبيت ميزة إضافية — فشل التسجيل لا يعطّل المنصّة */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
