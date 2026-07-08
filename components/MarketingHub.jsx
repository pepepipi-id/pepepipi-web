'use client'

import Link from 'next/link'

const LIVE_TOOLS = [
  {
    href: '/marketing/simulator',
    bg: 'bg-[#FFC89A]',
    icon: '📊',
    title: 'Marketing Simulator v3',
    desc: 'Simulasikan AOV, Traffic, CR dan target Profit bedasar elastisitas market.',
  },
  {
    href: '/marketing/tier-voucher',
    bg: 'bg-[#BDE2F7]',
    icon: '🎟️',
    title: 'Tier Voucher Simulator',
    desc: 'Simulasikan ambang batas belanja minimum, nilai diskon voucher, dan validasi rasio margin secara real-time.',
  },
]

const PLACEHOLDER_TOOLS = [
  { icon: '🎯', title: 'Audience Segmentation AI', desc: 'Modul pembagi segmentasi perilaku pelanggan makro, kelompok retensi kohort, serta prediksi LTV (Lifetime Value).' },
  { icon: '✨', title: 'Campaign Budget Planner', desc: 'Perencanaan alokasi anggaran iklan digital lintas platform (Meta, Google, TikTok) terotomatisasi dengan kalkulator optimasi ROAS.' },
]

export default function MarketingHub() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <nav className="bg-white px-6 md:px-10 py-5 flex justify-between items-center border-b border-[#EAEAEA] shadow-sm">
        <Link href="/marketing" className="flex items-center gap-3">
          <div className="bg-[#BDE2F7] w-[38px] h-[38px] rounded-xl flex items-center justify-center text-lg">🧩</div>
          <span className="text-lg font-bold tracking-tight text-slate-800">Pepepipi Hub</span>
        </Link>
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#F3F8FC] rounded-full text-[13px] font-medium text-slate-500 border border-[#EAEAEA]">
          🧑 <span>Divisi Pemasaran</span>
        </div>
      </nav>

      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 py-14 flex-1">
        <section className="mb-14 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Workspace Aplikasi Pemasaran</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Selamat datang di pusat kendali Pepepipi. Jalankan simulasi, analisis performa unit ekonomi, dan optimalkan strategi pemasaran dari satu tempat terintegrasi.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Pilih Alat Analisis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {LIVE_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white rounded-xl p-7 border border-[#EAEAEA] shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-[#FFC89A] hover:shadow-lg"
              >
                <div>
                  <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center mb-5 text-xl transition-transform group-hover:scale-105 ${tool.bg}`}>{tool.icon}</div>
                  <div className="text-lg font-semibold text-slate-800 mb-1.5">{tool.title}</div>
                  <div className="text-[13px] text-slate-500 leading-relaxed mb-6">{tool.desc}</div>
                </div>
                <div className="flex items-center justify-between border-t border-[#EAEAEA] pt-4 text-[13px] font-semibold text-slate-800">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide bg-emerald-50 text-emerald-800">Siap Digunakan</span>
                  <span className="inline-flex items-center gap-1 group-hover:gap-2 transition-all group-hover:text-[#0B447C]">Buka Alat →</span>
                </div>
              </Link>
            ))}

            {PLACEHOLDER_TOOLS.map((tool) => (
              <div key={tool.title} className="bg-[#F3F8FC]/40 border-2 border-dashed border-[#EAEAEA] rounded-xl p-7 flex flex-col justify-between cursor-not-allowed">
                <div>
                  <div className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-5 text-xl bg-[#EAEAEA] text-slate-400">{tool.icon}</div>
                  <div className="text-lg font-semibold text-slate-500 mb-1.5">{tool.title}</div>
                  <div className="text-[13px] text-slate-500 leading-relaxed mb-6">{tool.desc}</div>
                </div>
                <div className="flex items-center justify-between border-t border-[#EAEAEA] pt-4 text-[13px] font-semibold">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide bg-slate-100 text-slate-500">Segera Hadir</span>
                  <span className="text-slate-400 text-xs">Dalam Pengembangan</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center py-8 border-t border-[#EAEAEA] bg-[#F3F8FC] mt-auto">
        <p className="text-xs text-slate-500">&copy; 2026 Pepepipi Ecosystem. Seluruh hak cipta dilindungi undang-undang. &bull; Dioptimalkan untuk Divisi Pemasaran.</p>
      </footer>
    </div>
  )
}
