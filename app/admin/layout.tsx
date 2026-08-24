import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { adminNav } from "@/lib/dashboard-data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة الإدارة", robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login?next=/admin");

  return (
    // admin-skin: هوية بصرية خاصة بلوحة الإدارة (تصميم فقط — لا يمسّ الموقع أو بوابة الطالب)
    <div className="admin-skin">
      <DashboardShell
        nav={adminNav}
        role="admin"
        user={{ name: session.name, sub: "مدير المنصّة", avatar: session.name.charAt(0) }}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
