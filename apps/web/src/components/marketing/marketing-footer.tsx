import Link from "next/link";
import Image from "next/image";

const COLUMN_LINKS = [
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/pricing", label: "Harga" },
  { href: "/contact", label: "Kontak" },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[#2a3245] bg-[#141820]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="mndjournal" width={262} height={238} className="h-8 w-auto" />
              <span className="text-sm font-semibold tracking-tight text-white">mndjournal</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-[#7d879e]">
              Jurnal trading untuk trader XAU/USD (Gold) harian di Indonesia — catat, analisa, dan
              perbaiki strategi Anda dengan data.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#7d879e]">
              Navigasi
            </div>
            <ul className="mt-3 space-y-2.5">
              {COLUMN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#9aa4b8] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#7d879e]">
              Kontak
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-[#9aa4b8]">
              <li>halo@mndjournal.com</li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#2a3245] pt-6 text-xs text-[#6b7590]">
          © {year} mndjournal. Hak cipta dilindungi. mndjournal bukan broker dan tidak memberikan
          nasihat investasi.
        </div>
      </div>
    </footer>
  );
}
