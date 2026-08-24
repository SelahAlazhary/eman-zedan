import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Alexandria, Readex_Pro } from "next/font/google";
import { ContentProvider } from "@/components/content/content-provider";
import { RouteTransition } from "@/components/ui/route-transition";
import { RegisterSW } from "@/components/pwa/register-sw";
import { getPublicDB, getScopedDB, loadDB } from "@/lib/db";
import { touchSession } from "@/lib/session";
import { defaultContent } from "@/lib/defaults";
import { buildJsonLd } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

const readex = Readex_Pro({ subsets: ["arabic", "latin"], variable: "--font-sans", display: "swap" });
const alexandria = Alexandria({ subsets: ["arabic", "latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });

/** إعدادات العرض — viewport-fit=cover ضروري لاحترام حوّاف الشاشة في التطبيق المثبّت. */
export function generateViewport(): Viewport {
  const { content } = getPublicDB();
  const preset: Record<string, string> = {
    violet: "#7c3aed", emerald: "#12b981", ocean: "#2b8bf6", crimson: "#e11d48",
  };
  const primary =
    (content.theme.preset === "custom" && content.theme.customPrimary) ||
    preset[content.theme.preset] ||
    preset.emerald;
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: primary,
  };
}

/** ميتاداتا ديناميكية من قاعدة البيانات (العنوان/الوصف/الأيقونة/OG). */
export function generateMetadata(): Metadata {
  const { content: c } = getPublicDB();
  // أيقونة الموقع (favicon) = شعار الأستاذة أو صورتها
  const icon = c.teacher?.logo || c.teacher?.avatar || "/teacher.png";
  return {
    metadataBase: new URL(c.url),
    title: { default: `${c.brand} | ${c.platformSubtitle}`, template: `%s | ${c.brand}` },
    description: c.teacher.bio,
    openGraph: {
      type: "website", locale: "ar_EG", url: c.url, siteName: c.brand,
      title: `${c.teacher.subject} مع ${c.teacher.name}`,
      description: c.teacher.tagline,
      images: [{ url: icon, width: 1200, height: 630, alt: c.brand }],
    },
    twitter: { card: "summary_large_image", title: c.brand, description: c.teacher.tagline, images: [icon] },
    robots: { index: true, follow: true },
    manifest: "/manifest.webmanifest",
    applicationName: c.brand,
    appleWebApp: {
      capable: true,
      title: c.brand,
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon,
      apple: [{ url: "/api/pwa-icon?size=180", sizes: "180x180", type: "image/png" }],
    },
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  await loadDB(); // مصدر الحقيقة (فايربيز إن ضُبط)
  const session = await touchSession(); // يمدّد الجلسة الدائمة
  // الحمولة الأولى (SSR) مقيّدة بدور صاحب الجلسة — لا تسرّب بيانات لغير أصحابها
  const db = getScopedDB(session);
  const theme = db.content?.theme ?? defaultContent.theme;
  const jsonLd = buildJsonLd(db.content ?? defaultContent);

  return (
    <html
      lang="ar"
      dir="rtl"
      data-layout={theme.layout}
      data-preset={theme.preset}
      suppressHydrationWarning
    >
      <head>
        {jsonLd.map((block, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
        ))}
      </head>
      <body className={`${readex.variable} ${alexandria.variable} font-sans`}>
        <ContentProvider initialDB={db} initialSession={session}>
          <RouteTransition>{children}</RouteTransition>
          <RegisterSW />
        </ContentProvider>
      </body>
    </html>
  );
}
