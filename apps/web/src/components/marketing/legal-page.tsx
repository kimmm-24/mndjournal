export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#141820] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-[#7d879e]">Terakhir diperbarui: {updated}</p>

        <div className="mt-4 rounded-lg border border-[#f2c94c]/30 bg-[#f2c94c]/10 px-4 py-3 text-sm text-[#f2c94c]">
          Dokumen ini masih berupa draf awal untuk keperluan peluncuran dan belum ditinjau oleh
          penasihat hukum. Jangan jadikan sebagai nasihat hukum — konsultasikan dengan profesional
          sebelum digunakan secara resmi.
        </div>

        <div className="prose-legal mt-8 space-y-8 text-sm leading-relaxed text-[#c3cad9]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white">{heading}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
