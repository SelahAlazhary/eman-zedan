"use client";

/** CTA نهائي + الفوتر — من المحتوى الحيّ. */
import { motion } from "framer-motion";
import Link from "next/link";
import { navLinks } from "@/lib/data";
import { Button } from "@/components/ui/primitives";
import { SpringArrow } from "@/components/ui/animated-icons";
import { IconWhatsapp, IconFacebook, IconYoutube, IconTelegram } from "@/components/brand/icons";
import { BrandLockup } from "@/components/brand/logo";
import { GeoBackdrop, RuleOrnament } from "@/components/brand/pattern";
import { useContent } from "@/components/content/content-provider";
import { el, isHidden, btnStyle } from "@/lib/ui-style";

export function CtaFooter() {
  const { content, wa } = useContent();
  const showCta = !isHidden(content, "section.cta");

  return (
    <>
      {showCta && (
      <section className="relative py-24">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="btn-glow relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-center text-white shadow-glow-lg">
            <GeoBackdrop density={64} opacity={0.65} fade="center" tone="text-white/70" className="!z-0" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-[1.5] [text-wrap:balance] sm:text-4xl">
                جاهز تبدأ رحلتك في العلوم الشرعية؟
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/85">أنشئ حسابك في أقل من دقيقة، فعّل باقتك، وابدأ من الدرس الأول.</p>
              <motion.div initial="rest" whileHover="hover" className="mt-8 flex flex-wrap justify-center gap-3">
                <Button as="a" href={content.cta?.registerUrl || "/register"} style={btnStyle(el(content, "cta.primary"))} variant="outline" className="border-white/40 bg-white px-8 py-3.5 text-primary hover:bg-white">
                  {content.cta?.heroPrimaryLabel || "أنشئ حساب طالب"} <SpringArrow />
                </Button>
                <Button as="a" href={wa()} variant="ghost" className="border border-white/40 text-white hover:bg-white/10">
                  <IconWhatsapp className="size-5" /> تواصل واتساب
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      )}

      <footer className="border-t border-border py-12">
        <div className="container grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandLockup brand={content.brand} subtitle={content.platformSubtitle} logo={content.teacher.logo} size={44} />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              منصة {content.brand} لتعليم {content.teacher.subject} — شروحات منظّمة ومؤصّلة، من أي مكان وفي أي وقت.
            </p>
          </div>

          <div>
            <p className="mb-4 font-display font-bold">روابط</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {navLinks.map((l) => (<li key={l.id}><a href={`#${l.id}`} className="transition hover:text-primary">{l.label}</a></li>))}
              <li><Link href="/login" className="transition hover:text-primary">تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-display font-bold">تواصل معنا</p>
            <div className="flex gap-3">
              <SocialBtn href={wa()} label="واتساب"><IconWhatsapp className="size-5" /></SocialBtn>
              <SocialBtn href={content.social.facebook} label="فيسبوك"><IconFacebook className="size-5" /></SocialBtn>
              <SocialBtn href={content.social.youtube} label="يوتيوب"><IconYoutube className="size-5" /></SocialBtn>
              <SocialBtn href={content.social.telegram} label="تليجرام"><IconTelegram className="size-5" /></SocialBtn>
            </div>
          </div>
        </div>
        <div className="container mt-10 flex justify-center"><RuleOrnament width={220} className="text-primary" /></div>
        <div className="container mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {content.brand}. جميع الحقوق محفوظة.
        </div>
      </footer>
    </>
  );
}

function SocialBtn({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} aria-label={label} className="grid size-11 place-items-center rounded-2xl border border-border transition hover:border-primary hover:text-primary">
      {children}
    </a>
  );
}
