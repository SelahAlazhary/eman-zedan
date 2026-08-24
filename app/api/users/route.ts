import { NextResponse } from "next/server";
import { createUser, setUserActive, deleteUser, bindDevice, resetDevice, loadDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ensureDeviceId, deviceLabel } from "@/lib/device";
import { clientIp, limit, sameOrigin, passwordProblem, invalidUsername } from "@/lib/guard";
import { recordEvent, bannedUntil } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: إنشاء حساب.
 *  - الأدمن: ينشئ أي حساب (طالب/أدمن) ويحدّد التفعيل.
 *  - غير مسجّل: تسجيل ذاتي كطالب (بانتظار التفعيل).
 */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  const body = await req.json();
  const isAdmin = session?.role === "admin";

  if (!body.name || !body.username || !body.password) {
    return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
  }

  // حماية التسجيل الذاتي: حظر، أصل الطلب، حدّ المحاولات، وقوّة البيانات
  if (!isAdmin) {
    const ip = await clientIp();
    if (bannedUntil(ip)) {
      await recordEvent("banned_hit", "محاولة تسجيل من عنوان محظور");
      return NextResponse.json({ error: "تم إيقاف المحاولات من هذا الجهاز مؤقّتاً" }, { status: 429 });
    }
    if (!(await sameOrigin(req))) {
      await recordEvent("csrf_blocked", "تسجيل من أصل خارجي");
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
    }
    const gate = limit(`signup:${ip}`, 3, 60 * 60_000, 60 * 60_000);
    if (!gate.ok) {
      await recordEvent("rate_limited", "تجاوز حدّ إنشاء الحسابات");
      return NextResponse.json({ error: "تم إنشاء حسابات كثيرة من هذا الجهاز — حاول لاحقاً" }, { status: 429 });
    }
    const badUser = invalidUsername(String(body.username));
    if (badUser) return NextResponse.json({ error: badUser }, { status: 400 });
    const badPass = passwordProblem(String(body.password));
    if (badPass) return NextResponse.json({ error: badPass }, { status: 400 });
  }

  try {
    const user = createUser({
      name: body.name,
      username: body.username,
      password: body.password,
      role: isAdmin && body.role === "admin" ? "admin" : "student",
      phone: body.phone,
      grade: body.grade,
      track: body.track,
      gender: body.gender === "female" ? "female" : body.gender === "male" ? "male" : undefined,
      school: body.school,
      governorate: body.governorate,
      active: true, // الحساب مُفعّل فوراً — لا يحتاج موافقة الإدارة
    });
    // التسجيل الذاتي يربط الحساب بجهاز صاحبه فوراً (حساب واحد = جهاز واحد)
    if (user.role === "student" && !isAdmin) {
      const device = await ensureDeviceId();
      bindDevice(user.id, device, deviceLabel(req.headers.get("user-agent")));
    }
    await flushDB();
    await recordEvent("signup", isAdmin ? "أنشأه الأدمن" : "تسجيل ذاتي", { userId: user.id, username: user.username });
    await flushDB();
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}

/** PATCH: تفعيل/إيقاف حساب أو السماح بجهاز جديد — للأدمن فقط.
 *  { id, active }  أو  { id, action: "resetDevice" }
 */
export async function PATCH(req: Request) {
  await loadDB();
  const session = await getSession();
  if (session?.role !== "admin") {
    await recordEvent("unauthorized_admin", "PATCH /api/users");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id, active, action } = await req.json();

  if (action === "resetDevice") {
    const user = resetDevice(String(id));
    if (!user) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    await flushDB();
    return NextResponse.json({ ok: true, user });
  }

  const user = setUserActive(id, Boolean(active));
  if (!user) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  await flushDB();
  return NextResponse.json({ ok: true, user });
}

/** DELETE: حذف حساب — للأدمن فقط. */
export async function DELETE(req: Request) {
  await loadDB();
  const session = await getSession();
  if (session?.role !== "admin") {
    await recordEvent("unauthorized_admin", "DELETE /api/users");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id } = await req.json();
  const ok = deleteUser(id);
  if (!ok) return NextResponse.json({ error: "تعذّر الحذف" }, { status: 400 });
  await flushDB();
  return NextResponse.json({ ok: true });
}
