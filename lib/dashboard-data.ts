/** إعدادات تنقّل اللوحات + بذور تصوّرات بسيطة. البيانات الفعلية تأتي من قاعدة البيانات عبر useContent(). */

export type NavItem = { href: string; label: string; icon: string };

export const adminNav: NavItem[] = [
  { href: "/admin", label: "نظرة عامة", icon: "LayoutDashboard" },
  { href: "/admin/customize", label: "تخصيص الموقع", icon: "Palette" },
  { href: "/admin/students", label: "الطلاب", icon: "Users" },
  { href: "/admin/grades", label: "الصفوف", icon: "Layers" },
  { href: "/admin/subjects", label: "المواد", icon: "BookOpen" },
  { href: "/admin/plans", label: "الخطط", icon: "Wallet" },
  { href: "/admin/codes", label: "أكواد التفعيل", icon: "KeyRound" },
  { href: "/admin/exams", label: "الاختبارات", icon: "FileCheck2" },
  { href: "/admin/live", label: "البث المباشر", icon: "Radio" },
  { href: "/admin/youtube", label: "قناة اليوتيوب", icon: "Youtube" },
  { href: "/admin/notifications", label: "الإشعارات", icon: "Bell" },
  { href: "/admin/analytics", label: "التحليلات", icon: "BarChart3" },
  { href: "/admin/security", label: "الأمان", icon: "Shield" },
  { href: "/admin/backup", label: "النسخ الاحتياطي", icon: "Database" },
  { href: "/admin/testimonials", label: "شهادات الطلاب", icon: "Star" },
  { href: "/admin/support", label: "الدعم", icon: "LifeBuoy" },
  { href: "/admin/team", label: "المشرفون", icon: "Shield" },
];

export const studentNav: NavItem[] = [
  { href: "/student", label: "الرئيسية", icon: "Home" },
  { href: "/student/subjects", label: "موادي", icon: "BookOpen" },
  { href: "/student/exams", label: "الاختبارات", icon: "FileCheck2" },
  { href: "/student/live", label: "البث المباشر", icon: "Radio" },
  { href: "/student/notifications", label: "الإشعارات", icon: "Bell" },
  { href: "/student/help", label: "المساعدة", icon: "LifeBuoy" },
];

/** بذور تصوّرات (يمكن لاحقاً اشتقاقها من بيانات فعلية). */
export const enrollTrend = [120, 180, 240, 210, 320, 380, 420, 460, 540, 610, 680, 760];
export const revenueByGrade = [
  { grade: "التمهيدي", value: 96000 },
  { grade: "المتوسط", value: 158000 },
  { grade: "المتقدّم", value: 174500 },
];
