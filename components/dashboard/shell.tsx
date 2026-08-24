"use client";

/**
 * DashboardShell — هيكل موحّد للوحات التحكّم (أدمن/طالب).
 * • Sidebar ثابت على اليمين (RTL) لسطح المكتب + Drawer للموبايل.
 * • Topbar فيه بحث، إشعارات، تبديل الثيم، وبطاقة المستخدم.
 * • شريط تنقّل سفلي (Bottom nav) للموبايل في وضع الطالب.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import type { IconProps } from "@/components/brand/icons";
import {
  IconGrid, IconUsers, IconLayers, IconBook, IconKey, IconClipboardCheck, IconRadio,
  IconChart, IconLifebuoy, IconHome, IconPalette, IconSearch, IconBell, IconMenu, IconClose,
  IconMoon, IconSun, IconLogout, IconWallet, IconYoutube, IconDatabase, IconShield,
} from "@/components/brand/icons";
import { BrandLockup } from "@/components/brand/logo";
import { useContent } from "@/components/content/content-provider";
import type { NavItem } from "@/lib/dashboard-data";

type BrandIcon = ComponentType<IconProps>;

/** مفاتيح التنقّل → أيقونات الهوية المتّجهة. */
const ICONS: Record<string, BrandIcon> = {
  LayoutDashboard: IconGrid,
  Users: IconUsers,
  Layers: IconLayers,
  BookOpen: IconBook,
  KeyRound: IconKey,
  FileCheck2: IconClipboardCheck,
  Radio: IconRadio,
  BarChart3: IconChart,
  LifeBuoy: IconLifebuoy,
  Home: IconHome,
  Palette: IconPalette,
  Bell: IconBell,
  Wallet: IconWallet,
  Youtube: IconYoutube,
  Database: IconDatabase,
  Shield: IconShield,
};

export function DashboardShell({
  nav,
  role,
  user,
  children,
}: {
  nav: NavItem[];
  role: "admin" | "student";
  user: { name: string; sub: string; avatar: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { viewLayout, toggleView, logout, db, session } = useContent();
  const [open, setOpen] = useState(false);
  // نقطة الإشعارات: للطالب = إشعارات غير مقروءة، للأدمن = وجود إشعارات
  const notifs = db?.notifications ?? [];
  const readIds = new Set(db?.users?.find((u) => u.id === session?.uid)?.readNotifications ?? []);
  const hasNotif = role === "student" ? notifs.some((n) => !readIds.has(n.id)) : notifs.length > 0;

  const doLogout = async () => { await logout(); router.push("/login"); };

  const isActive = (href: string) =>
    href === `/${role}` ? pathname === href : pathname.startsWith(href);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const Icon = ICONS[item.icon] ?? IconGrid;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`side-${role}`}
                className="absolute inset-0 rounded-2xl bg-primary/10 ring-1 ring-primary/20"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="relative z-10 size-5 shrink-0" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="app-shell bg-background lg:min-h-screen">
      {/* هالة خلفية خفيفة */}
      <div className="ambient-mesh pointer-events-none fixed inset-0 -z-10 opacity-30" />

      {/* Sidebar سطح المكتب */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col gap-6 border-l border-border bg-card/40 p-5 backdrop-blur-xl lg:flex">
        <Brand role={role} />
        <NavLinks />
        <div className="mt-auto">
          <UserCard user={user} onLogout={doLogout} />
        </div>
      </aside>

      {/* Drawer موبايل */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[17.5rem] max-w-[85vw] flex-col gap-6 border-l border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Brand role={role} />
                <button onClick={() => setOpen(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full border border-border">
                  <IconClose className="size-5" />
                </button>
              </div>
              <NavLinks onClick={() => setOpen(false)} />
              <div className="mt-auto"><UserCard user={user} onLogout={doLogout} /></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* المحتوى */}
      <div className="app-body lg:block lg:pr-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="القائمة" className={`grid size-11 shrink-0 place-items-center rounded-full border border-border lg:hidden ${role === "student" ? "hidden" : ""}`}>
            <IconMenu className="size-5" />
          </button>

          {/* موبايل: الهوية · سطح المكتب: بحث سريع */}
          <span className="lg:hidden"><Brand role={role} /></span>
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <IconSearch className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="بحث سريع…"
              className="w-full rounded-full border border-border bg-card/60 py-2 pr-10 pl-4 text-sm outline-none transition focus:border-primary/50"
            />
          </div>

          <div className="mr-auto flex items-center gap-2">
            <button onClick={toggleView} aria-label="تبديل المظهر" className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground sm:size-10">
              {viewLayout === "dark" ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
            </button>
            <Link href={role === "admin" ? "/admin/notifications" : "/student/notifications"} aria-label="الإشعارات" className="relative grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground sm:size-10">
              <IconBell anim={hasNotif ? "swing" : undefined} className="size-5" />
              {hasNotif && <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />}
            </Link>
            <span className="grid size-11 place-items-center rounded-full btn-glow text-sm font-bold text-white sm:size-10">
              {user.avatar}
            </span>
          </div>
        </header>

        <main className="app-scroll p-4 pb-6 sm:p-6 lg:pb-8">{children}</main>
      </div>

      {/* شريط تبويبات عائم بأسلوب التطبيقات (الطالب · موبايل) */}
      {role === "student" && (
        <nav aria-label="التنقّل السريع" className="app-dock lg:hidden">
          <ul
            className="app-dock-inner no-select-app"
            style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
          >
            {nav.map((item) => {
              const Icon = ICONS[item.icon] ?? IconHome;
              const active = isActive(item.href);
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`app-tab ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {active && <span className="app-tab-pill" />}
                    <span className="relative z-10 grid size-7 place-items-center">
                      <Icon className="size-[1.2rem]" />
                    </span>
                    <span className="relative z-10 max-w-full truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

    </div>
  );
}

function Brand({ role }: { role: "admin" | "student" }) {
  const { content } = useContent();
  return (
    <Link href={role === "admin" ? "/admin" : "/student"} className="inline-flex">
      <BrandLockup
        brand={content.brand}
        subtitle={role === "admin" ? "لوحة الإدارة" : "بوابة الطالب"}
        logo={content.teacher.logo}
        size={40}
      />
    </Link>
  );
}

function UserCard({ user, onLogout }: { user: { name: string; sub: string; avatar: string }; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-3">
      <span className="grid size-10 place-items-center rounded-full btn-glow text-sm font-bold text-white">{user.avatar}</span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-bold">{user.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{user.sub}</p>
      </div>
      <button onClick={onLogout} aria-label="خروج" className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:text-rose-500">
        <IconLogout className="size-4" />
      </button>
    </div>
  );
}
