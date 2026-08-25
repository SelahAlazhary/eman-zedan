/** أنواع البيانات المشتركة بين الموقع ولوحات التحكّم وطبقة التخزين. */

export type Layout = "dark" | "light";
export type Preset = "violet" | "emerald" | "ocean" | "crimson" | "custom";

/** شكل حواف الإطار. */
export type FrameShape = "arch" | "rounded" | "square";

/**
 * ضبط صورة داخل إطارها — **بلا قصّ إطلاقاً**.
 * frame: "fixed" إطار ثابت والصورة كاملة بداخله · "image" الإطار يتبع نسبة الصورة فتملأه تماماً.
 */
export type ImageFit = {
  fit?: "cover" | "contain"; // (توافق قديم) — لم تعد تُستخدم للقصّ
  frame?: "fixed" | "image";
  shape?: FrameShape;
  radius?: number;  // نصف قطر الحواف (0..40)
  x?: number;       // إزاحة أفقية ٪ (‑40..40)
  y?: number;       // إزاحة رأسية ٪
  scale?: number;   // تكبير (0.6..2.5)
};

export type Theme = {
  layout: Layout;
  preset: Preset;
  customPrimary: string | null;
};

/* ---------- خطط الاشتراك (تُضاف وتُدار من لوحة الأدمن) ---------- */
/** نوع الخطة — يحدّد طريقة حساب مدّة الاشتراك:
 *  term   : ترم كامل — ينتهي في تاريخ محدّد (endsAt أو تاريخ نهاية الترم العام).
 *  month  : شهري — ينتهي بعد durationDays (٣٠ يوماً افتراضياً).
 *  custom : مخصّص — ينتهي بعد durationDays، أو دائم إذا كانت null.
 */
export type PlanKind = "term" | "month" | "custom";
/** رقم الفصل الدراسي. */
export type TermNo = 1 | 2;

/** نطاق الخطة: كل المواد · كل مواد فصل دراسي · كورس محدّد. */
export type PlanScope = "all" | "term" | "subject";

/** خصم على خطة: نسبة أو مبلغ ثابت، مع مدّة اختيارية. */
export type PlanDiscount = {
  active: boolean;
  type: "percent" | "amount";
  value: number;
  label?: string;              // نص الشارة (مثال: «عرض بداية الترم»)
  until?: string | null;       // ينتهي الخصم عنده (اختياري)
};

export type SitePlan = {
  id: string;
  name: string;                 // اسم الخطة (حرّ — يكتبه الأدمن)
  kind: PlanKind;               // نوع الخطة
  scope: PlanScope;             // كل المواد / فصل دراسي / كورس محدّد
  subjectId?: string;           // عند scope = "subject"
  termNo?: TermNo;              // عند scope = "term" — أي فصل دراسي
  price: number;                // السعر (ج.م)
  durationDays?: number | null; // مدة الاشتراك بالأيام (month/custom)
  endsAt?: string | null;       // تاريخ انتهاء ثابت (term) — يغلب على المدة
  badge?: string;               // شارة صغيرة (مثال: «الأوفر»)
  highlight?: boolean;          // إبراز الخطة في الصفحة الرئيسية
  color?: string;               // لون الخطة (HEX) — يلوّن بطاقتها وزخرفتها
  discount?: PlanDiscount;      // خصم على الخطة
  desc?: string;                // وصف مختصر
  cta?: string;                 // نص زر الخطة
  perks?: string[];             // مزايا الخطة (نقاط)
  visible: boolean;             // إظهارها على الصفحة الرئيسية
  order?: number;               // ترتيب العرض
  createdAt: string;
};

/** لون عنصر: افتراضي (من الثيم) / لون واحد / متدرّج. */
export type ColorSpec = { mode: "theme" | "solid" | "gradient"; color?: string; from?: string; to?: string };
/** نمط عنصر واجهة: إخفاء + لون خلفية/زر + لون نص. */
export type ElementStyle = { hidden?: boolean; fill?: ColorSpec; text?: ColorSpec };

/** رابط دعم مخصّص يظهر للطالب في صفحة المساعدة. */
export type SupportLinkKind = "whatsapp" | "phone" | "email" | "telegram" | "facebook" | "youtube" | "link";
export type SupportLink = {
  id: string;
  kind: SupportLinkKind;
  label: string;      // العنوان الظاهر
  desc?: string;      // سطر صغير تحته
  value: string;      // الرقم/البريد/الرابط
  visible: boolean;
  order?: number;
};

