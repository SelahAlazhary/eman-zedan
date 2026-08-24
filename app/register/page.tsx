"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { AuthShell, inputCls } from "@/components/auth/auth-shell";
import { useContent } from "@/components/content/content-provider";
import { EGYPT_GOVERNORATES, TRACKS } from "@/lib/data";

export default function RegisterPage() {
  const { db } = useContent();
  const grades = db?.grades ?? [];
  const [form, setForm] = useState({ name: "", username: "", password: "", phone: "", grade: "", track: "", gender: "", school: "", governorate: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.name || !form.username || !form.password) { setErr("الاسم واسم المستخدم وكلمة المرور مطلوبة"); return; }
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, grade: form.grade || grades[0]?.name }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "تعذّر إنشاء الحساب"); return; }
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell title="تم إنشاء الحساب" subtitle="خطوة أخيرة قبل البدء"
        footer={<Link href="/login" className="font-bold text-primary">الذهاب لتسجيل الدخول</Link>}>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <p className="font-display text-lg font-extrabold">تم إنشاء حسابك بنجاح</p>
          <p className="text-sm text-muted-foreground">يمكنك تسجيل الدخول الآن مباشرة. لفتح أي كورس، اشترِ كوده وفعّله من داخل حسابك.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="إنشاء حساب طالب"
      subtitle="سجّل بياناتك للبدء في دراسة العلوم الشرعية"
      footer={<>لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-primary">تسجيل الدخول</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3">
        <Field label="الاسم الكامل"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="البريد الإلكتروني"><input type="email" dir="ltr" className={`${inputCls} text-right`} value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="كلمة المرور"><input type="password" className={inputCls} value={form.password} onChange={(e) => set("password", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم الموبايل"><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="الصف الدراسي">
            <select className={inputCls} value={form.grade} onChange={(e) => set("grade", e.target.value)}>
              <option value="">اختر الصف الدراسي…</option>
              {grades.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="الشعبة">
            <select className={inputCls} value={form.track} onChange={(e) => set("track", e.target.value)}>
              <option value="">اختر الشعبة…</option>
              {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="المحافظة">
            <select className={inputCls} value={form.governorate} onChange={(e) => set("governorate", e.target.value)}>
              <option value="">اختر المحافظة…</option>
              {EGYPT_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="النوع">
            <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">اختر النوع…</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </Field>
          <Field label="اسم المدرسة"><input className={inputCls} value={form.school} onChange={(e) => set("school", e.target.value)} /></Field>
        </div>
        {err && <p className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500">{err}</p>}
        <button type="submit" disabled={busy} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl btn-glow py-3 text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} إنشاء الحساب
        </button>
      </form>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>);
}
