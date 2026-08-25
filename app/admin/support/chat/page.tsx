"use client";

/**
 * محادثات الدعم — كل محادثات الطلاب في مكان واحد.
 * القائمة على اليمين والمحادثة على اليسار؛ وعلى الهاتف شاشة واحدة
 * تتبدّل بين القائمة والمحادثة كما في تطبيقات الرسائل.
 */

import { useCallback, useEffect, useState } from "react";
import { SupportChat } from "@/components/support/chat";
import {
  IconLifebuoy, IconArrowLeft, IconSpinner, IconCheckCircle, IconClock,
} from "@/components/brand/icons";

type Thread = {
  id: string;
  student: string;
  status: "مفتوحة" | "قيد المعالجة" | "مغلقة";
  priority: "عالية" | "متوسطة" | "منخفضة";
  lastAt?: string;
  lastText?: string;
  lastFrom?: "student" | "support";
  total: number;
  unread: number;
};

const STATUS_STYLE: Record<Thread["status"], string> = {
  "مفتوحة": "bg-emerald-500/12 text-emerald-600",
  "قيد المعالجة": "bg-amber-500/12 text-amber-600",
  "مغلقة": "bg-muted text-muted-foreground",
};

export default function SupportChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/support/chat");
    if (res.status === 403) { setDenied(true); setLoading(false); return; }
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setThreads(data.threads ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10000);
    return () => clearInterval(id);
  }, [load]);

  const setStatus = async (id: string, status: Thread["status"]) => {
    await fetch("/api/support/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    void load();
  };

  if (denied) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <IconLifebuoy className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-display font-extrabold">ليست لديك صلاحية الدعم</p>
      </div>
    );
  }

  const current = threads.find((t) => t.id === active);
  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
          <IconLifebuoy className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-extrabold sm:text-xl">محادثات الدعم</h1>
          <p className="text-xs text-muted-foreground">
            {threads.length} محادثة
            {totalUnread > 0 && <span className="font-bold text-rose-500"> · {totalUnread} رسالة جديدة</span>}
          </p>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : threads.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <IconLifebuoy className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-display font-extrabold">لا توجد محادثات بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">تظهر هنا فور أن يرسل طالب أوّل رسالة.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          {/* قائمة المحادثات — تختفي على الهاتف عند فتح محادثة */}
          <div className={`space-y-2 ${active ? "hidden lg:block" : ""}`}>
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`glass w-full rounded-2xl p-3 text-right transition ${
                  active === t.id ? "ring-1 ring-primary/40" : "hover:border-primary/30"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl btn-glow text-xs font-bold text-white">
                    {t.student.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{t.student}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {t.lastFrom === "support" && "أنت: "}
                      {t.lastText ?? "—"}
                    </span>
                  </span>
                  {t.unread > 0 && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      {t.unread}
                    </span>
                  )}
                </span>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[t.status]}`}>
                  {t.status}
                </span>
              </button>
            ))}
          </div>

          {/* المحادثة */}
          <div className={active ? "" : "hidden lg:block"}>
            {current ? (
              <div className="space-y-3">
                <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
                  <button
                    onClick={() => setActive(null)}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-border lg:hidden"
                    aria-label="رجوع"
                  >
                    <IconArrowLeft className="size-4 rotate-180" />
                  </button>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-extrabold">{current.student}</span>
                    <span className="block text-[11px] text-muted-foreground">{current.total} رسالة</span>
                  </span>
                  <button
                    onClick={() => setStatus(current.id, current.status === "مغلقة" ? "مفتوحة" : "مغلقة")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-bold transition hover:border-primary/40"
                  >
                    {current.status === "مغلقة" ? <IconClock className="size-3.5" /> : <IconCheckCircle className="size-3.5" />}
                    {current.status === "مغلقة" ? "إعادة فتح" : "إغلاق"}
                  </button>
                </div>

                <SupportChat threadId={current.id} heightClass="h-[24rem] sm:h-[28rem]" emptyHint="لا رسائل بعد." />
              </div>
            ) : (
              <div className="glass grid h-full min-h-[20rem] place-items-center rounded-3xl p-8 text-center">
                <div>
                  <IconSpinner className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">اختاري محادثة من القائمة.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
