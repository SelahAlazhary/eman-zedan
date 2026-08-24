"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { IconBell } from "@/components/brand/icons";
import { EmptyBell } from "@/components/brand/illustrations";
import { EnableNotifications } from "@/components/pwa/enable-notifications";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";

export default function StudentNotifications() {
  const { db, session, refresh } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  // الإشعارات تصل مفلترة من السيرفر (للجميع / لصفّه / لشعبته / له وحده)
  const items = db?.notifications ?? [];
  const read = new Set(me?.readNotifications ?? []);
  const unread = items.filter((n) => !read.has(n.id)).map((n) => n.id);

  // تعليمها كمقروءة عند فتح الصفحة
  useEffect(() => {
    if (!unread.length) return;
    (async () => {
      await fetch("/api/notifications/read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unread }),
      });
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.join(",")]);

  return (
    <>
      <PageHeader title="الإشعارات" subtitle="آخر الإشعارات الخاصة بك" />

      <EnableNotifications className="mb-5" />
      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <EmptyBell className="text-primary" width={176} />
          <p className="font-display text-lg font-extrabold">لا توجد إشعارات</p>
          <p className="max-w-sm text-sm text-muted-foreground">ستظهر هنا إشعارات المعلّمة والإدارة.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n, i) => {
            const isNew = !read.has(n.id);
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`!p-4 ${isNew ? "ring-1 ring-primary/30" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary"><IconBell anim={isNew ? "swing" : undefined} className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-bold">
                        {n.title}
                        {isNew && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">جديد</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("ar-EG")}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