export type Feature = { icon: string; tag: string; title: string; desc: string; span: string };
export type GradeInfo = { title: string; note: string };
export type CurriculumUnit = {
  unit: string;
  title: string;
  lessons: number;
  videos: number;
  hours: number;
  freeTrial: boolean;
  items: string[];
};
export type HonorStudent = { name: string; grade: string; score: string; quote: string };
export type Faq = { q: string; a: string };

/** المحتوى القابل للتعديل من لوحة الأدمن (هوية + نصوص + ألوان). */
/** شهادة طالب تُعرض في الصفحة الرئيسية (رأي أو تميّز). */
export type Testimonial = {
  id: string;
  name: string;           // اسم الطالب
  text: string;           // نصّ الشهادة
  badge?: string;         // وسام: «الأول على الدفعة»، «٩٨٪» …
  grade?: string;         // الصف أو المدرسة
  photo?: string;         // صورة الطالب (رابط أو درايف)
  rating?: number;        // ١..٥ — اختياري
  featured?: boolean;     // يُبرز في المقدّمة (الطالب الأول)
  hidden?: boolean;       // مخفيّة مؤقّتاً
};

export type SiteContent = {
  brand: string;
  platformSubtitle: string;
  teacher: {
    name: string;
    subject: string;
    headline: string;
    tagline: string;
    bio: string;
    experienceYears: number;
    avatar: string;
    logo: string;
    rating: number;
    ratingCount: number;
    topStudents: number;
  };
  hero: {
    statusPill: string;
    frame?: number;      // 1..8 — تصميم إطار الصورة
    /** ضبط الصورة داخل الإطار: الملء، الإزاحة الأفقية/الرأسية (٪)، والتكبير. */
    image?: ImageFit;
  };
  termEnd?: string;   // تاريخ نهاية الترم (ينتهي عنده اشتراك الترم الكامل)
  termPrice?: number; // سعر اشتراك الترم الكامل (كل المواد)
  /** مكان استضافة الملفات المرفوعة: خادم المنصّة أم Google Drive الحساب المربوط. */
  mediaHost?: "local" | "drive";
  /** نصوص قسم «الخطط» في الصفحة الرئيسية. */
  plansSection?: { eyebrow?: string; title?: string; desc?: string; note?: string };
  cta?: {
    registerLabel?: string;   // نص زر التسجيل في الناف-بار/الفوتر
    registerUrl?: string;     // وجهة زر التسجيل (افتراضي /register)
    heroPrimaryLabel?: string;// نص زر الهيرو الأساسي
    secondaryLabel?: string;  // نص زر الفيديو الثانوي
    videoUrl?: string;        // رابط الدرس المجاني (اختياري)
  };
  /** تحكّم بالعناصر: إظهار/إخفاء وألوان الأزرار والنصوص. المفتاح = اسم العنصر. */
  ui?: Record<string, ElementStyle>;
  whatsapp: string;
  social: { facebook: string; youtube: string; telegram: string };
  /** روابط الدعم: الثلاثة الأساسية + روابط مخصّصة تُدار من لوحة الدعم. */
  support?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    note?: string;            // سطر توضيحي أسفل روابط الدعم
    links?: SupportLink[];    // روابط إضافية (تليجرام، مجموعة، رابط خارجي…)
  };
  url: string;
  theme: Theme;
  grades: GradeInfo[];
  features: Feature[];
  curriculum: CurriculumUnit[];
  honorStudents: HonorStudent[];
  faqs: Faq[];
  testimonials?: Testimonial[]; // شهادات الطلاب في الصفحة الرئيسية
};

/* ---------- كيانات لوحة الأدمن ---------- */
export type Student = {
  id: string;
  name: string;
  grade: string;
  phone: string;
  status: "نشط" | "موقوف" | "بانتظار التفعيل";
  device: string;
  joined: string;
};
/* ---------- الاختبار التفاعلي على الدرس (اختياري) ---------- */
export type QuizQuestion = {
  id: string;
  text: string;       // نص السؤال
  options: string[];  // الاختيارات (٢ فأكثر)
  correct: number;    // رقم الاختيار الصحيح — لا يُرسل للطالب أبداً
};
export type Quiz = {
  enabled: boolean;     // تشغيل/إيقاف الاختبار على هذا الدرس (اختياري للأدمن)
  passScore?: number;   // نسبة النجاح ٪ (افتراضي ٦٠)
  questions: QuizQuestion[];
};
/** نتيجة محاولة طالب على اختبار درس. */
export type QuizResult = {
  subjectId: string;
  lessonId: string;
  score: number;   // عدد الإجابات الصحيحة
  total: number;   // عدد الأسئلة
  percent: number; // النسبة ٪
  passed: boolean;
  at: string;
};

