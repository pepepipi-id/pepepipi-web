'use client'

import { buildWaLink } from '../../lib/wa'

const VARIANTS = {
  aktivitas: {
    cardClass: 'bg-card-blue border border-card-blue',
    imgBorderClass: 'border-card-blue',
    badgeClass: 'bg-[#BDE2F7] text-[#0c447c] rounded-md uppercase tracking-wide text-[8px] md:text-[10px] font-bold px-1.5 md:px-2.5 py-0.5 md:py-1',
    badgePrefix: '',
    ctaHoverClass: 'hover:bg-[#4a96c3]',
    buildMessage: (item) => 'Halo Pepepipi, saya tertarik untuk memesan produk Aktivitas: Beli ' + item.nama_produk,
  },
  hampers: {
    cardClass: 'bg-card-orange border border-card-orange',
    imgBorderClass: 'border-card-orange',
    badgeClass: 'bg-orange-100 text-orange-600 rounded-full text-[8px] md:text-[12px] px-1.5 md:px-2 py-0.5 font-semibold',
    badgePrefix: '🔥 ',
    ctaHoverClass: 'hover:bg-[#4188b2]',
    buildMessage: (item) => 'Halo Pepepipi, saya tertarik untuk memesan produk Hampers:  ' + item.nama_produk + ' yang ada di website.',
  },
}

export default function ProductCard({ item, variant = 'aktivitas' }) {
  const cfg = VARIANTS[variant] || VARIANTS.aktivitas

  return (
    <div className={`${cfg.cardClass} relative rounded-2xl p-2 md:p-5 shadow-xs hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between`}>
      {item.is_active === false && (
        <span className="absolute top-1 right-1 md:top-2 md:right-2 z-10 bg-amber-400 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
          📝 Draft
        </span>
      )}
      <div>
        <div className={`w-full aspect-[1/1] bg-white rounded-xl overflow-hidden mb-2 md:mb-4 border ${cfg.imgBorderClass}`}>
          <img src={item.foto_url} loading="lazy" className="w-full h-full object-cover" alt={item.nama_produk} />
        </div>

        <h3 className="font-bold text-[10px] md:text-base text-[#1e293b] mb-1.5 md:mb-2 leading-snug line-clamp-2 min-h-[28px] md:min-h-[46px]">
          {item.nama_produk}
        </h3>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-2 md:mb-4">
          <span className={`${cfg.badgeClass} w-fit`}>
            {cfg.badgePrefix}Terjual {item.label_terjual}+
          </span>
          <span className="text-[9px] md:text-xs font-bold text-[#d97706]">
            Rp {Number(item.harga).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      <a
        href={buildWaLink(cfg.buildMessage(item))}
        target="_blank"
        rel="noreferrer"
        className={`block w-full text-center bg-[#5CA7D4] text-white text-[10px] md:text-xs font-bold py-2 md:py-3 rounded-xl ${cfg.ctaHoverClass} transition-all`}
      >
        <span className="md:hidden">Pesan 💬</span>
        <span className="hidden md:inline">Pesan via WA 💬</span>
      </a>
    </div>
  )
}
