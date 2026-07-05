'use client'

import { buildWaLink } from '../lib/wa'

export default function CallToAction({ productContext = '' }) {
  const context = productContext ? `untuk *${productContext}*` : ''
  const waOrderLink = buildWaLink(
    `Halo Pepepipi! 👋\nAku mau order ${context}.\nBisa bantu aku pilih yang paling cocok?`
  )
  const waAskLink = buildWaLink(
    `Halo Pepepipi! 😊\nAku lagi lihat-lihat produknya dan ada beberapa pertanyaan nih. Boleh tanya-tanya dulu?`
  )

  return (
    <section className="max-w-2xl mx-auto my-10 rounded-[20px] overflow-hidden border-[1.5px] border-card-blue bg-gradient-to-br from-[#FFF4EA] to-[var(--color-bg-blue-card)] shadow-[0_4px_24px_rgba(92,167,212,0.08)]">
      <div className="h-[5px] bg-gradient-to-r from-[#FFC89A] via-[var(--color-brand-blue)] to-[var(--color-border-blue-card)]"></div>

      <div className="px-8 py-10 text-center">
        <p className="text-xs font-semibold tracking-[0.08em] uppercase text-brand-blue mb-2">
          Mau Custom atau Masih bingung mau pilih apa?
        </p>
        <h2 className="text-[1.4rem] sm:text-[1.9rem] font-extrabold text-main-dark mb-3 leading-tight">
          Yuk, ngobrol dulu sama kami 🤍
        </h2>
        <p className="text-[0.95rem] text-main-muted leading-relaxed max-w-md mx-auto mb-8">
          Kami bantu kamu pilih hampers atau produk aktifitas yang pas — tinggal cerita aja anaknya umur berapa dan buat acara apa.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-5">
          <a
            href={waOrderLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-primary-pastel font-bold text-[0.95rem] px-6 py-3 rounded-xl shadow-[0_4px_12px_rgba(92,167,212,0.3)] hover:-translate-y-0.5 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.345.223-.643.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            Mau Order Sekarang
          </a>

          <a
            href={waAskLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-brand-blue font-semibold text-[0.95rem] px-6 py-3 rounded-xl border-[1.5px] border-[var(--color-brand-blue)] hover:bg-[var(--color-bg-blue-card)] transition-all"
          >
            Tanya-tanya Dulu
          </a>
        </div>

        <p className="text-xs text-main-muted">✨ Kami balas secepatnya dalam jam kerja ya </p>
      </div>
    </section>
  )
}
