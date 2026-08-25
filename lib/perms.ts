import type { User } from "./types";

/**
 * صلاحيات لوحة الإدارة.
 *
 * • المالكة (owner) تملك كل شيء دائماً ولا يمكن سحب صلاحياتها ولا حذفها.
 * • أي مشرف آخر يرى ويعدّل الأقسام المسموح له بها فقط.
 * • الفحص يتمّ على الخادم في كل مسار — إخفاء الرابط وحده ليس حماية.
 */

export type AdminPerm =
  | "customize"
  | "students"
  | "subjects"
  | "plans"
  | "codes"
  | "exams"
  | "live"
  | "youtube"
  | "notifications"
  | "analytics"
  | "security"
  | "backup"
  | "testimonials"
  | "support"
  | "team";

/** الصلاحيات بأسمائها العربية ووصف موجز — تُعرض في شاشة المشرفين. */
export const PERMS: { key: AdminPerm; label: string; hint: string }[] = [
  { key: "customize", label: "تخصيص الموقع", hint: "الهوية، الألوان، نصوص الصفحة الرئيسية" },
  { key: "students", label: "الطلاب", hint: "الحسابات، الاشتراكات، السماح بجهاز جديد" },
  { key: "subjects", label: "المواد والصفوف", hint: "إضافة المواد والدروس والفيديوهات" },
  { key: "plans", label: "الخطط", hint: "خطط الاشتراك والأسعار والخصومات" },
  { key: "codes", label: "أكواد التفعيل", hint: "توليد الأكواد ومتابعة استخدامها" },
  { key: "exams", label: "الاختبارات", hint: "بناء الاختبارات ومراجعة النتائج" },
  { key: "live", label: "البث المباشر", hint: "إنشاء الجلسات وتحديد من يشاهدها" },
  { key: "youtube", label: "قناة اليوتيوب", hint: "إدارة فيديوهات القناة" },
  { key: "notifications", label: "الإشعارات", hint: "إرسال الإشعارات للطلاب" },
  { key: "analytics", label: "التحليلات", hint: "أرقام المنصّة وتقاريرها" },
  { key: "security", label: "الأمان", hint: "سجلّ المحاولات المشبوهة والحظر" },
  { key: "backup", label: "النسخ الاحتياطي", hint: "النسخ والاستعادة" },
  { key: "testimonials", label: "شهادات الطلاب", hint: "آراء الطلاب والمتفوّقين في الصفحة الرئيسية" },
  { key: "support", label: "الدعم", hint: "روابط التواصل مع الطلاب" },
  { key: "team", label: "المشرفون", hint: "إضافة مشرفين وتحديد صلاحياتهم — للمالكة فقط" },
];

export const ALL_PERMS: AdminPerm[] = PERMS.map((p) => p.key);

/** الصلاحيات المقترحة لمشرف جديد (كل شيء عدا الأقسام الحسّاسة). */
export const DEFAULT_PERMS: AdminPerm[] = ["students", "subjects", "exams", "live", "notifications"];

/** هل هذا الحساب هو مالك المنصّة؟ */
export function isOwner(user?: Pick<User, "role" | "owner"> | null): boolean {
  return Boolean(user && user.role === "admin" && user.owner);
}

/** هل يملك هذا المشرف الصلاحية المطلوبة؟ */
export function can(user: Pick<User, "role" | "owner" | "adminPerms"> | null | undefined, perm: AdminPerm): boolean {
  if (!user || user.role !== "admin") return false;
  if (user.owner) return true; // المالكة تملك كل شيء
  if (perm === "team") return false; // إدارة المشرفين للمالكة وحدها
  return (user.adminPerms ?? []).includes(perm);
}

/** كل صلاحيات هذا المشرف (للعرض والتصفية). */
export function permsOf(user: Pick<User, "role" | "owner" | "adminPerms"> | null | undefined): AdminPerm[] {
  if (!user || user.role !== "admin") return [];
  return user.owner ? ALL_PERMS : (user.adminPerms ?? []).filter((p) => p !== "team");
}

/**
 * الصلاحية المطلوبة لمسار في اللوحة.
 * الصفحة الرئيسية (/admin) مفتوحة لأي مشرف.
 */
export function permForPath(href: string): AdminPerm | null {
  const map: Record<string, AdminPerm> = {
    "/admin/customize": "customize",
    "/admin/students": "students",
    "/admin/grades": "subjects",
    "/admin/subjects": "subjects",
    "/admin/plans": "plans",
    "/admin/codes": "codes",
    "/admin/exams": "exams",
    "/admin/live": "live",
    "/admin/youtube": "youtube",
    "/admin/notifications": "notifications",
    "/admin/analytics": "analytics",
    "/admin/security": "security",
    "/admin/backup": "backup",
    "/admin/testimonials": "testimonials",
    "/admin/support": "support",
    "/admin/team": "team",
  };
  const hit = Object.keys(map)
    .filter((k) => href === k || href.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? map[hit] : null;
}

/**
 * الصلاحية المطلوبة لتعديل مفتاح في قاعدة البيانات عبر PUT /api/content.
 * ما لا يُذكر هنا يتطلّب صلاحية «تخصيص الموقع».
 */
export function permForDbKey(key: string): AdminPerm {
  const map: Record<string, AdminPerm> = {
    content: "customize",
    subjects: "subjects",
    grades: "subjects",
    students: "students",
    plans: "plans",
    codes: "codes",
    exams: "exams",
    live: "live",
    notifications: "notifications",
    tickets: "support",
    youtube: "youtube",
  };
  return map[key] ?? "customize";
}
