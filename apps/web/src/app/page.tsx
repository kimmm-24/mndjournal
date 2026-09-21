import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Hero } from "@/components/marketing/hero";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { JournalMockup } from "@/components/marketing/journal-mockup";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCta } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  title: "mndjournal — Jurnal Trading Gold/XAU untuk Trader Indonesia",
  description:
    "Catat, analisa, dan tingkatkan performa trading XAU/USD Anda dengan journal, dashboard analytics, dan AI reflection yang dirancang khusus untuk trader gold harian di Indonesia.",
};

export default function LandingPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <Hero />
        <DashboardMockup />
        <FeaturesSection />
        <HowItWorks />
        <div className="bg-[#171c26] pb-20 sm:pb-24">
          <JournalMockup />
        </div>
        <PricingSection />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
