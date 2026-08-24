"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { AuthShell, inputCls } from "@/components/auth/auth-shell";
import { useContent } from "@/components/content/content-provider";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useContent();
  const [form, setForm] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "تعذّر الدخول"); setBusy(false); return; }
    await refresh();
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    router.push(next || (data.role === "admin" ? "/admin" : "/student"));
  };

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="ادخل إلى حسابك لمتابعة دروسك"
      footer={<>ليس لديك حساب؟ <Link href="/register" className="font-bold text-primary">أنشئ حساباً</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3">
        <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">البريد الإلكتروني</span>
          <input type="email" dir="ltr" className={`${inputCls} text-right`} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">كلمة المرور</span>
          <input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        </label>
        {err && <p className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500">{err}</p>}
        <button type="submit" disabled={busy} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl btn-glow py-3 text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />} دخول
        </button>
      </form>
    </AuthShell>
  );
}
