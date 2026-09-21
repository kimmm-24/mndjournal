import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Kontak — mndjournal",
  description: "Hubungi tim mndjournal untuk pertanyaan, masukan, atau bantuan.",
};

export default function ContactPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Hubungi Kami
          </h1>
          <p className="mt-3 text-[#9aa4b8]">
            Ada pertanyaan, masukan, atau butuh bantuan? Kirim pesan lewat form di bawah, atau
            email kami langsung.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#2a3245] bg-[#1c2230] px-4 py-3 text-sm text-[#c3cad9]">
            <Mail className="h-4 w-4 shrink-0 text-[#4d8dff]" />
            halo@mndjournal.com
          </div>

          <div className="mt-8 rounded-xl border border-[#2a3245] bg-[#1c2230] p-6">
            <ContactForm />
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
