const STEPS = [
  {
    number: "01",
    title: "Daftar Akun",
    body: "Buat akun gratis dalam hitungan detik — dengan email atau akun Google, tanpa kartu kredit.",
  },
  {
    number: "02",
    title: "Catat Tiap Trade",
    body: "Input trade secara manual atau import dari broker/CSV — semua data trading Gold Anda tersimpan rapi di satu tempat.",
  },
  {
    number: "03",
    title: "Analisa Performa & Perbaiki Strategi",
    body: "Lihat pola performa Anda lewat dashboard dan AI reflection, lalu sempurnakan strategi trading Anda.",
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-16 bg-[#171c26] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Cara Kerja</h2>
          <p className="mt-3 text-[#9aa4b8]">Mulai dalam tiga langkah sederhana.</p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step) => (
            <div key={step.number}>
              <div className="text-3xl font-bold text-[#4d8dff]">{step.number}</div>
              <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9aa4b8]">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
