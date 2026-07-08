'use client'

export default function TestimonialCard({ item }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-3 relative">
      {item.is_active === false && (
        <span className="absolute top-2 right-2 z-10 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
          📝 Draft
        </span>
      )}
      <div className="flex items-center gap-3">
        {item.foto_url && (
          <img src={item.foto_url} loading="lazy" className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt={item.nama_klien} />
        )}
        <h3 className="font-bold text-sm text-[#1e293b]">{item.nama_klien}</h3>
      </div>
      <p className="text-sm text-main-muted leading-relaxed">{item.isi_testimoni}</p>
    </div>
  )
}
