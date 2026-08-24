"use client";

/** Hero ثلاثي الأبعاد (RTL) — نصوص وصورة من المحتوى الحيّ. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Pill } from "@/components/ui/primitives";
import { SparkleStar, Stars, CountUp, SpringArrow } from "@/components/ui/animated-icons";
import { IconPlay, IconTrophy } from "@/components/brand/icons";
import { GeoBackdrop } from "@/components/brand/pattern";
import { VideoModal } from "@/components/ui/video-modal";
import { HeroFrame } from "@/components/sections/hero-frames";
import { useContent } from "@/components/content/content-provider";
import { el, isHidden, btnStyle, textStyle } from "@/lib/ui-style";

/** يحوّل رابط يوتيوب إلى صيغة تضمين للنافذة المنبثقة. */
function toEmbedSrc(url?: string): string | undefined {
  if (!url) return undefined;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return url;
}

export function Hero() {
  const { content, wa, session } = useContent();
  const router = useRouter();
  const t = content.teacher;
  const [videoOpen, setVideoOpen] = useState(false);
  const [freeSrc, setFreeSrc] = useState<string | undefined>(undefined);
  const [freeErr, setFreeErr] = useState<string | null>(null);
  const [freeBusy, setFreeBusy] = useState(false);

  /** الدرس المجاني لا يعمل إلا بعد تسجيل الدخول — الرابط نفسه يأتي من السيرفر
   *  ولا يوجد في حمولة الزائر إطلاقاً (لا يمكن استخراجه من الصفحة). */
  const watchFree = async () => {
    setFreeErr(null);
    if (!session) { router.push("/login?next=/"); return; }
    setFreeBusy(true);
    try {
      const res = await fetch("/api/free-lesson", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) { setFreeErr(data.error || "تعذّر فتح الدرس"); return; }
      setFreeSrc(toEmbedSrc(data.url));
      setVideoOpen(true);
    } catch {
      setFreeErr("تعذّر الاتصال — حاول مرة أخرى");
    } finally {
      setFreeBusy(false);
    }
  };

  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <GeoBackdrop density={78} opacity={0.55} fade="top" />

      <div className="container grid items-center gap-14 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 text-center lg:order-1 lg:text-right"
        >
          {!isHidden(content, "hero.statusPill") && (
            <Pill className="mx-auto lg:mx-0 border-primary/30 bg-primary/10 text-primary">
              <SparkleStar className="size-3.5 text-primary" />
              <span style={textStyle(el(content, "hero.statusPill").text)}>{content.hero.statusPill}</span>
            </Pill>
          )}

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.6] [text-wrap:balance] sm:text-5xl sm:leading-[1.55] md:text-6xl md:leading-[1.5]">
            {t.headline}{" "}
            <span className="text-gradient">{t.subject}</span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-loose text-muted-foreground sm:text-lg lg:mx-0">
            {t.bio}
          </p>

          <motion.div initial="rest" whileHover="hover"
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            {!isHidden(content, "hero.primary") && (
              <Button as="a" href={content.cta?.registerUrl || "/register"} style={btnStyle(el(content, "hero.primary"))} className="w-full px-7 py-3.5 sm:w-auto">
                {content.cta?.heroPrimaryLabel || "أنشئ حساب طالب"} <SpringArrow />
              </Button>
            )}
            {!isHidden(content, "hero.secondary") && (
              <button onClick={watchFree} disabled={freeBusy} style={btnStyle(el(content, "hero.secondary"))}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3.5 text-sm font-bold transition hover:border-primary/50 hover:text-primary disabled:opacity-60">
                <IconPlay anim="bob" className="size-5" /> {freeBusy ? "جارٍ التحميل…" : (content.cta?.secondaryLabel || "شاهد درساً مجانياً")}
              </button>
            )}
          </motion.div>

          {freeErr && (
            <p className="mt-3 inline-block rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500">{freeErr}</p>
          )}

          {t.ratingCount > 0 && (
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <div className="text-center sm:text-right">
                <Stars value={t.rating} />
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{t.rating}/5</span> من{" "}
                  <CountUp to={t.ratingCount} suffix="+" /> طالب علم
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* الإطار + الصورة */}
        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <HeroFrame frame={content.hero.frame ?? 1} avatar={t.avatar} alt={t.name} img={content.hero.image} />
            </motion.div>

            {t.topStudents > 0 && (
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="glass absolute -right-3 top-10 z-20 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-bento sm:-right-6">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-400/15 text-amber-500"><IconTrophy anim="pop" className="size-5" /></span>
                <div className="leading-tight">
                  <p className="font-display text-lg font-extrabold">+<CountUp to={t.topStudents} /></p>
                  <p className="text-[11px] text-muted-foreground">من المتفوّقين</p>
                </div>
              </motion.div>
            )}

            {t.rating > 0 && (
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="glass absolute -left-3 bottom-14 z-20 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-bento sm:-left-6">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><SparkleStar className="size-5" /></span>
                <div className="leading-tight">
                  <p className="font-display text-lg font-extrabold">{t.rating}/5</p>
                  <p className="text-[11px] text-muted-foreground">تقييم الطلاب</p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>

      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} src={freeSrc} />
    </section>
  );
}
