import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PricingPageContent } from "@/components/marketing/pricing-page-content";
import { FinalCta } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  title: "Harga — mndjournal",
  description:
    "Perbandingan lengkap paket Starter, Pro, dan Elite — akun trading, playbooks, trade replay, AI reflection, dan prop-firm tracking.",
};

export default function PricingPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <PricingPageContent />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
