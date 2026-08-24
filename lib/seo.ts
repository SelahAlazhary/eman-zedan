import type { SiteContent } from "./types";

/** Schema.org JSON-LD — Course + Person + FAQPage من المحتوى الحيّ. */
export function buildJsonLd(c: SiteContent) {
  const person = {
    "@type": "Person",
    name: c.teacher.name,
    jobTitle: `مدرّسة ${c.teacher.subject}`,
    description: c.teacher.bio,
  };
  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${c.teacher.subject} — ${c.brand}`,
    description: c.teacher.bio,
    provider: { "@type": "Organization", name: c.brand, sameAs: c.url },
    instructor: person,
    inLanguage: "ar",
    ...(c.teacher.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: c.teacher.rating,
            reviewCount: c.teacher.ratingCount,
            bestRating: 5,
          },
        }
      : {}),
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return [course, { "@context": "https://schema.org", ...person }, faqPage];
}
