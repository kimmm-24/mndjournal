import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Hero } from "@/components/marketing/hero";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";
import { FeaturesSection } from "@/components/marketing/features-section";
import { AutomatedJournaling } from "@/components/marketing/automated-journaling";
import { AnalyticsSpotlight } from "@/components/marketing/analytics-spotlight";
import { PlaybooksSpotlight } from "@/components/marketing/playbooks-spotlight";
import { ReplaySpotlight } from "@/components/marketing/replay-spotlight";
import { AiSpotlight } from "@/components/marketing/ai-spotlight";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { FinalCta } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  title: "mndjournal — Jurnal Trading untuk Semua Jenis Trader Indonesia",
  description:
    "Catat, analisa, dan tingkatkan performa trading Anda — saham, forex, futures, crypto, gold, dan lainnya — dengan journal, dashboard analytics, dan AI reflection yang dirancang untuk trader Indonesia.",
};

export default function LandingPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <Hero />
        <DashboardMockup />
        <FeaturesSection />
        <AutomatedJournaling />
        <AnalyticsSpotlight />
        <PlaybooksSpotlight />
        <ReplaySpotlight />
        <AiSpotlight />
        <PricingTeaser />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
