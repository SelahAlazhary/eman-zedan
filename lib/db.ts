import "server-only";
import crypto from "crypto";
import type { DB, PublicDB, PublicIntegrations, User, PublicUser, Role, Subject, Lesson, QuizResult, Live, Exam, ExamAttempt } from "./types";
import {
  defaultContent, defaultPlans, defaultStudents, defaultSubjects, defaultGrades,
  defaultCodes, defaultExams, defaultLive, defaultTickets, defaultNotifications, seedUsers,
} from "./defaults";
import { courseActive, lessonActive, planExpiry, planSubjectId, eligibleFor, liveVisible, publicLives } from "./access";
import { firebaseConfigured } from "./firebase";
import { ensureStore, peek, commit, flushStore, storeState, invalidate, readLocal } from "./store";

/**
 * مخزن محلي بسيط على هيئة ملف JSON.
 * الطبقة معزولة خلف دوال (getDB/saveDB/...) بحيث يسهل استبدالها لاحقاً بـ Supabase
 * دون المساس ببقية التطبيق.
 */

/* ---------- تجزئة كلمات المرور (scrypt) ---------- */
export function hashPassword(password: string, salt?: string) {
  const s = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, s, 64).toString("hex");
  return { salt: s, passwordHash: hash };
}
export function verifyPassword(password: string, user: User) {
  const { passwordHash } = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(passwordHash), Buffer.from(user.passwordHash));
}

function seed(): DB {
  const users: User[] = seedUsers.map((u, i) => {
    const { password, ...rest } = u;
    const { salt, passwordHash } = hashPassword(password);
    return {
      id: `USR-${1000 + i}`,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      ...rest,
    } as User;
  });
  return {
    content: defaultContent,
    plans: defaultPlans,
    students: defaultStudents,
    subjects: defaultSubjects,
    grades: defaultGrades,
    codes: defaultCodes,
    exams: defaultExams,
    live: defaultLive,
    tickets: defaultTickets,
    notifications: defaultNotifications,
    users,
  };
}

/** تحميل البيانات من مصدر الحقيقة (فايربيز إن ضُبط، وإلا الملف المحلي). */
export async function loadDB(): Promise<DB> {
  await ensureStore(seed);
  const db = getDB(); // getDB يطبّع الحقول الناقصة على النسخة المحمّلة
  void autoBackupTick();
  return db;
}

/** فحص خفيف: إن مرّ يوم على آخر نسخة احتياطية تُؤخذ واحدة في الخلفية. */
async function autoBackupTick() {
  try {
    const { maybeAutoBackup } = await import("./backup");
    await maybeAutoBackup();
  } catch {
    /* النسخ الاحتياطي لا يعطّل الطلبات */
  }
}

/** إجبار قراءة جديدة في الطلب التالي. */
export function refreshDB() {
  invalidate();
}

/** ضمان اكتمال الكتابة السحابية قبل الردّ على المستخدم. */
export async function flushDB() {
  return flushStore();
}

export function getDB(): DB {
  const db = peek(seed);
  // تعبئة أي مصفوفات مفقودة (لقواعد بيانات أُنشئت قبل إضافة الحقل)
  db.notifications = db.notifications ?? [];

  /**
   * مالكة المنصّة: إن لم يُعلَّم أحد بعد، فأقدم مشرف هو المالكة.
   * يضمن وجود حساب واحد لا تُسحب صلاحياته ولا يُحذف مهما جرى.
   */
  const admins = (db.users ?? []).filter((u) => u.role === "admin");
  if (admins.length && !admins.some((u) => u.owner)) {
    const first = [...admins].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
    first.owner = true;
  }
  db.plans = db.plans ?? [];
  db.security = db.security ?? { events: [], bans: [] };
  db.security.events = db.security.events ?? [];
  db.security.bans = db.security.bans ?? [];
  db.students = db.students ?? [];
  db.subjects = db.subjects ?? [];
  db.grades = db.grades ?? [];
  db.codes = db.codes ?? [];
  db.exams = (db.exams ?? []).map((e) => ({
    ...e,
    questions: Array.isArray(e.questions) ? e.questions : [],
  }));
  db.live = db.live ?? [];
  db.tickets = db.tickets ?? [];
  return db;
}


