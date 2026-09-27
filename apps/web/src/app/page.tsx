import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Hero } from "@/components/marketing/hero";
import { HeroVideo } from "@/components/marketing/hero-video";
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
  // Link previews need an absolute image URL; the site's public origin is BETTER_AUTH_URL.
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "https://www.mndjournal.com"),
  openGraph: {
    images: [
      {
        url: "/media/mndjournal-hero-dark-still.jpg",
        width: 1920,
        height: 1080,
        alt: "Dashboard mndjournal: Net P&L, win rate, profit factor dan grafik P&L kumulatif",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/media/mndjournal-hero-dark-still.jpg"] },
};

export default function LandingPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <Hero />
        <HeroVideo />
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
