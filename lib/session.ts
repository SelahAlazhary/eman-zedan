import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import type { Role } from "./types";

/**
 * جلسات موقّعة (HMAC) بدون تخزين على السيرفر — مناسبة للتشغيل المحلي.
 * السرّ من AUTH_SECRET أو قيمة تطوير احتياطية.
 */
const SECRET = process.env.AUTH_SECRET || "eman-zidan-dev-secret-change-me";
/**
 * علم Secure للكوكي: يُفعَّل يدوياً عند النشر على HTTPS (COOKIE_SECURE=1).
 * لا يُشتق من NODE_ENV لأن التشغيل الإنتاجي على http://localhost شائع،
 * وكوكي Secure على HTTP لا تُرسَل أبداً فيفقد الجميع جلساتهم.
 */
const SECURE = process.env.COOKIE_SECURE === "1";
const COOKIE = "emz_session";
const MAX_AGE = 60 * 60 * 24 * 365; // سنة — جلسة دائمة تُجدَّد تلقائياً مع كل زيارة

export type Session = { uid: string; role: Role; name: string };

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sign(payload: string) {
  return b64url(crypto.createHmac("sha256", SECRET).update(payload).digest());
}

export function createToken(s: Session): string {
  const payload = b64url(Buffer.from(JSON.stringify({ ...s, iat: Date.now() })));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): Session | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  // مقارنة زمن-ثابت
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    // انتهاء صلاحية حقيقي: رمز قديم لا يُقبل حتى لو بقيت الكوكي على الجهاز
    if (!data.iat || Date.now() - Number(data.iat) > MAX_AGE * 1000) return null;
    if (!data.uid || (data.role !== "admin" && data.role !== "student")) return null;
    return { uid: data.uid, role: data.role, name: data.name };
  } catch {
    return null;
  }
}

/** قراءة الجلسة الحالية (Server Components / Route Handlers). */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

/** تمديد صلاحية الكوكي عند كل استخدام (جلسة دائمة ما دام الطالب يفتح المنصّة). */
export async function touchSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  const session = verifyToken(raw);
  if (session && raw) {
    try {
      store.set(COOKIE, raw, { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE, secure: SECURE });
    } catch {
      /* لا يمكن الكتابة في بعض السياقات — القراءة تكفي */
    }
  }
  return session;
}

export async function setSessionCookie(s: Session) {
  const store = await cookies();
  store.set(COOKIE, createToken(s), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: SECURE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
