"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/#fitur", label: "Fitur" },
  { href: "/pricing", label: "Harga" },
  { href: "/contact", label: "Kontak" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#2a3245] bg-[#141820]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="mndjournal" width={262} height={238} className="h-8 w-auto" priority />
          <span className="text-sm font-semibold tracking-tight text-white">mndjournal</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#9aa4b8] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link href="/login" className="text-sm text-[#9aa4b8] transition-colors hover:text-white">
            Masuk
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#4d8dff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3d7aef]"
          >
            Daftar Gratis
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="text-white md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#2a3245] px-4 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-[#9aa4b8] transition-colors hover:bg-[#1c2230] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-[#2a3245]" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm text-[#9aa4b8] hover:bg-[#1c2230] hover:text-white"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-[#4d8dff] px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-[#3d7aef]"
            >
              Daftar Gratis
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
