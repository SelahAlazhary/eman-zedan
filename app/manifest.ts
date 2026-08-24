import type { MetadataRoute } from "next";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

/** ألوان البريسيتات كـ HEX (لأن ملف الـmanifest لا يقرأ متغيّرات CSS). */
const PRESET_HEX: Record<string, string> = {
  violet: "#7c3aed",
  emerald: "#12b981",
  ocean: "#2b8bf6",
  crimson: "#e11d48",
};

/**
 * ملف تعريف التطبيق (PWA) — يتبع هوية المنصّة المضبوطة من لوحة الأدمن:
 * الاسم والشعار واللون كلّها من قاعدة البيانات.
 */
export default function manifest(): MetadataRoute.Manifest {
  const { content } = getDB();
  const theme = content.theme;
  const primary =
    (theme.preset === "custom" && theme.customPrimary) || PRESET_HEX[theme.preset] || PRESET_HEX.emerald;
  const background = theme.layout === "dark" ? "#080b16" : "#fbf9f5";

  return {
    id: "/",
    name: `${content.brand} — ${content.platformSubtitle}`,
    short_name: content.brand,
    description: content.teacher.bio,
    lang: "ar",
    dir: "rtl",
    start_url: "/student",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: primary,
    background_color: background,
    categories: ["education"],
    icons: [
      { src: "/api/pwa-icon?size=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/pwa-icon?size=512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/pwa-icon?size=512&maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "كورساتي",
        short_name: "الكورسات",
        description: "افتح دروسك وتابع تقدّمك",
        url: "/student/subjects",
        icons: [{ src: "/api/shortcut-icon?name=courses&size=192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "البث المباشر",
        short_name: "البث",
        description: "ادخل الحصة المباشرة",
        url: "/student/live",
        icons: [{ src: "/api/shortcut-icon?name=live&size=192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "الاختبارات",
        short_name: "الاختبارات",
        description: "اختباراتك المتاحة",
        url: "/student/exams",
        icons: [{ src: "/api/shortcut-icon?name=exams&size=192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "الإشعارات",
        short_name: "الإشعارات",
        description: "آخر إعلانات المعلّمة",
        url: "/student/notifications",
        icons: [{ src: "/api/shortcut-icon?name=bell&size=192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
