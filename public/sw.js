/*
 * Service Worker — للتثبيت كتطبيق والعمل عند انقطاع الشبكة.
 *
 * قاعدة أمنية صارمة: لا يُخزَّن أي شيء يخصّ حساباً بعينه.
 * نُخزّن فقط أصول البناء الثابتة (/_next/static) وصفحة «بلا اتصال».
 * أي طلب /api/* أو صفحة HTML لا يُخزَّن إطلاقاً حتى لا تتسرّب بيانات
 * طالب إلى طالب آخر على جهاز مشترك.
 */
const VERSION = "emz-v1";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** أصول ثابتة يمكن تخزينها بأمان (لا تحمل بيانات مستخدم). */
function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === OFFLINE_URL ||
    /\.(css|js|woff2?|ttf|otf|svg|png|jpg|jpeg|webp|avif|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // بيانات المستخدم والملفات المحمية: من الشبكة دائماً، بلا تخزين
  if (url.pathname.startsWith("/api/")) return;

  // التنقّل بين الصفحات: الشبكة أولاً، وصفحة «بلا اتصال» عند الفشل
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error()))
    );
    return;
  }

  // الأصول الثابتة: من التخزين أولاً ثم الشبكة (stale-while-revalidate مبسّط)
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

/** تنظيف كل التخزين عند تسجيل الخروج (تُرسلها الواجهة). */
self.addEventListener("message", (event) => {
  if (event.data === "emz-clear-caches") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

/* ---------- إشعارات النظام (Web Push) ---------- */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "إشعار جديد", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "إشعار جديد";
  const options = {
    body: data.body || "",
    icon: "/api/pwa-icon?size=192",
    badge: "/api/pwa-icon?size=96&mono=1",
    dir: "rtl",
    lang: "ar",
    tag: data.tag || "emz-notification",
    renotify: true,
    data: { url: data.url || "/student/notifications" },
    vibrate: [80, 40, 80],
    actions: [{ action: "open", title: "فتح" }],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/** النقر على الإشعار: نُركّز نافذة مفتوحة إن وُجدت، وإلا نفتح جديدة. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/student/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
