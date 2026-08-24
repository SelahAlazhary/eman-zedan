"use client";

/**
 * ContentProvider — نقطة الوصول الموحّدة لبيانات الموقع الحيّة.
 * • يجلب /api/content ويوفّر المحتوى والكيانات لكل المكوّنات.
 * • save(patch): يحفظ تعديلات الأدمن على السيرفر (PUT) مع تحديث فوري.
 * • uploadImage(file): يرفع صورة ويعيد مسارها.
 * • يطبّق الثيم (تخطيط/بريسيت/لون مخصّص) من المحتوى على <html>.
 * • يوفّر الجلسة الحالية + تسجيل الخروج.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import type { PublicDB, SiteContent, Theme, Layout, Preset } from "@/lib/types";
import { defaultContent } from "@/lib/defaults";

type Session = { uid: string; role: "admin" | "student"; name: string } | null;

type Ctx = {
  db: PublicDB | null;
  content: SiteContent;
  loading: boolean;
  session: Session;
  refresh: () => Promise<void>;
  save: (patch: Partial<PublicDB>) => Promise<boolean>;
  saveContent: (patch: Partial<SiteContent>) => Promise<boolean>;
  uploadImage: (file: File) => Promise<string | null>;
  logout: () => Promise<void>;
  wa: (text?: string) => string;
  // اختصارات الثيم (عامة — تُحفظ على السيرفر، للأدمن)
  layout: Layout;
  preset: Preset;
  customPrimary: string | null;
  setLayout: (l: Layout) => void;
  toggleLayout: () => void;
  setPreset: (p: Preset) => void;
  setCustomPrimary: (hex: string) => void;
  // تفضيل العرض المحلي لكل زائر (لايت/دارك) — لا يُحفظ على السيرفر
  viewLayout: Layout;
  toggleView: () => void;
};

const ContentContext = createContext<Ctx | null>(null);

/* ---- HEX → HSL لتطبيق اللون المخصّص ---- */
function hexToHsl(hex: string): [number, number, number] {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.slice(0, 2), 16) / 255, g = parseInt(c.slice(2, 4), 16) / 255, b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    switch (max) { case r: h = ((g - b) / d) % 6; break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4; }
    h = h * 60; if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function applyTheme(theme: Theme, effectiveLayout: Layout) {
  const root = document.documentElement;
  root.setAttribute("data-layout", effectiveLayout);
  root.setAttribute("data-preset", theme.preset);
  if (theme.preset === "custom" && theme.customPrimary) {
    const [h, s, l] = hexToHsl(theme.customPrimary);
    root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
    root.style.setProperty("--accent", `${(h + 26) % 360} ${Math.min(s + 4, 96)}% ${Math.min(l + 4, 66)}%`);
    root.style.setProperty("--glow", `${(h + 8) % 360} ${Math.min(s + 12, 98)}% ${Math.min(l + 8, 70)}%`);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--glow");
  }
}

export function ContentProvider({
  initialDB,
  initialSession = null,
  children,
}: {
  initialDB?: PublicDB | null;
  initialSession?: Session;
  children: ReactNode;
}) {
  const [db, setDb] = useState<PublicDB | null>(initialDB ?? null);
  const [session, setSession] = useState<Session>(initialSession);
  const [loading, setLoading] = useState(!initialDB);
  const [layoutOverride, setLayoutOverride] = useState<Layout | null>(null);

  const content = db?.content ?? defaultContent;
  const viewLayout: Layout = layoutOverride ?? content.theme.layout;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/content", { cache: "no-store" });
    if (res.ok) setDb(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      if (!initialDB) await refresh();
      setLoading(false);
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        if (me.ok) setSession((await me.json()).session);
      } catch { /* تجاهل */ }
    })();
    // استرجاع تفضيل العرض المحلي (لايت/دارك) للزائر
    try {
      const v = localStorage.getItem("emz_view_layout");
      if (v === "light" || v === "dark") setLayoutOverride(v);
    } catch { /* تجاهل */ }
  }, [initialDB, refresh]);

  // تطبيق الثيم (التخطيط الفعّال = تفضيل الزائر إن وُجد وإلا الإعداد العام)
  useEffect(() => { applyTheme(content.theme, viewLayout); }, [content.theme, viewLayout]);

  const toggleView = useCallback(() => {
    setLayoutOverride((prev) => {
      const current = prev ?? content.theme.layout;
      const next: Layout = current === "dark" ? "light" : "dark";
      try { localStorage.setItem("emz_view_layout", next); } catch { /* تجاهل */ }
      return next;
    });
  }, [content.theme.layout]);

  const save = useCallback(async (patch: Partial<PublicDB>) => {
    setDb((prev) => (prev ? ({ ...prev, ...patch } as PublicDB) : prev)); // تحديث متفائل
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { await refresh(); return false; }
    return true;
  }, [refresh]);

  const saveContent = useCallback(
    (patch: Partial<SiteContent>) => save({ content: { ...content, ...patch } }),
    [content, save]
  );

  const uploadImage = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    return (await res.json()).url as string;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
  }, []);

  const setTheme = useCallback((t: Partial<Theme>) => {
    const next = { ...content.theme, ...t };
    if (t.layout) { // تغيير عام للتخطيط يلغي تفضيل الزائر المحلي
      setLayoutOverride(null);
      try { localStorage.removeItem("emz_view_layout"); } catch { /* تجاهل */ }
    }
    applyTheme(next, t.layout ?? viewLayout); // فوري
    void saveContent({ theme: next });
  }, [content.theme, viewLayout, saveContent]);

  const value = useMemo<Ctx>(() => ({
    db, content, loading, session, refresh, save, saveContent, uploadImage, logout,
    wa: (text = "السلام عليكم، أود الاستفسار عن الكورسات") =>
      `https://wa.me/${content.whatsapp}?text=${encodeURIComponent(text)}`,
    layout: content.theme.layout,
    preset: content.theme.preset,
    customPrimary: content.theme.customPrimary,
    setLayout: (l) => setTheme({ layout: l }),
    toggleLayout: () => setTheme({ layout: content.theme.layout === "dark" ? "light" : "dark" }),
    setPreset: (p) => setTheme({ preset: p }),
    setCustomPrimary: (hex) => setTheme({ preset: "custom", customPrimary: hex }),
    viewLayout,
    toggleView,
  }), [db, content, loading, session, refresh, save, saveContent, uploadImage, logout, setTheme, viewLayout, toggleView]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within <ContentProvider>");
  return ctx;
}
