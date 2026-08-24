/**
 * القيم الافتراضية (Seed).
 * المنصة تبدأ فارغة من أي بيانات — لا طلاب/مواد/أكواد/اختبارات وهمية.
 * كل المحتوى الفعلي يُضاف من لوحة الأدمن، والحسابات تُنشأ من التسجيل.
 * تبقى فقط: نصوص الواجهة (قابلة للتعديل) + حساب المالك (الأدمن).
 */
import type {
  SiteContent, SitePlan, Student, Subject, GradeRow, Code, Exam, Live, Ticket,
} from "./types";

export const defaultContent: SiteContent = {
  brand: "إيمان زيدان",
  platformSubtitle: "منصة العلوم الشرعية",
  teacher: {
    name: "الأستاذة إيمان زيدان",
    subject: "العلوم الشرعية",
    headline: "إيمان زيدان في",
    tagline: "التفسير والحديث والفقه والتوحيد والميراث في منصّة واحدة",
    bio: "مدرّسة العلوم الشرعية — التفسير، والحديث، والفقه الشافعي والحنفي، والتوحيد، والميراث؛ بشرح مؤصّل ومبسّط خطوة بخطوة مع تدريبات ومتابعة مستمرة لطلاب العلم.",
    experienceYears: 15,
    avatar: "/teacher.png",
    logo: "",
    rating: 0,
    ratingCount: 0,
    topStudents: 0,
  },
  hero: { statusPill: "التسجيل مفتوح الآن — ابدأ رحلتك في العلوم الشرعية", frame: 1 },
  plansSection: {
    eyebrow: "الخطط",
    title: "اختر خطة اشتراكك",
    desc: "خطط واضحة بأسعار ثابتة — فعّل خطتك بكود التفعيل وابدأ من الدرس الأول.",
    note: "حوّل قيمة الخطة على فودافون كاش أو إنستاباي، وأرسل الإيصال على واتساب ليصلك كود التفعيل.",
  },
  cta: {
    registerLabel: "سجّل الآن",
    registerUrl: "/register",
    heroPrimaryLabel: "أنشئ حساب طالب",
    secondaryLabel: "شاهد درساً مجانياً",
    videoUrl: "",
  },
  whatsapp: "201000000000",
  social: { facebook: "#", youtube: "#", telegram: "#" },
  support: { email: "", phone: "", whatsapp: "" },
  url: "https://eman-zidan.com",
  theme: { layout: "dark", preset: "emerald", customPrimary: null },
  grades: [],
  features: [
    { icon: "BookOpenCheck", tag: "المتون", title: "شرح مؤصّل على المتون", desc: "دروس مرتّبة على المتون المعتمدة في كل مادة بترتيب واضح تمشي عليه خطوة بخطوة.", span: "lg:col-span-2" },
    { icon: "ScrollText", tag: "الدليل", title: "كل مسألة بدليلها", desc: "ربط الأحكام بأدلتها من الكتاب والسنة وأقوال أهل العلم، لا حفظ بلا فهم.", span: "" },
    { icon: "ShieldCheck", tag: "الأمان", title: "حساب آمن بجهاز واحد", desc: "حسابك مرتبط بجهازك الشخصي فقط — تجربة عادلة وآمنة لكل طالب علم.", span: "" },
    { icon: "MessagesSquare", tag: "الدعم", title: "دعم سريع على واتساب", desc: "فريق الدعم يرافقك من تفعيل الكورس لأي استفسار — رد سريع طوال الأسبوع.", span: "lg:col-span-2" },
  ],
  curriculum: [],
  honorStudents: [],
  faqs: [
    { q: "إزاي أشتري الكورس وأفعّله؟", a: "أنشئ حسابك، اختر الكورس المناسب، ثم حوّل قيمته فودافون كاش أو إنستاباي وابعت صورة الإيصال على واتساب — نراجع التحويل ونرسل لك كود تفعيل الكورس." },
    { q: "الكورس بيفضل مفتوح قد إيه؟", a: "بعد التفعيل يظل الكورس مفتوحاً لك بمشاهدة غير محدودة لكل دروسه طوال المدة المحدّدة." },
    { q: "إيه المواد المتاحة؟", a: "التفسير، والحديث، والفقه الشافعي، والفقه الحنفي، والتوحيد، والميراث — بشرح مؤصّل مع ربط كل مسألة بدليلها." },
    { q: "أقدر أفتح حسابي من أكتر من جهاز؟", a: "الحساب مرتبط بجهاز واحد لضمان تجربة عادلة وآمنة. لو احتجت تغيير الجهاز تواصل مع الدعم." },
    { q: "المحاضرات مباشرة ولا مسجّلة؟", a: "الدروس مسجّلة بجودة عالية تشاهدها في أي وقت، مع حصص بث مباشر دورية للأسئلة والمراجعة." },
  ],
};

/* المنصة تبدأ فارغة تماماً — كل شيء يُضاف من لوحة الأدمن. */
/** لا توجد خطط افتراضية — تُضاف كلها من «/admin/plans». */
export const defaultPlans: SitePlan[] = [];
export const defaultStudents: Student[] = [];
export const defaultSubjects: Subject[] = [];
export const defaultGrades: GradeRow[] = [];
export const defaultCodes: Code[] = [];
export const defaultExams: Exam[] = [];
export const defaultLive: Live[] = [];
export const defaultTickets: Ticket[] = [];
export const defaultNotifications: import("./types").Notification[] = [];

/**
 * حساب المالك (الأدمن) فقط — الدخول بالبريد الإلكتروني وكلمة المرور.
 * القيم الافتراضية قابلة للتغيير عبر متغيّري البيئة ADMIN_EMAIL و ADMIN_PASSWORD.
 */
export const seedUsers = [
  {
    name: "الأستاذة إيمان زيدان",
    role: "admin" as const,
    username: process.env.ADMIN_EMAIL || "admin@eman-zidan.com",
    password: process.env.ADMIN_PASSWORD || "Eman@2026",
    active: true,
  },
];
