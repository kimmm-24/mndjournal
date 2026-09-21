import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCta } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  title: "Harga — mndjournal",
  description: "Paket harga mndjournal: Starter, Pro, dan Elite / Prop Trader.",
};

export default function PricingPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <div className="pt-6" />
        <PricingSection />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
