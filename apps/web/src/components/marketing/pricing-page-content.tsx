"use client";

import { useState } from "react";
import { PricingCards } from "./pricing-cards";
import { ComparisonTable } from "./comparison-table";
import { TRIAL_DAYS } from "@/lib/plan";

export function PricingPageContent() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Harga</h1>
        <p className="mt-3 text-[#9aa4b8]">
          Coba gratis {TRIAL_DAYS} hari dengan fitur Pro, lalu pilih paket. Semua paket termasuk
          dashboard analytics lengkap — bedanya ada di akun trading, playbooks, trade replay, AI
          reflection, dan prop-firm tracking.
        </p>

        <div className="mx-auto mt-7 inline-flex items-center gap-1 rounded-lg border border-[#2a3245] bg-[#1c2230] p-1">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              billing === "monthly" ? "bg-[#4d8dff] text-white" : "text-[#9aa4b8] hover:text-white"
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              billing === "yearly" ? "bg-[#4d8dff] text-white" : "text-[#9aa4b8] hover:text-white"
            }`}
          >
            Tahunan
          </button>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <PricingCards billing={billing} />
      </div>

      <div className="mx-auto mt-20 max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Perbandingan lengkap
        </h2>
        <p className="mt-2 text-center text-sm text-[#9aa4b8]">
          Setiap baris di bawah ini mencerminkan akses yang benar-benar diterapkan di aplikasi —
          bukan janji marketing.
        </p>
        <div className="mt-8">
          <ComparisonTable />
        </div>
      </div>
    </div>
  );
}
