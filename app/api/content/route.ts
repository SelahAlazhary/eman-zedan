import { NextResponse } from "next/server";
import { getScopedDB, getPublicDB, getDB, patchDB, publicIntegrations, loadDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { can, permForDbKey } from "@/lib/perms";
import type { DB } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: البيانات المسموح بها لصاحب الجلسة فقط (زائر/طالب/أدمن). */
export async function GET() {
  await loadDB();
  const session = await getSession();
  return NextResponse.json(getScopedDB(session), {
    headers: { "Cache-Control": "no-store, private" },
  });
}

/** PUT: دمج تعديل جزئي (محتوى/كيانات) — للأدمن فقط. */
export async function PUT(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const patch = (await req.json()) as Partial<DB>;

  /**
   * الصلاحيات تُفحص على الخادم: مشرف بلا صلاحية قسم لا يستطيع تعديل
   * بياناته حتى لو استدعى المسار مباشرة. المالكة تمرّ دائماً.
   */
  const me = getDB().users.find((u) => u.id === session.uid);
  const touched = Object.keys(patch).filter((k) => k !== "users" && k !== "integrations");
  const missing = touched.filter((k) => !can(me, permForDbKey(k)));
  if (missing.length) {
    await recordEvent("perm_denied", `تعديل بلا صلاحية: ${missing.join("، ")}`, { userId: me?.id, username: me?.username });
    return NextResponse.json({ error: "ليست لديك صلاحية تعديل هذا القسم" }, { status: 403 });
  }
  // منع تعديل المستخدمين والتكاملات عبر هذا المسار (لهما مساراتهما الخاصة)
  delete (patch as Record<string, unknown>).users;
  delete (patch as Record<string, unknown>).integrations;
  // دمج عميق لكائن المحتوى حتى لا يؤدي تعديل جزئي إلى فقدان حقول (theme/teacher…)
  if (patch.content) {
    const current = getPublicDB().content;
    patch.content = {
      ...current,
      ...patch.content,
      teacher: { ...current.teacher, ...(patch.content.teacher ?? {}) },
      theme: { ...current.theme, ...(patch.content.theme ?? {}) },
      hero: { ...current.hero, ...(patch.content.hero ?? {}) },
      cta: { ...(current.cta ?? {}), ...(patch.content.cta ?? {}) },
      support: { ...(current.support ?? {}), ...(patch.content.support ?? {}) },
      plansSection: { ...(current.plansSection ?? {}), ...(patch.content.plansSection ?? {}) },
    };
  }
  const next = patchDB(patch);
  const { users, integrations, ...rest } = next;
  await flushDB();
  return NextResponse.json({ ok: true, ...rest, integrations: publicIntegrations(next) });
}