export type Lesson = {
  id: string;
  title: string;
  url: string;        // رابط الفيديو (YouTube/Vimeo/Bunny/mp4)
  duration?: string;
  isFree?: boolean;   // درس تجريبي مجاني
  quiz?: Quiz;        // اختبار تفاعلي على الفيديو (اختياري)
};
export type Material = {
  id: string;
  title: string;
  url: string;        // رابط الملف (PDF/مستند) — يُرفع أو رابط خارجي
};
export type Subject = {
  id: string;
  name: string;
  teacher: string;
  grade: string;      // الصف الدراسي (أو "كل الصفوف")
  track: string;      // الشعبة: "علمي" | "أدبي" | "الكل"
  term?: TermNo;      // الفصل الدراسي (١ أو ٢) — يُقسَّم به عرض الكورسات
  lessons: number;    // للعرض (يُحدَّث تلقائياً من عدد الدروس)
  students: number;
  price: number;      // سعر الاشتراك الشهري لهذا الكورس (ج.م)
  cover?: string;     // صورة غلاف الكورس (اختياري)
  coverFit?: ImageFit;// ضبط الغلاف داخل بطاقة الكورس (محاذاة/تكبير/حواف)
  coverRatio?: number;// نسبة أبعاد الغلاف الأصلية (عرض ÷ ارتفاع) — تُقاس تلقائياً
  videos: Lesson[];   // دروس الكورس
  materials?: Material[]; // مواد وملفات الكورس (PDF…)
  status: "منشورة" | "مسودّة";
};
export type GradeRow = { id: string; name: string; students: number; subjects: number; color: string };
export type SubPlan = "ترم" | "شهر";
export type Code = {
  code: string;
  subjectId: string;    // نطاق الكود: كورس محدّد أو "*" (كل المواد)
  subjectName: string;
  plan?: SubPlan;       // (توافق قديم) نوع الاشتراك
  planId?: string;      // الخطة التي وُلِّد منها الكود — مصدر المدّة والسعر
  planName?: string;    // اسم الخطة وقت التوليد (للعرض)
  status: "متاح" | "مستخدم" | "منتهي";
  student?: string;
  studentId?: string;   // معرّف الطالب الذي فعّل الكود
  usedAt?: string;      // تاريخ التفعيل
  createdAt: string;
};
/* ---------- الاختبارات (تُبنى داخل اللوحة) ---------- */
export type ExamQuestion = {
  id: string;
  text: string;
  options: string[];
  correct: number;   // لا يُرسل للطالب أبداً
  points?: number;   // درجة السؤال (١ افتراضياً)
};

/** محاولة طالب على اختبار. */
export type ExamAttempt = {
  examId: string;
  score: number;     // الدرجة المحصّلة
  total: number;     // الدرجة الكلية
  percent: number;
  passed: boolean;
  at: string;
  answers: number[];
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;       // لربط الاختبار بكورس (وللصلاحية)
  grade: string;
  track?: string;
  questions: ExamQuestion[];// أسئلة الاختبار داخل المنصّة
  duration: number;         // بالدقائق (٠ = بلا وقت)
  passScore?: number;       // نسبة النجاح ٪ (٦٠ افتراضياً)
  attempts?: number;        // عدد المحاولات المسموحة (٠/فارغ = غير محدود)
  audience?: LiveAudience;  // المشتركون فقط / كل الطلاب
  submissions: number;
  avg: number;
  url?: string;             // (توافق) رابط خارجي اختياري بدل الأسئلة
  createdAt?: string;
  status: "منشور" | "مجدول";
};
/** من يُسمح له بفتح رابط البث. */
export type LiveAudience =
  | "subscribers"  // المشتركون فقط (اشتراك ساري)
  | "all"          // كل الطلاب المسجّلين (حتى غير المشتركين)
  | "public";      // بث مجاني للجميع — حتى الزوّار بلا حساب (يظهر على الصفحة الرئيسية)

