"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-sm text-[#c3cad9]">
        Terima kasih! Pesan Anda telah tercatat. Tim kami akan segera menghubungi Anda kembali.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div>
        <label htmlFor="contact-name" className="block text-xs font-medium text-[#9aa4b8]">
          Nama
        </label>
        <input
          id="contact-name"
          type="text"
          required
          placeholder="Nama Anda"
          className="mt-1.5 w-full rounded-lg border border-[#2a3245] bg-[#141820] px-3 py-2 text-sm text-white placeholder:text-[#5b6478] focus:border-[#4d8dff] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-xs font-medium text-[#9aa4b8]">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          placeholder="anda@email.com"
          className="mt-1.5 w-full rounded-lg border border-[#2a3245] bg-[#141820] px-3 py-2 text-sm text-white placeholder:text-[#5b6478] focus:border-[#4d8dff] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-xs font-medium text-[#9aa4b8]">
          Pesan
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          placeholder="Ceritakan pertanyaan atau masukan Anda..."
          className="mt-1.5 w-full resize-none rounded-lg border border-[#2a3245] bg-[#141820] px-3 py-2 text-sm text-white placeholder:text-[#5b6478] focus:border-[#4d8dff] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-[#4d8dff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3d7aef]"
      >
        Kirim Pesan
      </button>
    </form>
  );
}
