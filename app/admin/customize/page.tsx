"use client";

/** تخصيص الموقع — تحكّم فعلي في الهوية والنصوص والألوان والصور والأسعار. */
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun, Check, Upload, Save, ExternalLink, Palette, Type, ImageIcon, Frame, SlidersHorizontal } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { HeroFrame, FRAME_COUNT, FRAME_NAMES } from "@/components/sections/hero-frames";
import type { SiteContent, Preset, ColorSpec, ElementStyle } from "@/lib/types";
import { mediaSrc } from "@/lib/media";

const ELEMENTS: { key: string; label: string; fill?: boolean; text?: boolean }[] = [
  { key: "section.features", label: "قسم: لماذا نحن" },
  { key: "section.freeLive", label: "قسم: البث المجاني" },
  { key: "section.plans", label: "قسم: الخطط" },
  { key: "section.faq", label: "قسم: الأسئلة الشائعة" },
  { key: "section.cta", label: "قسم: دعوة التسجيل" },
  { key: "nav.register", label: "زر التسجيل (الشريط العلوي)", fill: true, text: true },
  { key: "hero.primary", label: "زر «أنشئ حساب» (الهيرو)", fill: true, text: true },
  { key: "hero.secondary", label: "زر «شاهد درساً» (الهيرو)", text: true },
  { key: "hero.statusPill", label: "شارة الحالة (الهيرو)", text: true },
  { key: "cta.primary", label: "زر قسم الدعوة", fill: true, text: true },
];

const PRESETS: { id: Preset; label: string; swatch: string }[] = [
  { id: "violet", label: "بنفسجي ملكي", swatch: "#7c3aed" },
  { id: "emerald", label: "أخضر زمردي", swatch: "#12b981" },
  { id: "ocean", label: "أزرق محيطي", swatch: "#2b8bf6" },
  { id: "crimson", label: "أحمر مخملي", swatch: "#e11d48" },
];

type Tab = "identity" | "theme" | "images" | "frame" | "links" | "elements";

