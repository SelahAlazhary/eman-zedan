import { NextResponse } from "next/server";
import { getDB, saveDB, loadDB, flushDB } from "@/lib/db";
import { pushNotification, pushConfigured } from "@/lib/push";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import type { Notification } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST: إنشاء إشعار وإرساله فوراً لأجهزة جمهوره — للأدمن فقط.
 * { title, body, grade?, track?, userId?, link? }
 */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const b = await req.json().catch(() => null);
  const title = String(b?.title ?? "").trim();
  const body = String(b?.body ?? "").trim();
  if (!title || !body) return NextResponse.json({ error: "العنوان والنص مطلوبان" }, { status: 400 });

  const userId = b?.userId ? String(b.userId) : undefined;
  const n: Notification = {
    id: `N-${Date.now()}`,
    title,
    body,
    createdAt: new Date().toISOString(),
    userId,
    // استهداف طالب بعينه يلغي فلترة الصف/الشعبة
    grade: userId ? undefined : b?.grade ? String(b.grade) : undefined,
    track: userId ? undefined : b?.track ? String(b.track) : undefined,
    link: b?.link ? String(b.link) : undefined,
  };

  const db = getDB();
  db.notifications = [n, ...db.notifications];
  saveDB(db);

  // الدفع إلى الأجهزة (لا يمنع نجاح الحفظ إن تعطّل)
  let delivery = { sent: 0, failed: 0 };
  if (pushConfigured()) {
    try {
      delivery = await pushNotification(n);
    } catch {
      /* الإشعار محفوظ في المنصّة على أي حال */
    }
  }

  await flushDB();

  return NextResponse.json({ ok: true, notification: n, delivery, pushConfigured: pushConfigured() });
}

/** DELETE: حذف إشعار — للأدمن فقط. */
export async function DELETE(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id } = await req.json().catch(() => ({ id: "" }));
  const db = getDB();
  db.notifications = db.notifications.filter((n) => n.id !== id);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true });
}