export type Live = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  track?: string;         // الشعبة (اختياري)
  time: string;           // نص الموعد للعرض
  startsAt?: string;      // بداية الجلسة (ISO) — يُستخدم مع Google Calendar
  endsAt?: string;        // نهايتها (ISO)
  viewers: number;
  url?: string;           // رابط Meet/البث — لا يُرسل لمن لا يملك صلاحية
  audience?: LiveAudience; // الافتراضي: المشتركون فقط
  subjectId?: string;     // اشتراك أي كورس يفتح البث (فارغ = أي اشتراك ساري)
  meetEventId?: string;   // معرّف الحدث في Google Calendar (للحذف/التتبّع)
  createdBy?: "google" | "manual";
  /** نوع الجلسة: بث للمشاهدة فقط أم اجتماع تفاعلي. */
  kind?: "broadcast" | "meeting";
  endedAt?: string;       // وقت إنهاء البث
  status: "مباشر" | "مجدول" | "منتهي";
};
export type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  grade?: string;   // موجّه لصف معيّن (اختياري)
  track?: string;   // موجّه لشعبة معيّنة (اختياري)
  userId?: string;  // موجّه لطالب واحد بعينه (اختياري)
  link?: string;    // رابط اختياري داخل المنصة
};
export type Ticket = {
  id: string;
  student: string;
  subject: string;
  priority: "عالية" | "متوسطة" | "منخفضة";
  status: "مفتوحة" | "قيد المعالجة" | "مغلقة";
  time: string;
};

/* ---------- المستخدمون (الحسابات) ---------- */
export type Role = "admin" | "student";
import type { AdminPerm } from "./perms";

export type User = {
  id: string;
  name: string;
  role: Role;
  username: string; // بريد أو رقم موبايل
  passwordHash: string;
  salt: string;
  active: boolean;
  phone?: string;
  grade?: string;
  track?: string;        // الشعبة: علمي/أدبي
  gender?: "male" | "female"; // النوع — لصيغة المخاطبة في النصوص
  school?: string;       // اسم المدرسة
  governorate?: string;  // المحافظة (لتجميع بيانات الأماكن فقط)
  progress?: Record<string, number>; // subjectId -> %
  enrolled?: string[];               // (توافق قديم)
  subscriptions?: Subscription[];    // مصدر الوصول الفعلي
  quizResults?: QuizResult[];        // نتائج اختبارات الدروس
  examAttempts?: ExamAttempt[];      // محاولات الاختبارات
  pushSubs?: PushSub[];              // أجهزة مشتركة في إشعارات النظام (لا تُرسل للواجهة)
  deviceId?: string;                 // الجهاز المرتبط بالحساب (طالب واحد = جهاز واحد)
  deviceLabel?: string;              // وصف الجهاز للعرض في اللوحة
  deviceBoundAt?: string;            // تاريخ الارتباط
  deviceResetAt?: string;            // آخر سماح من الأدمن بجهاز جديد
  readNotifications?: string[];      // معرّفات الإشعارات المقروءة
  owner?: boolean;                   // مالكة المنصّة — كل الصلاحيات ولا تُحذف
  adminPerms?: AdminPerm[];          // صلاحيات المشرف (تُتجاهل للمالكة)
  createdAt: string;
};

/** اشتراك إشعارات الجهاز (Web Push) — سرّ لا يُرسل لأي واجهة. */
export type PushSub = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  ua?: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  /** مفتاح النطاق: "*" كل المواد · "T1"/"T2" فصل دراسي كامل · معرّف كورس. */
  subjectId: string;
  scope?: PlanScope;         // نطاق الاشتراك (للعرض والتوضيح)
  termNo?: TermNo;           // الفصل الدراسي عند نطاق الفصل
  plan: SubPlan;             // ترم/شهر (للعرض والتوافق)
  planId?: string;           // الخطة المصدر
  planName?: string;         // اسم الخطة وقت التفعيل
  activatedAt: string;
  expiresAt?: string | null; // null = بلا انتهاء
};
/** مستخدم بدون بيانات سرّية (للعرض في الواجهة). */
export type PublicUser = Omit<User, "passwordHash" | "salt" | "pushSubs"> & {
  /** عدد الأجهزة المشتركة في الإشعارات فقط — بلا أي بيانات اشتراك. */
  pushDevices?: number;
};