export default function CustomizePage() {
  const { content, db, saveContent, uploadImage, layout, preset, customPrimary, toggleLayout, setPreset, setCustomPrimary } = useContent();
  const googleReady = Boolean(db?.integrations?.google?.connected);
  const [tab, setTab] = useState<Tab>("identity");
  const [form, setForm] = useState<SiteContent>(content);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<SiteContent>) => setForm((f) => ({ ...f, ...patch }));
  const setTeacher = (patch: Partial<SiteContent["teacher"]>) => setForm((f) => ({ ...f, teacher: { ...f.teacher, ...patch } }));
  const setSocial = (patch: Partial<SiteContent["social"]>) => setForm((f) => ({ ...f, social: { ...f.social, ...patch } }));
  const setSupport = (patch: Partial<NonNullable<SiteContent["support"]>>) => setForm((f) => ({ ...f, support: { ...(f.support ?? {}), ...patch } }));
  const setCta = (patch: Partial<NonNullable<SiteContent["cta"]>>) => setForm((f) => ({ ...f, cta: { ...(f.cta ?? {}), ...patch } }));
  const setPlansSection = (patch: Partial<NonNullable<SiteContent["plansSection"]>>) =>
    setForm((f) => ({ ...f, plansSection: { ...(f.plansSection ?? {}), ...patch } }));
  const setHeroImage = (patch: Partial<NonNullable<SiteContent["hero"]["image"]>>) =>
    setForm((f) => ({ ...f, hero: { ...f.hero, image: { ...(f.hero.image ?? {}), ...patch } } }));
  const pickFrame = (n: number) => { setForm((f) => ({ ...f, hero: { ...f.hero, frame: n } })); void saveContent({ hero: { ...content.hero, frame: n } }); };
  const setUi = (key: string, patch: Partial<ElementStyle>) =>
    setForm((f) => ({ ...f, ui: { ...(f.ui ?? {}), [key]: { ...(f.ui?.[key] ?? {}), ...patch } } }));

  const commit = async () => {
    setSaving(true);
    // الحفاظ على الثيم/الفريم المطبّقين فوراً حتى لا تُكتب نسخة form القديمة فوقهما
    await saveContent({ ...form, theme: content.theme, hero: { ...form.hero, frame: content.hero.frame } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <PageHeader
        title="تخصيص الموقع"
        subtitle="عدّل الهوية والألوان والنصوص والصور — وكل تغيير يُحفظ ويظهر مباشرة على الموقع"
        action={
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
              <ExternalLink className="size-4" /> معاينة
            </Link>
            <Button className="px-5 py-2.5" onClick={commit} disabled={saving}>
              {saved ? <><Check className="size-4" /> تم الحفظ</> : <><Save className="size-4" /> {saving ? "جارٍ الحفظ…" : "حفظ النصوص"}</>}
            </Button>
          </div>
        }
      />

      {/* تبويبات */}
      <div className="mb-6 flex flex-wrap gap-2">
        <TabBtn active={tab === "identity"} onClick={() => setTab("identity")} icon={<Type className="size-4" />}>الهوية والنصوص</TabBtn>
        <TabBtn active={tab === "theme"} onClick={() => setTab("theme")} icon={<Palette className="size-4" />}>الألوان والثيم</TabBtn>
        <TabBtn active={tab === "images"} onClick={() => setTab("images")} icon={<ImageIcon className="size-4" />}>الصور والشعار</TabBtn>
        <TabBtn active={tab === "frame"} onClick={() => setTab("frame")} icon={<Frame className="size-4" />}>إطار الصورة</TabBtn>
        <TabBtn active={tab === "links"} onClick={() => setTab("links")} icon={<ExternalLink className="size-4" />}>الروابط والأزرار</TabBtn>
        <TabBtn active={tab === "elements"} onClick={() => setTab("elements")} icon={<SlidersHorizontal className="size-4" />}>إظهار/إخفاء وألوان</TabBtn>
      </div>

      {/* ---------- الهوية والنصوص ---------- */}
      {tab === "identity" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-display font-extrabold">هوية المنصّة</h3>
            <div className="grid gap-3">
              <Field label="اسم المنصّة"><input className="inp" value={form.brand} onChange={(e) => set({ brand: e.target.value })} /></Field>
              <Field label="وصف المنصّة"><input className="inp" value={form.platformSubtitle} onChange={(e) => set({ platformSubtitle: e.target.value })} /></Field>
              <Field label="اسم الأستاذة"><input className="inp" value={form.teacher.name} onChange={(e) => setTeacher({ name: e.target.value })} /></Field>
              <Field label="المادة"><input className="inp" value={form.teacher.subject} onChange={(e) => setTeacher({ subject: e.target.value })} /></Field>
              <Field label="رقم واتساب (دولي بدون +)"><input className="inp" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
              <Field label="تاريخ نهاية الترم العام (تنتهي عنده خطط «الترم الكامل» التي بلا تاريخ خاص)"><input type="date" dir="ltr" className="inp text-right" value={form.termEnd ?? ""} onChange={(e) => set({ termEnd: e.target.value })} /></Field>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-sm font-bold">نصوص قسم «الخطط» في الصفحة الرئيسية</p>
              <div className="grid gap-3">
                <Field label="العنوان الصغير"><input className="inp" value={form.plansSection?.eyebrow ?? ""} onChange={(e) => setPlansSection({ eyebrow: e.target.value })} placeholder="الخطط" /></Field>
                <Field label="العنوان الرئيسي"><input className="inp" value={form.plansSection?.title ?? ""} onChange={(e) => setPlansSection({ title: e.target.value })} placeholder="اختر خطة" /></Field>
                <Field label="الوصف"><input className="inp" value={form.plansSection?.desc ?? ""} onChange={(e) => setPlansSection({ desc: e.target.value })} /></Field>
                <Field label="ملاحظة أسفل الخطط"><input className="inp" value={form.plansSection?.note ?? ""} onChange={(e) => setPlansSection({ note: e.target.value })} /></Field>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">الخطط نفسها (الأسماء والأنواع والأسعار) تُدار من صفحة «الخطط».</p>
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 font-display font-extrabold">نصوص الواجهة الرئيسية</h3>
            <div className="grid gap-3">
              <Field label="شارة الحالة (أعلى الهيرو)"><input className="inp" value={form.hero.statusPill} onChange={(e) => set({ hero: { statusPill: e.target.value } })} /></Field>
              <Field label="العنوان الرئيسي"><input className="inp" value={form.teacher.headline} onChange={(e) => setTeacher({ headline: e.target.value })} /></Field>
              <Field label="الشعار التسويقي"><input className="inp" value={form.teacher.tagline} onChange={(e) => setTeacher({ tagline: e.target.value })} /></Field>
              <Field label="نبذة الأستاذة"><textarea rows={3} className="inp" value={form.teacher.bio} onChange={(e) => setTeacher({ bio: e.target.value })} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="التقييم"><input type="number" step="0.1" className="inp" value={form.teacher.rating} onChange={(e) => setTeacher({ rating: Number(e.target.value) })} /></Field>
                <Field label="عدد الطلاب"><input type="number" className="inp" value={form.teacher.ratingCount} onChange={(e) => setTeacher({ ratingCount: Number(e.target.value) })} /></Field>
                <Field label="المتفوّقون"><input type="number" className="inp" value={form.teacher.topStudents} onChange={(e) => setTeacher({ topStudents: Number(e.target.value) })} /></Field>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------- الألوان ---------- */}
      {tab === "theme" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-display font-extrabold">نمط التخطيط</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => layout !== "dark" && toggleLayout()} className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-bold transition ${layout === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}><Moon className="size-6" /> داكن (زجاجي)</button>
              <button onClick={() => layout !== "light" && toggleLayout()} className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-bold transition ${layout === "light" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}><Sun className="size-6" /> فاتح (راقٍ)</button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">التغيير يُطبَّق ويُحفظ فوراً.</p>
          </Card>
          <Card>
            <h3 className="mb-4 font-display font-extrabold">الهوية اللونية</h3>
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => setPreset(p.id)} className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition ${preset === p.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <span className="size-5 rounded-full ring-2 ring-white/40" style={{ background: p.swatch }} />
                  {p.label}
                  {preset === p.id && <Check className="mr-auto size-4 text-primary" />}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <span className="text-sm font-semibold">لون مخصّص</span>
              <span className="flex items-center gap-2">
                {preset === "custom" && <Check className="size-4 text-primary" />}
                <input type="color" value={customPrimary ?? "#12b981"} onChange={(e) => setCustomPrimary(e.target.value)} className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" />
              </span>
            </label>
          </Card>
        </div>
      )}

      {/* ---------- الصور ---------- */}
      {tab === "images" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <h3 className="mb-1 font-display font-extrabold">مكان استضافة الملفات المرفوعة</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              عند اختيار Google Drive تُرفع الصور والفيديوهات في الخلفية إلى مجلّد باسم المنصّة داخل حساب جوجل المربوط،
              ويُحفظ في المنصّة رابط العرض فقط — فلا تستهلك مساحة الخادم.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { id: "local", title: "خادم المنصّة", desc: "الملفات تُحفظ في مجلّد الخادم (افتراضي)" },
                { id: "drive", title: "Google Drive", desc: "يتطلّب ربط حساب جوجل من صفحة «البث المباشر»" },
              ] as const).map((o) => {
                const active = (form.mediaHost ?? "local") === o.id;
                const blocked = o.id === "drive" && !googleReady;
                return (
                  <button key={o.id} type="button" disabled={blocked}
                    onClick={() => { set({ mediaHost: o.id }); void saveContent({ mediaHost: o.id }); }}
                    className={`rounded-2xl border p-4 text-right transition disabled:opacity-50 ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <span className="block text-sm font-bold">{o.title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {blocked ? "اربط حساب جوجل أولاً من «البث المباشر»" : o.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
          <ImageUploader label="صورة الأستاذة (Hero)" hint="يُفضّل PNG بخلفية شفافة" value={form.teacher.avatar}
            onUpload={async (f) => { const url = await uploadImage(f); if (url) { setTeacher({ avatar: url }); await saveContent({ teacher: { ...form.teacher, avatar: url } }); } }} tall />
          <ImageUploader label="شعار المنصّة / الأيقونة (favicon)" hint="مربّع، PNG/SVG" value={form.teacher.logo}
            onUpload={async (f) => { const url = await uploadImage(f); if (url) { setTeacher({ logo: url }); await saveContent({ teacher: { ...form.teacher, logo: url } }); } }} />
        </div>
      )}

      {/* ---------- إطار الصورة ---------- */}
      {tab === "frame" && (
        <>
        <Card className="mb-5">
          <h3 className="mb-1 font-display font-extrabold">ضبط الصورة داخل الإطار</h3>
          <p className="mb-5 text-xs text-muted-foreground">الصورة تظهر كاملة بلا قصّ افتراضياً — حرّكها وكبّرها حتى تستقرّ، والمعاينة تتغيّر فوراً ثم اضغط حفظ.</p>
          <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr]">
            <div className="mx-auto w-full max-w-[240px]">
              <HeroFrame frame={form.hero.frame ?? 1} avatar={form.teacher.avatar} alt="معاينة" img={form.hero.image} />
            </div>
            <div className="grid gap-4 self-center">
              <div>
                <span className="lbl">طريقة الملء</span>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "contain", label: "الصورة كاملة (بلا قصّ)" },
                    { id: "cover", label: "ملء الإطار (يقصّ الزائد)" },
                  ] as const).map((o) => (
                    <button key={o.id} type="button" onClick={() => setHeroImage({ fit: o.id })}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-bold transition ${
                        (form.hero.image?.fit ?? "contain") === o.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                      }`}>{o.label}</button>
                  ))}
                </div>
              </div>

              <Slider label="التكبير" value={form.hero.image?.scale ?? 1} min={0.6} max={2.5} step={0.02}
                display={`${Math.round((form.hero.image?.scale ?? 1) * 100)}٪`}
                onChange={(v) => setHeroImage({ scale: v })} />
              <Slider label="الإزاحة الأفقية" value={form.hero.image?.x ?? 0} min={-40} max={40} step={1}
                display={`${form.hero.image?.x ?? 0}٪`}
                onChange={(v) => setHeroImage({ x: v })} />
              <Slider label="الإزاحة الرأسية" value={form.hero.image?.y ?? 0} min={-40} max={40} step={1}
                display={`${form.hero.image?.y ?? 0}٪`}
                onChange={(v) => setHeroImage({ y: v })} />

              <div className="flex flex-wrap gap-2">
                <Button className="px-5 py-2.5" onClick={() => void saveContent({ hero: { ...content.hero, image: form.hero.image } })}>
                  <Save className="size-4" /> حفظ الضبط
                </Button>
                <button
                  onClick={() => { setHeroImage({ fit: "contain", x: 0, y: 0, scale: 1 }); void saveContent({ hero: { ...content.hero, image: { fit: "contain", x: 0, y: 0, scale: 1 } } }); }}
                  className="rounded-full border border-border px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
                  إعادة الضبط
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 font-display font-extrabold">اختر تصميم إطار الصورة</h3>
          <p className="mb-5 text-xs text-muted-foreground">٨ تصاميم بأنيميشنات مختلفة — التغيير يُطبَّق ويُحفظ فوراً.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: FRAME_COUNT }).map((_, i) => {
              const n = i + 1;
              const active = (form.hero.frame ?? 1) === n;
              return (
                <button key={n} onClick={() => pickFrame(n)}
                  className={`group rounded-3xl border p-3 text-center transition ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <div className="relative mx-auto mb-2 h-32 w-full">
                    <HeroFrame frame={n} avatar={form.teacher.avatar} alt={`frame ${n}`} />
                  </div>
                  <p className="text-xs font-bold">{n}. {FRAME_NAMES[n]}</p>
                  {active && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary"><Check className="size-3" /> مُختار</span>}
                </button>
              );
            })}
          </div>
        </Card>
        </>
      )}

      {/* ---------- الروابط والأزرار ---------- */}
      {tab === "links" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-display font-extrabold">روابط التواصل</h3>
            <div className="grid gap-3">
              <Field label="رقم واتساب (دولي بدون +)"><input dir="ltr" className="inp text-right" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
              <Field label="رابط فيسبوك"><input dir="ltr" className="inp text-right" value={form.social.facebook} onChange={(e) => setSocial({ facebook: e.target.value })} /></Field>
              <Field label="رابط يوتيوب"><input dir="ltr" className="inp text-right" value={form.social.youtube} onChange={(e) => setSocial({ youtube: e.target.value })} /></Field>
              <Field label="رابط تليجرام"><input dir="ltr" className="inp text-right" value={form.social.telegram} onChange={(e) => setSocial({ telegram: e.target.value })} /></Field>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-sm font-bold">روابط الدعم</p>
              <div className="grid gap-3">
                <Field label="بريد الدعم"><input type="email" dir="ltr" className="inp text-right" value={form.support?.email ?? ""} onChange={(e) => setSupport({ email: e.target.value })} placeholder="support@example.com" /></Field>
                <Field label="هاتف الدعم"><input dir="ltr" className="inp text-right" value={form.support?.phone ?? ""} onChange={(e) => setSupport({ phone: e.target.value })} placeholder="+20100…" /></Field>
                <Field label="واتساب الدعم (اختياري — يختلف عن الرئيسي)"><input dir="ltr" className="inp text-right" value={form.support?.whatsapp ?? ""} onChange={(e) => setSupport({ whatsapp: e.target.value })} placeholder="دولي بدون +" /></Field>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 font-display font-extrabold">أزرار الصفحة الرئيسية</h3>
            <div className="grid gap-3">
              <Field label="نص زر التسجيل"><input className="inp" value={form.cta?.registerLabel ?? "سجّل الآن"} onChange={(e) => setCta({ registerLabel: e.target.value })} /></Field>
              <Field label="رابط زر التسجيل"><input dir="ltr" className="inp text-right" value={form.cta?.registerUrl ?? "/register"} onChange={(e) => setCta({ registerUrl: e.target.value })} placeholder="/register أو رابط خارجي" /></Field>
              <Field label="نص زر إنشاء حساب (الهيرو)"><input className="inp" value={form.cta?.heroPrimaryLabel ?? "أنشئ حساب طالب"} onChange={(e) => setCta({ heroPrimaryLabel: e.target.value })} /></Field>
              <Field label="نص الزر الثانوي (الفيديو)"><input className="inp" value={form.cta?.secondaryLabel ?? "شاهد درساً مجانياً"} onChange={(e) => setCta({ secondaryLabel: e.target.value })} /></Field>
              <Field label="رابط الدرس المجاني (اختياري)"><input dir="ltr" className="inp text-right" value={form.cta?.videoUrl ?? ""} onChange={(e) => setCta({ videoUrl: e.target.value })} placeholder="رابط يوتيوب لدرس تجريبي" /></Field>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">اضغط «حفظ النصوص» بالأعلى لحفظ التغييرات.</p>
          </Card>
        </div>
      )}

      {/* ---------- إظهار/إخفاء وألوان العناصر ---------- */}
      {tab === "elements" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {ELEMENTS.map((elm) => {
            const st = form.ui?.[elm.key] ?? {};
            return (
              <Card key={elm.key}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="font-display font-bold">{elm.label}</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" checked={!st.hidden} onChange={(e) => setUi(elm.key, { hidden: !e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
                    ظاهر
                  </label>
                </div>
                {elm.fill && <ColorPicker label="لون الزر" spec={st.fill} onChange={(v) => setUi(elm.key, { fill: v })} />}
                {elm.text && <div className="mt-2"><ColorPicker label="لون النص" spec={st.text} onChange={(v) => setUi(elm.key, { text: v })} /></div>}
              </Card>
            );
          })}
          <p className="text-xs text-muted-foreground lg:col-span-2">اضغط «حفظ النصوص» بالأعلى لحفظ التغييرات.</p>
        </div>
      )}

      <style>{`.inp{width:100%;border-radius:0.9rem;border:1px solid hsl(var(--border));background:hsl(var(--card)/0.6);padding:0.6rem 0.85rem;font-size:0.9rem;outline:none;color:inherit;font-family:inherit}.inp:focus{border-color:hsl(var(--primary)/0.6)}.inp.w-auto{width:auto}.lbl{margin-bottom:0.35rem;display:block;font-size:0.7rem;font-weight:600;color:hsl(var(--muted-foreground))}`}</style>
    </>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${active ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}>
      {icon}{children}
    </button>
  );
}

function Slider({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        {label} <span className="font-bold text-primary">{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]" />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>);
}

function ColorPicker({ label, spec, onChange }: { label: string; spec?: ColorSpec; onChange: (v: ColorSpec) => void }) {
  const s: ColorSpec = spec ?? { mode: "theme" };
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <select value={s.mode} onChange={(e) => onChange({ ...s, mode: e.target.value as ColorSpec["mode"] })}
          className="rounded-xl border border-border bg-card/60 px-3 py-2 text-xs outline-none">
          <option value="theme">افتراضي (الثيم)</option>
          <option value="solid">لون واحد</option>
          <option value="gradient">متدرّج</option>
        </select>
        {s.mode === "solid" && (
          <input type="color" value={s.color ?? "#7c3aed"} onChange={(e) => onChange({ ...s, color: e.target.value })} className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" />
        )}
        {s.mode === "gradient" && (
          <>
            <input type="color" value={s.from ?? "#7c3aed"} onChange={(e) => onChange({ ...s, from: e.target.value })} className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" />
            <span className="text-xs text-muted-foreground">←</span>
            <input type="color" value={s.to ?? "#c026d3"} onChange={(e) => onChange({ ...s, to: e.target.value })} className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" />
          </>
        )}
      </div>
    </div>
  );
}

function ImageUploader({ label, hint, value, onUpload, tall }: { label: string; hint: string; value: string; onUpload: (f: File) => void; tall?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <h3 className="mb-1 font-display font-extrabold">{label}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{hint}</p>
      <div className={`relative grid ${tall ? "aspect-[4/5] max-w-xs" : "aspect-square max-w-[180px]"} mx-auto place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30`}>
        {value ? (
          <Image src={mediaSrc(value)} alt={label} fill unoptimized referrerPolicy="no-referrer" className="object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">لا توجد صورة</span>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setBusy(true); await onUpload(f); setBusy(false); } }} />
      <Button variant="outline" className="mx-auto mt-4 flex" onClick={() => ref.current?.click()} disabled={busy}>
        <Upload className="size-4" /> {busy ? "جارٍ الرفع…" : "رفع صورة"}
      </Button>
    </Card>
  );
}
