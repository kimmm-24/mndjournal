import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — mndjournal",
  description: "Kebijakan privasi mndjournal: data apa yang kami kumpulkan dan bagaimana kami menyimpannya.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <LegalPage title="Kebijakan Privasi" updated="21 September 2026">
          <LegalSection heading="1. Data yang Kami Kumpulkan">
            <p>Kami mengumpulkan data berikut agar layanan dapat berfungsi:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <strong>Data akun</strong> — nama, alamat email, dan password terenkripsi (jika
                Anda mendaftar dengan email), atau nama dan email dasar dari akun Google Anda (jika
                Anda masuk dengan Google).
              </li>
              <li>
                <strong>Data trading</strong> — trade yang Anda catat manual, hasil import CSV atau
                sinkronisasi broker, catatan jurnal harian, tag setup, dan pengaturan akun trading
                yang Anda buat di dalam aplikasi.
              </li>
              <li>
                <strong>Data penggunaan teknis dasar</strong> — seperti log aplikasi untuk keperluan
                keamanan dan penanganan bug. Kami tidak menjalankan layanan analitik atau pelacakan
                pihak ketiga di dalam produk.
              </li>
            </ul>
          </LegalSection>

          <LegalSection heading="2. Bagaimana Kami Menggunakan Data Anda">
            <p>
              Data Anda digunakan semata-mata untuk menampilkan dashboard, analytics, kalender
              jurnal, dan (bila Anda mengaktifkannya) menghasilkan AI reflection atas sesi trading
              Anda. Jika Anda mengaktifkan fitur AI, ringkasan trade yang relevan dikirim ke
              penyedia AI (Anthropic atau OpenAI, sesuai pilihan Anda) semata-mata untuk
              menghasilkan review tersebut.
            </p>
          </LegalSection>

          <LegalSection heading="3. Penyimpanan Data">
            <p>
              Data disimpan dalam basis data pada infrastruktur hosting kami (di-hosting di
              Railway). Kredensial broker yang tersambung disimpan dalam bentuk terenkripsi.
              Kami tidak menjual data pribadi atau data trading Anda kepada pihak ketiga mana pun.
            </p>
          </LegalSection>

          <LegalSection heading="4. Berbagi Data">
            <p>
              Kami tidak membagikan data Anda kepada pihak ketiga untuk tujuan pemasaran. Data
              hanya diteruskan ke penyedia layanan pihak ketiga yang diperlukan agar fitur yang
              Anda aktifkan sendiri dapat berjalan (misalnya penyedia AI untuk fitur reflection,
              atau penyedia data pasar untuk fitur harga historis), dan hanya sebatas data yang
              relevan untuk fitur tersebut.
            </p>
          </LegalSection>

          <LegalSection heading="5. Keamanan">
            <p>
              Kami menerapkan langkah pengamanan yang wajar, termasuk enkripsi kredensial sensitif
              dan pemisahan data antar akun pengguna, untuk melindungi data Anda. Namun, tidak ada
              sistem yang sepenuhnya bebas risiko — Anda bertanggung jawab menjaga kerahasiaan
              password akun Anda.
            </p>
          </LegalSection>

          <LegalSection heading="6. Hak Anda">
            <p>
              Anda dapat meminta salinan data Anda atau meminta penghapusan akun beserta seluruh
              data trading Anda kapan saja dengan menghubungi{" "}
              <span className="text-white">halo@mndjournal.com</span>.
            </p>
          </LegalSection>

          <LegalSection heading="7. Perubahan Kebijakan">
            <p>
              Kebijakan privasi ini dapat diperbarui dari waktu ke waktu. Perubahan material akan
              diinformasikan melalui email atau notifikasi di dalam aplikasi.
            </p>
          </LegalSection>
        </LegalPage>
      </main>
      <MarketingFooter />
    </div>
  );
}
