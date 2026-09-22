import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — mndjournal",
  description: "Syarat dan ketentuan penggunaan layanan mndjournal.",
};

export default function TermsPage() {
  return (
    <div className="bg-[#141820]">
      <MarketingNav />
      <main>
        <LegalPage title="Syarat & Ketentuan" updated="21 September 2026">
          <LegalSection heading="1. Tentang Layanan">
            <p>
              mndjournal ("kami", "layanan") adalah aplikasi jurnal trading yang membantu Anda
              mencatat, mengorganisir, dan menganalisa riwayat trading Anda di berbagai
              instrumen — saham, forex, futures, crypto, gold, dan lainnya. Dengan membuat akun
              atau menggunakan layanan ini, Anda setuju untuk terikat pada syarat dan ketentuan
              berikut.
            </p>
          </LegalSection>

          <LegalSection heading="2. Bukan Broker, Bukan Nasihat Investasi">
            <p>
              mndjournal <strong>bukan</strong> broker, bukan penyedia layanan keuangan, dan tidak
              mengeksekusi order trading apa pun. Layanan ini hanya mencatat dan menganalisa data
              yang Anda masukkan sendiri atau yang Anda impor dari broker Anda.
            </p>
            <p>
              Tidak ada bagian dari layanan ini — termasuk statistik, dashboard, kalender performa,
              maupun hasil AI reflection — yang merupakan nasihat investasi atau prediksi hasil
              trading di masa depan. Selalu verifikasi angka penting terhadap laporan resmi dari
              broker Anda. Keputusan trading sepenuhnya menjadi tanggung jawab Anda sendiri.
            </p>
          </LegalSection>

          <LegalSection heading="3. Akun Pengguna">
            <p>
              Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda (email/password atau
              akun Google yang terhubung) dan atas seluruh aktivitas yang terjadi di bawah akun
              Anda. Segera beri tahu kami bila Anda menduga terjadi akses tidak sah ke akun Anda.
            </p>
          </LegalSection>

          <LegalSection heading="4. Paket Berlangganan & Pembayaran">
            <p>
              mndjournal menyediakan paket gratis dan berbayar (Starter, Pro, dan Elite / Prop
              Trader) sebagaimana dijelaskan di halaman Harga. Harga ditagih secara bulanan dan
              dapat berubah sewaktu-waktu dengan pemberitahuan sebelumnya. Anda dapat membatalkan
              langganan kapan saja; pembatalan berlaku pada akhir periode penagihan berjalan.
            </p>
          </LegalSection>

          <LegalSection heading="5. Data Anda">
            <p>
              Data trading yang Anda masukkan tetap menjadi milik Anda. Kami menggunakan data
              tersebut hanya untuk menyediakan fungsi layanan (dashboard, analytics, AI reflection)
              sebagaimana dijelaskan dalam Kebijakan Privasi kami.
            </p>
          </LegalSection>

          <LegalSection heading="6. Batasan Tanggung Jawab">
            <p>
              Layanan disediakan "sebagaimana adanya" tanpa jaminan apa pun. Sepanjang diizinkan
              oleh hukum yang berlaku, mndjournal tidak bertanggung jawab atas kerugian trading,
              kehilangan data, atau kerugian tidak langsung lainnya yang timbul dari penggunaan
              layanan ini.
            </p>
          </LegalSection>

          <LegalSection heading="7. Perubahan Ketentuan">
            <p>
              Kami dapat memperbarui syarat dan ketentuan ini dari waktu ke waktu. Perubahan
              material akan diinformasikan melalui email atau notifikasi di dalam aplikasi.
            </p>
          </LegalSection>

          <LegalSection heading="8. Kontak">
            <p>
              Pertanyaan mengenai syarat dan ketentuan ini dapat dikirimkan ke{" "}
              <span className="text-white">halo@mndjournal.com</span>.
            </p>
          </LegalSection>
        </LegalPage>
      </main>
      <MarketingFooter />
    </div>
  );
}
