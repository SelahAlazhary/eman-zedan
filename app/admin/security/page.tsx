"use client";

/**
 * الأمان — كل محاولة مشبوهة مسجّلة هنا، والحظر التلقائي واليدوي للعناوين.
 */
import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck, ShieldAlert, RefreshCw, Ban, Undo2, Loader2, Activity, Lock,
} from "lucide-react";
import { PageHeader, Card, StatCard, DataTable } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";

type Event = {
  id: string; at: string; kind: string; ip: string; ua?: string;
  detail?: string; username?: string; severity: "info" | "high";
};
type BanRow = { ip: string; until: string; reason: string; at: string };
type State = {
  events: Event[];
  bans: BanRow[];
  stats: { total: number; last24h: number; high: number; activeBans: number };
};

const KIND_LABEL: Record<string, string> = {
  login_failed: "دخول فاشل",
  login_ok: "دخول ناجح",
  unauthorized_admin: "وصول إداري مرفوض",
  device_mismatch: "جهاز غير مرتبط",
  bad_code: "كود تفعيل خاطئ",
  rate_limited: "تجاوز حدّ المحاولات",
  path_probe: "فحص مسارات",
  csrf_blocked: "طلب من أصل خارجي",
  media_denied: "ملف غير مسجّل",
  banned_hit: "محاولة من محظور",
  signup: "إنشاء حساب",
};

export default function SecurityPage() {
  const [st, setSt] = useState<State | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ip, setIp] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/security", { cache: "no-store" });
    if (res.ok) setSt(await res.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (action: "ban" | "unban", target: string) => {
    setBusy(target);
    try {
      const res = await fetch("/api/security", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ip: target, minutes: 120 }),
      });
      if (res.ok) setSt(await res.json());
      setIp("");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="الأمان"
        subtitle="كل محاولة مشبوهة مسجّلة — والتكرار الخطير يُحظر تلقائياً"
        action={<Button variant="outline" className="px-4 py-2.5" onClick={() => void load()}><RefreshCw className="size-4" /> تحديث</Button>}
      />

      {st && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard index={0} label="أحداث آخر ٢٤ ساعة" value={st.stats.last24h.toLocaleString("ar-EG")} tone="primary" icon={<Activity className="size-5" />} />
          <StatCard index={1} label="محاولات خطيرة" value={st.stats.high.toLocaleString("ar-EG")} tone="amber" icon={<ShieldAlert className="size-5" />} />
          <StatCard index={2} label="عناوين محظورة" value={st.stats.activeBans.toLocaleString("ar-EG")} tone="violet" icon={<Ban className="size-5" />} />
          <StatCard index={3} label="إجمالي السجلّ" value={st.stats.total.toLocaleString("ar-EG")} tone="emerald" icon={<ShieldCheck className="size-5" />} />
        </div>
      )}

      {/* حظر يدوي */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold">حظر عنوان يدوياً</p>
            <p className="text-xs text-muted-foreground">يمنع الدخول والتسجيل من هذا العنوان لمدّة ساعتين.</p>
          </div>
          <input value={ip} onChange={(e) => setIp(e.target.value)} dir="ltr" placeholder="203.0.113.7"
            className="w-48 rounded-2xl border border-border bg-card/60 px-3 py-2.5 text-right font-mono text-sm outline-none focus:border-primary/50" />
          <Button className="px-5 py-2.5" onClick={() => ip.trim() && act("ban", ip.trim())} disabled={!ip.trim() || busy !== null}>
            {busy === ip.trim() ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />} حظر
          </Button>
        </div>
      </Card>

      {/* المحظورون */}
      {st && st.bans.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 font-display font-bold">العناوين المحظورة</p>
          <DataTable head={["العنوان", "السبب", "ينتهي الحظر", "إجراء"]}>
            {st.bans.map((b) => (
              <tr key={b.ip} className="transition hover:bg-muted/50">
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">{b.ip}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.reason}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(b.until).toLocaleString("ar-EG")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => act("unban", b.ip)} disabled={busy !== null}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-primary transition hover:border-primary disabled:opacity-50">
                    <Undo2 className="size-3.5" /> رفع الحظر
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* السجلّ */}
      <p className="mb-3 font-display font-bold">آخر المحاولات</p>
      {st && st.events.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-500"><Lock className="size-7" /></span>
          <p className="font-display font-extrabold">لا توجد محاولات مشبوهة</p>
          <p className="text-sm text-muted-foreground">سيظهر هنا أي دخول فاشل أو محاولة وصول غير مصرّح بها.</p>
        </Card>
      ) : (
        <DataTable head={["الوقت", "الحدث", "العنوان", "التفاصيل", "الخطورة"]}>
          {(st?.events ?? []).map((e) => (
            <tr key={e.id} className="transition hover:bg-muted/50">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(e.at).toLocaleString("ar-EG")}</td>
              <td className="px-4 py-3 font-semibold">{KIND_LABEL[e.kind] ?? e.kind}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs" dir="ltr">{e.ip}</span>
                {e.ip !== "local" && (
                  <button onClick={() => act("ban", e.ip)} disabled={busy !== null} title="حظر هذا العنوان"
                    className="mr-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold text-rose-500 transition hover:border-rose-500">
                    حظر
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {e.username ? <span className="font-semibold text-foreground">{e.username}</span> : null}
                {e.username && e.detail ? " · " : ""}
                {e.detail}
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.severity === "high" ? "bg-rose-500/15 text-rose-500" : "bg-muted text-muted-foreground"}`}>
                  {e.severity === "high" ? "خطير" : "عادي"}
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
