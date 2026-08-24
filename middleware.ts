import { NextResponse, type NextRequest } from "next/server";

/**
 * الطبقة الأمامية للحماية (تعمل قبل أي صفحة أو مسار):
 * • ترويسات أمان صارمة على كل استجابة.
 * • صدّ الفحص الآلي لمسارات الاختراق المعروفة (.env، wp-admin، .git…).
 * • رفض الطلبات المعدِّلة القادمة من أصل خارجي (CSRF).
 *
 * الفحوص التي تحتاج قاعدة البيانات (الحظر، السجلّ) تتم داخل المسارات نفسها.
 */

/** مسارات يفحصها الروبوتات بحثاً عن ثغرات — تُردّ ٤٠٤ فوراً. */
const PROBES = [
  "/.env", "/.git", "/wp-admin", "/wp-login", "/xmlrpc.php", "/phpmyadmin",
  "/.aws", "/config.json", "/vendor/", "/.ssh", "/backup.sql", "/admin.php",
  "/.well-known/security.txt.bak", "/server-status",
];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/**
 * سياسة المحتوى: تسمح فقط بما تحتاجه المنصّة فعلاً
 * (خطوط جوجل، صور جوجل/يوتيوب، إطارات المشغّلات، اتصال فايربيز/جوجل).
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.googleusercontent.com https://*.ytimg.com https://drive.google.com",
  "media-src 'self' blob: https://drive.google.com",
  "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://oauth2.googleapis.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://player.vimeo.com https://iframe.mediadelivery.net https://meet.google.com https://calendar.google.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // فحص آلي معروف → يُسجَّل ثم يُردّ ٤٠٤ بلا أي تفاصيل
  const lower = pathname.toLowerCase();
  if (PROBES.some((p) => lower.startsWith(p) || lower.includes(p))) {
    return report(req, "probe", pathname);
  }

  // الطلبات المعدِّلة يجب أن تأتي من نفس الموقع
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.get("host")) {
          return report(req, "csrf", pathname);
        }
      } catch {
        return report(req, "csrf", pathname);
      }
    }
  }

  // تمرير المسار للطبقة الخادمية (تستخدمه لوحة الإدارة لفحص الصلاحيات)
  const forwarded = new Headers(req.headers);
  forwarded.set("x-pathname", pathname);
  const res = NextResponse.next({ request: { headers: forwarded } });
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  res.headers.set("Content-Security-Policy", CSP);
  return res;
}

/** تحويل الطلب المصدود إلى مسار التسجيل (Node) ليُدوَّن في سجلّ الأمان. */
function report(req: NextRequest, kind: "csrf" | "probe", path: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/api/security/report";
  url.search = "";
  const headers = new Headers(req.headers);
  headers.set("x-blocked-kind", kind);
  headers.set("x-blocked-path", path);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