/* ---------- التكاملات الخارجية (أسرار — لا تغادر السيرفر) ---------- */
export type GoogleIntegration = {
  connected: boolean;
  email?: string;         // حساب جوجل المربوط
  accessToken?: string;   // سرّ
  refreshToken?: string;  // سرّ
  expiryDate?: number;    // ms منذ epoch
  scope?: string;
  connectedAt?: string;
  driveFolderId?: string; // مجلّد الوسائط في Drive
};
/** سجلّ نسخة احتياطية واحدة. */
export type BackupEntry = {
  at: string;
  reason: "manual" | "auto";
  size: number;              // حجم النسخة بالبايت
  driveFileId?: string;
  driveName?: string;
  firebase?: boolean;
  error?: string;
};

export type Integrations = {
  google?: GoogleIntegration;
  driveBackupFolderId?: string;
  lastBackupAt?: string;
  backups?: BackupEntry[];
  /** مفتاح YouTube Data API — سرّ يُحفظ على الخادم ولا يُرسل للواجهة إطلاقاً. */
  youtubeApiKey?: string;
};
/** ما يُسمح بإرساله للواجهة عن التكاملات (بلا أي رموز). */
export type PublicIntegrations = {
  google?: { connected: boolean; email?: string; connectedAt?: string; configured: boolean };
  /** هل مفتاح يوتيوب مضبوط؟ (وجوده فقط — لا قيمته) */
  youtubeApiKey?: boolean;
};

/* ---------- قناة يوتيوب ---------- */
export type YoutubeVideo = {
  id: string;            // معرّف الفيديو على يوتيوب
  title: string;
  publishedAt?: string;
  thumbnail?: string;
  description?: string;
  duration?: string;
  views?: number;
  hidden?: boolean;      // مخفي عن الموقع (يبقى ظاهراً في اللوحة)
  featured?: boolean;    // مثبّت في المقدّمة
  order?: number;
};

export type YoutubeChannel = {
  channelId?: string;
  handle?: string;         // @اسم القناة
  title?: string;
  url?: string;
  thumbnail?: string;
  subscribers?: number;
  videoCount?: number;
  syncedAt?: string;       // آخر مزامنة
  source?: "api" | "rss";  // مصدر الجلب
  videos: YoutubeVideo[];
};

/* ---------- سجلّ الأمان ---------- */
export type SecurityKind =
  | "login_failed"        // كلمة مرور خاطئة
  | "login_ok"            // دخول ناجح
  | "unauthorized_admin"  // محاولة وصول لمسار إداري بلا صلاحية
  | "device_mismatch"     // دخول من جهاز غير المرتبط
  | "bad_code"            // كود تفعيل خاطئ
  | "rate_limited"        // تجاوز حدّ المحاولات
  | "path_probe"          // فحص مسارات معروفة (اختراق آلي)
  | "csrf_blocked"        // طلب من أصل خارجي
  | "media_denied"        // طلب ملف غير مسجّل في المنصّة
  | "banned_hit"          // عنوان محظور حاول الدخول
  | "signup"              // إنشاء حساب
  | "admin_added"         // إضافة مشرف
  | "admin_changed"       // تعديل صلاحيات مشرف
  | "admin_removed"       // حذف مشرف
  | "perm_denied";        // مشرف حاول قسماً بلا صلاحية

export type SecurityEvent = {
  id: string;
  at: string;
  kind: SecurityKind;
  ip: string;
  ua?: string;
  detail?: string;
  userId?: string;
  username?: string;
  severity: "info" | "high";
};

export type SecurityBan = { ip: string; until: string; reason: string; at: string };

/* ---------- قاعدة البيانات الكاملة ---------- */
export type DB = {
  integrations?: Integrations;
  security?: { events: SecurityEvent[]; bans: SecurityBan[] };
  youtube?: YoutubeChannel;
  content: SiteContent;
  plans: SitePlan[];
  students: Student[];
  subjects: Subject[];
  grades: GradeRow[];
  codes: Code[];
  exams: Exam[];
  live: Live[];
  tickets: Ticket[];
  notifications: Notification[];
  users: User[];
};

/** ما يُرسل للواجهة عبر /api/content (بدون كلمات المرور ولا رموز التكاملات). */
export type PublicDB = Omit<DB, "users" | "integrations"> & {
  users: PublicUser[];
  integrations?: PublicIntegrations;
};