export function saveDB(db: DB) {
  // يحفظ محلياً فوراً ويُدرج الكتابة إلى فايربيز في طابور مرتّب
  commit(db);
}

/* ---------- المزامنة السحابية ---------- */

/** رفع النسخة الحالية إلى فايربيز والانتظار حتى تكتمل. */
export async function mirrorToFirebase(): Promise<{ ok: boolean; error: string | null }> {
  if (!firebaseConfigured()) return { ok: false, error: "فايربيز غير مضبوط" };
  commit(getDB());
  return flushStore();
}

/** استيراد النسخة السحابية واعتمادها. */
export async function hydrateFromFirebase(): Promise<{ ok: boolean; error?: string; users?: number }> {
  if (!firebaseConfigured()) return { ok: false, error: "فايربيز غير مضبوط" };
  invalidate();
  try {
    const db = await ensureStore(seed);
    return { ok: true, users: db.users.length };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function firebaseSyncState() {
  const st = storeState();
  return { lastMirrorAt: st.lastSyncAt, lastMirrorError: st.lastError, source: st.source, cachedAt: st.cachedAt };
}

/** نسخة الطوارئ المحلية (للاستعادة اليدوية). */
export function localBackup(): DB | null {
  return readLocal();
}

/** يدمج تعديلاً جزئياً على المستوى الأعلى (content/students/...) ويحفظ. */
export function patchDB(patch: Partial<DB>): DB {
  const db = getDB();
  const next = { ...db, ...patch } as DB;
  saveDB(next);
  return next;
}

function toPublicUser(u: User): PublicUser {
  const { passwordHash, salt, pushSubs, ...rest } = u;
  return { ...rest, pushDevices: pushSubs?.length ?? 0 };
}

/** حالة التكاملات بلا أي رموز سرّية. */
export function publicIntegrations(db: DB): PublicIntegrations {
  const g = db.integrations?.google;
  return {
    google: {
      configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      connected: Boolean(g?.connected && g?.refreshToken),
      email: g?.email,
      connectedAt: g?.connectedAt,
    },
    youtubeApiKey: Boolean(process.env.YOUTUBE_API_KEY || db.integrations?.youtubeApiKey),
  };
}

/** نسخة عامة بدون بيانات سرّية (كلمات مرور/رموز تكاملات) — تُرسل للواجهة. */
export function getPublicDB(): PublicDB {
  const db = getDB();
  return { ...db, users: db.users.map(toPublicUser), integrations: publicIntegrations(db) };
}

/* ---------- المستخدمون ---------- */
export function findUserByUsername(username: string): User | undefined {
  return getDB().users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function createUser(input: {
  name: string; username: string; password: string; role: Role;
  phone?: string; grade?: string; track?: string; gender?: "male" | "female"; school?: string; governorate?: string; active?: boolean;
}): PublicUser {
  const db = getDB();
  if (db.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
    throw new Error("اسم المستخدم مستخدم بالفعل");
  }
  const { salt, passwordHash } = hashPassword(input.password);
  const user: User = {
    id: `USR-${1000 + db.users.length}`,
    name: input.name,
    role: input.role,
    username: input.username,
    passwordHash,
    salt,
    active: input.active ?? (input.role === "admin"),
    phone: input.phone,
    grade: input.grade,
    track: input.track,
    gender: input.gender,
    school: input.school,
    governorate: input.governorate,
    progress: {},
    enrolled: [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDB(db);
  return toPublicUser(user);
}

export function setUserActive(id: string, active: boolean) {
  const db = getDB();
  const u = db.users.find((x) => x.id === id);
  if (u) { u.active = active; saveDB(db); }
  return u ? toPublicUser(u) : null;
}

/** تحديث نسبة تقدّم الطالب في كورس (لا يتجاوز 100). */
export function setUserProgress(userId: string, subjectId: string, value: number) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  u.progress = u.progress ?? {};
  u.progress[subjectId] = Math.max(0, Math.min(100, Math.round(value)));
  saveDB(db);
  return u.progress[subjectId];
}

export function deleteUser(id: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === id);
  if (!u || u.role === "admin") return false; // لا يُحذف الأدمن
  db.users = db.users.filter((x) => x.id !== id);
  saveDB(db);
  return true;
}

/* ---------- الخطط والاشتراكات ---------- */

/** تفعيل خطة بكود: يُنشئ اشتراكاً للطالب وحده بمدّة الخطة، ويُبطل الكود بعد استخدامه. */
export function redeemCode(userId: string, rawCode: string, subjectId?: string):
  | { ok: true; subjectId: string; plan: string; planName: string; expiresAt: string | null }
  | { ok: false; error: string } {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.role !== "student") return { ok: false, error: "المستخدم غير موجود" };
  if (!user.active) return { ok: false, error: "الحساب موقوف — تواصل مع الدعم" };

  const code = db.codes.find((c) => c.code.toUpperCase() === rawCode.trim().toUpperCase());
  if (!code) return { ok: false, error: "كود غير صحيح" };
  if (code.status !== "متاح") return { ok: false, error: "هذا الكود مستخدم أو منتهٍ" };

  // الخطة المصدر (أو خطة ضمنية للأكواد القديمة قبل نظام الخطط)
  const plan = db.plans.find((p) => p.id === code.planId) ?? {
    id: "legacy",
    name: code.subjectId === "*" ? "الترم الكامل" : code.subjectName,
    kind: (code.plan === "ترم" ? "term" : "month") as "term" | "month",
    scope: (code.subjectId === "*" ? "all" : "subject") as "all" | "subject",
    subjectId: code.subjectId === "*" ? undefined : code.subjectId,
    price: 0,
    visible: false,
    createdAt: code.createdAt,
  };

  const target = planSubjectId(plan);
  if (!target) return { ok: false, error: "الخطة غير مكتملة — تواصل مع الدعم" };

  const isTermScope = /^T[12]$/.test(target);
  if (target !== "*" && !isTermScope) {
    const subj = db.subjects.find((x) => x.id === target);
    if (!subj) return { ok: false, error: "الكورس غير موجود" };
    if (subjectId && target !== subjectId) return { ok: false, error: "هذا الكود مخصّص لكورس آخر" };
    if (!eligibleFor(subj, user)) return { ok: false, error: "هذا الكورس غير متاح لصفّك/شعبتك" };
  }

  const now = new Date();
  const expiresAt = planExpiry(plan, db.content.termEnd, now);
  if (plan.kind === "term" && expiresAt && new Date(expiresAt).getTime() <= now.getTime()) {
    return { ok: false, error: "انتهت مدّة هذه الخطة — تواصل مع الدعم" };
  }

  user.progress = user.progress ?? {};
  user.subscriptions = user.subscriptions ?? [];
  user.subscriptions.push({
    id: `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subjectId: target,
    scope: plan.scope,
    termNo: plan.termNo,
    plan: plan.kind === "term" ? "ترم" : "شهر",
    planId: plan.id,
    planName: plan.name,
    activatedAt: now.toISOString(),
    expiresAt,
  });
  if (target !== "*" && !isTermScope && !(target in user.progress)) user.progress[target] = 0;

  code.status = "مستخدم";
  code.student = user.name;
  code.studentId = user.id;
  code.usedAt = now.toISOString();

  // تحديث عدّاد طلاب الكورس
  if (target !== "*" && !isTermScope) {
    const subj = db.subjects.find((x) => x.id === target);
    if (subj) subj.students = (subj.students ?? 0) + 1;
  }

  saveDB(db);
  return { ok: true, subjectId: target, plan: plan.kind, planName: plan.name, expiresAt };
}

/* ---------- اختبارات الدروس ---------- */

/** تصحيح اختبار درس على السيرفر وحفظ النتيجة (الإجابات الصحيحة لا تغادر السيرفر). */
export function gradeQuiz(userId: string, subjectId: string, lessonId: string, answers: number[]):
  | { ok: true; result: QuizResult; correct: number[] }
  | { ok: false; error: string } {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "المستخدم غير موجود" };

  const subject = db.subjects.find((s) => s.id === subjectId);
  const lesson = subject?.videos?.find((v) => v.id === lessonId);
  if (!subject || !lesson) return { ok: false, error: "الدرس غير موجود" };
  if (!lesson.quiz?.enabled || !lesson.quiz.questions.length) return { ok: false, error: "لا يوجد اختبار على هذا الدرس" };
  if (!lesson.isFree && !courseActive(user, subjectId, Date.now(), subject.term)) {
    return { ok: false, error: "هذا الدرس غير مُفعّل" };
  }

  const questions = lesson.quiz.questions;
  const correct = questions.map((q) => q.correct);
  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  const result: QuizResult = {
    subjectId, lessonId, score, total, percent,
    passed: percent >= (lesson.quiz.passScore ?? 60),
    at: new Date().toISOString(),
  };

  user.quizResults = (user.quizResults ?? []).filter((r) => r.lessonId !== lessonId);
  user.quizResults.push(result);
  saveDB(db);
  return { ok: true, result, correct };
}

/** تعليم إشعارات كمقروءة لطالب. */
export function markNotificationsRead(userId: string, ids: string[]) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.readNotifications = Array.from(new Set([...(u.readNotifications ?? []), ...ids]));
  saveDB(db);
  return true;
}

/* ---------- الحمولة المرسلة للواجهة (مقيّدة حسب الدور) ---------- */

type Scope = { uid: string; role: Role } | null;

/** كورس بلا أي روابط (للزائر) — اسم وسعر وغلاف فقط. */
function stripSubject(s: Subject): Subject {
  return { ...s, videos: [], materials: [], lessons: s.videos?.length ?? s.lessons };
}

/** كورس للطالب: رابط الدرس يُرسل فقط إذا كان الدرس مفتوحاً له، وإجابات الاختبار تُحذف دائماً. */
function scopeSubjectForStudent(s: Subject, me: User | undefined): Subject {
  const owned = courseActive(me, s.id, Date.now(), s.term);
  const videos: Lesson[] = (s.videos ?? []).map((v) => {
    const open = Boolean(v.isFree) || owned;
    const quiz = v.quiz?.enabled
      ? {
          enabled: true,
          passScore: v.quiz.passScore,
          questions: open
            ? v.quiz.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, correct: -1 }))
            : [],
        }
      : undefined;
    return { ...v, url: open ? v.url : "", quiz };
  });
  return {
    ...s,
    videos,
    materials: owned ? s.materials ?? [] : [],
    lessons: s.videos?.length ?? s.lessons,
  };
}

/**
 * الحمولة العامة حسب الجلسة — لا يُرسل للمتصفّح إلا ما يخصّ صاحب الجلسة:
 * • زائر: المحتوى + الخطط الظاهرة + أسماء الكورسات فقط (بلا روابط أو دروس أو بيانات طلاب).
 * • طالب: حسابه هو فقط + كورسات صفّه/شعبته + روابط الدروس المفتوحة له + إشعاراته.
 * • أدمن: كل شيء.
 */
export function getScopedDB(session: Scope): PublicDB {
  const db = getDB();

  if (session?.role === "admin") return getPublicDB();

  if (session?.role === "student") {
    const me = db.users.find((u) => u.id === session.uid);
    const subjects = db.subjects
      .filter((s) => s.status === "منشورة" && eligibleFor(s, me))
      .map((s) => scopeSubjectForStudent(s, me));
    // البث: يظهر لصفّه/شعبته فقط، والرابط لا يُرسل إلا لمن يحقّ له فتحه
    const live: Live[] = db.live
      .filter((l) => eligibleFor({ grade: l.grade, track: l.track }, me))
      .map((l) => {
        const subj = l.subjectId ? db.subjects.find((x) => x.id === l.subjectId) : undefined;
        return liveVisible(me, { ...l, subjectTerm: subj?.term }) ? l : { ...l, url: "" };
      });
    // الاختبارات: اختبارات صفّه/شعبته فقط · بلا إجابات صحيحة · الأسئلة تُحجب عمّن لا يحقّ له
    const exams: Exam[] = db.exams
      .filter((e) => eligibleFor({ grade: e.grade, track: e.track }, me))
      .map((e) => {
        const open = me ? examAllowed(me, e) : false;
        return {
          ...e,
          questions: open
            ? e.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, correct: -1, points: q.points }))
            : [],
        };
      });
    const notifications = db.notifications.filter((n) =>
      (!n.userId || n.userId === me?.id) &&
      (!n.grade || !me?.grade || n.grade === me.grade) &&
      (!n.track || !me?.track || n.track === me.track)
    );
    return {
      ...db,
      subjects,
      live,
      exams,
      notifications,
      plans: db.plans,
      youtube: undefined, // قسم القناة إداري بحت
      codes: [],
      tickets: [],
      students: [],
      integrations: undefined, // التكاملات شأن إداري بحت
      security: undefined,     // سجلّ الأمان للأدمن فقط
      users: me ? [toPublicUser(me)] : [],
    };
  }

  // زائر
  const { videoUrl, ...cta } = db.content.cta ?? {};
  return {
    ...db,
    content: { ...db.content, cta: { ...cta, videoUrl: "" } },
    plans: db.plans.filter((p) => p.visible),
    youtube: undefined,
    // أسماء الصفوف فقط (تلزم قائمة التسجيل) — بلا أعداد الطلاب أو المواد
    grades: db.grades.map((g) => ({ ...g, students: 0, subjects: 0 })),
    subjects: db.subjects.filter((s) => s.status === "منشورة").map(stripSubject),
    codes: [],
    exams: [],
    // الزائر يرى البث المجاني وحده (برابطه) ولا شيء غيره
    live: publicLives(db.live),
    tickets: [],
    students: [],
    notifications: [],
    integrations: undefined,
    security: undefined,
    users: [],
  };
}

/* ---------- إشعارات الأجهزة (Web Push) ---------- */

/** حفظ/تحديث اشتراك جهاز للطالب (بلا تكرار لنفس endpoint). */
export function savePushSub(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string; ua?: string }
) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.pushSubs = (u.pushSubs ?? []).filter((s) => s.endpoint !== sub.endpoint);
  u.pushSubs.push({
    id: `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    ua: sub.ua,
    createdAt: new Date().toISOString(),
  });
  saveDB(db);
  return true;
}

/** إلغاء اشتراك جهاز. */
export function removePushSub(userId: string, endpoint: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.pushSubs = (u.pushSubs ?? []).filter((s) => s.endpoint !== endpoint);
  saveDB(db);
  return true;
}

/** حذف اشتراك تالف (رد 404/410 من خدمة الدفع). */
export function dropDeadSub(endpoint: string) {
  const db = getDB();
  let changed = false;
  db.users.forEach((u) => {
    const before = u.pushSubs?.length ?? 0;
    if (before) {
      u.pushSubs = u.pushSubs!.filter((s) => s.endpoint !== endpoint);
      if (u.pushSubs.length !== before) changed = true;
    }
  });
  if (changed) saveDB(db);
}

/** الطلاب المستهدفون بإشعار (نفس قاعدة العرض في البوابة). */
export function pushTargets(n: { userId?: string; grade?: string; track?: string }): User[] {
  return getDB().users.filter(
    (u) =>
      u.role === "student" &&
      u.active &&
      (u.pushSubs?.length ?? 0) > 0 &&
      (!n.userId || n.userId === u.id) &&
      (!n.grade || !u.grade || n.grade === u.grade) &&
      (!n.track || !u.track || n.track === u.track)
  );
}

/* ---------- الاختبارات ---------- */

/** هل يملك المستخدم صلاحية على كورس؟ يبحث عن الكورس ليمرّر فصله الدراسي. */
export function userOwnsSubject(user: User | undefined, subjectId: string): boolean {
  if (!user) return false;
  const subject = getDB().subjects.find((s) => s.id === subjectId);
  return courseActive(user, subjectId, Date.now(), subject?.term);
}

/** هل يحقّ للطالب دخول هذا الاختبار؟ (نفس منطق البث: الجمهور + الصف/الشعبة) */
export function examAllowed(user: User | undefined, exam: Exam): boolean {
  if (!user) return false;
  if (!eligibleFor({ grade: exam.grade, track: exam.track }, user)) return false;
  if (["all", "public"].includes(exam.audience ?? "subscribers")) return true;
  if (exam.subjectId) {
    const subj = getDB().subjects.find((s) => s.id === exam.subjectId);
    return courseActive(user, exam.subjectId, Date.now(), subj?.term);
  }
  return (user.subscriptions ?? []).some((sb) => !sb.expiresAt || new Date(sb.expiresAt).getTime() > Date.now());
}

/** تصحيح اختبار وحفظ المحاولة وتحديث إحصاءات الاختبار. */
export function gradeExam(userId: string, examId: string, answers: number[]):
  | { ok: true; attempt: ExamAttempt; correct: number[] }
  | { ok: false; error: string } {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  const exam = db.exams.find((e) => e.id === examId);
  if (!user) return { ok: false, error: "المستخدم غير موجود" };
  if (!exam) return { ok: false, error: "الاختبار غير موجود" };
  if (exam.status !== "منشور") return { ok: false, error: "الاختبار غير متاح الآن" };
  if (!exam.questions.length) return { ok: false, error: "لا توجد أسئلة في هذا الاختبار" };
  if (!examAllowed(user, exam)) return { ok: false, error: "هذا الاختبار غير متاح لك" };

  const previous = (user.examAttempts ?? []).filter((a) => a.examId === examId);
  const allowed = exam.attempts ?? 0;
  if (allowed > 0 && previous.length >= allowed) {
    return { ok: false, error: `انتهت محاولاتك المسموحة (${allowed})` };
  }

  const total = exam.questions.reduce((n, q) => n + (q.points ?? 1), 0);
  const score = exam.questions.reduce(
    (n, q, i) => n + (answers[i] === q.correct ? q.points ?? 1 : 0),
    0
  );
  const percent = total ? Math.round((score / total) * 100) : 0;
  const attempt: ExamAttempt = {
    examId,
    score,
    total,
    percent,
    passed: percent >= (exam.passScore ?? 60),
    at: new Date().toISOString(),
    answers,
  };

  user.examAttempts = [...(user.examAttempts ?? []), attempt];

  // إحصاءات الاختبار: أفضل محاولة لكل طالب
  const best = new Map<string, number>();
  db.users.forEach((u) => {
    (u.examAttempts ?? [])
      .filter((a) => a.examId === examId)
      .forEach((a) => best.set(u.id, Math.max(best.get(u.id) ?? 0, a.percent)));
  });
  exam.submissions = best.size;
  exam.avg = best.size ? Math.round([...best.values()].reduce((x, y) => x + y, 0) / best.size) : 0;

  saveDB(db);
  return { ok: true, attempt, correct: exam.questions.map((q) => q.correct) };
}

/* ---------- ربط الحساب بجهاز واحد ---------- */

/** ربط الجهاز بالحساب (يُستدعى عند أول دخول/تسجيل). */
export function bindDevice(userId: string, deviceId: string, label?: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.deviceId = deviceId;
  u.deviceLabel = label;
  u.deviceBoundAt = new Date().toISOString();
  saveDB(db);
  return true;
}

/** فكّ الارتباط ليتمكّن الطالب من الدخول من جهاز جديد — للأدمن. */
export function resetDevice(userId: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  u.deviceId = undefined;
  u.deviceLabel = undefined;
  u.deviceBoundAt = undefined;
  u.deviceResetAt = new Date().toISOString();
  saveDB(db);
  return toPublicUser(u);
}
