import "server-only";
import crypto from "crypto";

/**
 * تخزين البيانات في Firebase Realtime Database عبر REST من الخادم.
 *
 * لماذا من الخادم؟ كل منطق المنصّة (الجلسات، الصلاحيات، الأكواد، تصحيح الاختبارات)
 * يُنفَّذ على الخادم؛ فلو تحدّث المتصفّح مع فايربيز مباشرة لسقطت هذه الحماية.
 * لذلك الخادم وحده يقرأ ويكتب، وقواعد فايربيز تبقى مغلقة تماماً أمام العملاء.
 *
 * المصادقة: حساب خدمة (Service Account) يُوقّع JWT ويستبدله برمز وصول،
 * أو سرّ قاعدة البيانات القديم (auth=) لمن لا يملك حساب خدمة.
 * كلاهما يُقرأ من متغيّرات البيئة فقط ولا يصل المتصفّح إطلاقاً.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/firebase.database",
].join(" ");

export type FirebaseConfig = {
  databaseURL: string;
  clientEmail?: string;
  privateKey?: string;
  secret?: string;
};

function readConfig(): FirebaseConfig | null {
  const databaseURL = process.env.FIREBASE_DATABASE_URL?.trim();
  if (!databaseURL) return null;
  return {
    databaseURL: databaseURL.replace(/\/$/, ""),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    // المفتاح في .env يُكتب بسطر واحد مع \n
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim(),
    secret: process.env.FIREBASE_DATABASE_SECRET?.trim(),
  };
}

/** مضبوط = يوجد عنوان قاعدة (ويمكن العمل باعتماد أو بقواعد مفتوحة). */
export function firebaseConfigured(): boolean {
  return Boolean(readConfig()?.databaseURL);
}

/** هل يوجد اعتماد خادم (حساب خدمة أو سرّ)؟ */
export function firebaseHasCredential(): boolean {
  const c = readConfig();
  return Boolean(c && (c.secret || (c.clientEmail && c.privateKey)));
}

/**
 * صالح للاستخدام: باعتماد (الوضع الآمن)،
 * أو بلا اعتماد إذا كانت القواعد مفتوحة (يعمل لكنه غير آمن — يُنبَّه عليه في اللوحة).
 */
export function firebaseSecure(): boolean {
  return firebaseConfigured();
}

/** فحص إن كانت القاعدة مفتوحة للعالم (قراءة بلا مصادقة). */
export async function firebaseRulesOpen(): Promise<boolean> {
  const c = readConfig();
  if (!c) return false;
  try {
    const res = await fetch(`${c.databaseURL}/.json?shallow=true`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** وصف حالة الربط للوحة (بلا أي أسرار). */
export function firebaseStatus(): {
  configured: boolean;
  databaseURL?: string;
  mode?: "service-account" | "secret" | "open";
  hasCredential: boolean;
} {
  const c = readConfig();
  if (!c) return { configured: false, hasCredential: false };
  const mode = c.clientEmail && c.privateKey ? "service-account" : c.secret ? "secret" : "open";
  return { configured: true, databaseURL: c.databaseURL, mode, hasCredential: firebaseHasCredential() };
}

/* ---------- رمز الوصول (حساب الخدمة) ---------- */

let cachedToken: { value: string; exp: number } | null = null;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

async function accessToken(c: FirebaseConfig): Promise<string | null> {
  if (!c.clientEmail || !c.privateKey) return null;
  if (cachedToken && cachedToken.exp - 60_000 > Date.now()) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: c.clientEmail,
      scope: SCOPES,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(c.privateKey)
    .toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }).toString(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "تعذّر الحصول على رمز فايربيز");
  }
  cachedToken = { value: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

/** عنوان المسار مع بيانات الاعتماد. */
async function url(path: string, query = ""): Promise<string> {
  const c = readConfig();
  if (!c) throw new Error("فايربيز غير مضبوط");
  const base = `${c.databaseURL}/${path.replace(/^\//, "")}.json`;
  const token = await accessToken(c);
  const auth = token
    ? `access_token=${token}`
    : c.secret
      ? `auth=${encodeURIComponent(c.secret)}`
      : ""; // قواعد مفتوحة — بلا مصادقة
  const qs = [auth, query].filter(Boolean).join("&");
  return qs ? `${base}?${qs}` : base;
}

/* ---------- ترميز المفاتيح ---------- */
/**
 * Realtime Database تمنع في أسماء المفاتيح: . $ # [ ] / ورموز التحكّم.
 * وبياناتنا فيها مفاتيح مثل «hero.statusPill»، لذا نُرمّزها عند الكتابة
 * ونفكّها عند القراءة — فتُحفظ البيانات كما هي بلا فقدان.
 */
const BAD_KEY = /[.$#[\]/]/g;
const ESCAPES: Record<string, string> = { ".": "~d~", "$": "~s~", "#": "~h~", "[": "~l~", "]": "~r~", "/": "~f~" };
const UNESCAPES: Record<string, string> = Object.fromEntries(Object.entries(ESCAPES).map(([k, v]) => [v, k]));

function encodeKey(k: string): string {
  return k.replace(BAD_KEY, (c) => ESCAPES[c] ?? c);
}
function decodeKey(k: string): string {
  return k.replace(/~[dshlrf]~/g, (m) => UNESCAPES[m] ?? m);
}

/** ترميز عميق للمفاتيح + إسقاط undefined (فايربيز ترفضها). */
export function encodeForFirebase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encodeForFirebase);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[encodeKey(k)] = encodeForFirebase(v);
    }
    return out;
  }
  return value;
}

/** فكّ الترميز عند القراءة. */
export function decodeFromFirebase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeFromFirebase);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[decodeKey(k)] = decodeFromFirebase(v);
    }
    return out;
  }
  return value;
}

/* ---------- عمليات القراءة والكتابة ---------- */

export async function fbGet<T>(path: string): Promise<T | null> {
  const res = await fetch(await url(path), { cache: "no-store" });
  if (!res.ok) throw new Error(`فايربيز: فشل القراءة (${res.status})`);
  const data = await res.json();
  return (data === null ? null : (decodeFromFirebase(data) as T));
}

export async function fbSet(path: string, value: unknown): Promise<void> {
  const res = await fetch(await url(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encodeForFirebase(value) ?? null),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`فايربيز: فشل الكتابة (${res.status})${detail ? ` — ${detail.slice(0, 160)}` : ""}`);
  }
}

export async function fbUpdate(path: string, value: Record<string, unknown>): Promise<void> {
  const res = await fetch(await url(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encodeForFirebase(value)),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`فايربيز: فشل التحديث (${res.status})`);
}

/** فحص سريع للاتصال (يُستخدم في لوحة الأدمن). */
export async function fbPing(): Promise<{ ok: boolean; error?: string }> {
  try {
    await fbGet("__health");
    await fbSet("__health", { at: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
