import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { FreeLive } from "@/components/sections/free-live";
import { Features } from "@/components/sections/features";
import { Plans } from "@/components/sections/plans";
import { Faq } from "@/components/sections/faq";
import { CtaFooter } from "@/components/sections/cta-footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      {/* بث مجاني مفتوح للجميع — يظهر فقط عند وجود جلسة مجانية */}
      <FreeLive />
      <Features />
      {/* الخطط بدل قائمة المواد — المواد لا تظهر للزائر على الصفحة الرئيسية */}
      <Plans />
      <Faq />
      <CtaFooter />
    </main>
  );
}
