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
  title: "mndjournal — AI Trading Journal untuk Trader Indonesia",
  description:
    "AI yang membaca data trading Anda sendiri: recap harian, review tiap trade, dan tanya jawab dari histori Anda. Lengkap dengan journal dan dashboard analytics untuk saham, forex, futures, crypto, gold, dan lainnya.",
};

export default function LandingPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <Hero />
        <DashboardMockup />
        <AiSpotlight />
        <FeaturesSection />
        <AutomatedJournaling />
        <AnalyticsSpotlight />
        <PlaybooksSpotlight />
        <ReplaySpotlight />
        <PricingTeaser />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
