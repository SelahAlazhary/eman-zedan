"use client";

/** قسم "لماذا نحن" — شبكة Bento من المحتوى الحيّ. */
import { motion } from "framer-motion";
import { SectionHeading, Reveal } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { FEATURE_ICONS, IconManuscript } from "@/components/brand/icons";
import { ArchTile, CornerKnot } from "@/components/brand/pattern";

export function Features() {
  const { content } = useContent();
  if (content.ui?.["section.features"]?.hidden) return null;
  return (
    <section id="features" className="relative py-24">
      <div className="container">
        <SectionHeading
          eyebrow="لماذا نحن"
          title={<>كل ما تحتاجه لدراسة <span className="text-gradient">العلوم الشرعية</span></>}
          desc="مناهج مرتّبة ومؤصّلة في كل مادة، مع ربط كل مسألة بدليلها."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon] ?? IconManuscript;
            return (
              <Reveal key={f.title} delay={i * 0.08} className={f.span}>
                <motion.article whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group glass relative h-full overflow-hidden rounded-4xl p-6 shadow-bento">
                  <CornerKnot size={64} className="pointer-events-none absolute right-0 top-0 text-primary/45 transition-opacity group-hover:opacity-80" />
                  <span className="relative mb-5 grid size-12 place-items-center text-primary">
                    <ArchTile size={48} className="absolute inset-0" />
                    <Icon anim="draw" className="relative size-6" />
                  </span>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary/80">{f.tag}</p>
                  <h3 className="font-display text-xl font-extrabold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
