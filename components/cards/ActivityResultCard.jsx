'use client'

export default function ActivityResultCard({ idea }) {
  return (
    <div className="bg-[#F3F8FC] border border-[#BDE2F7] rounded-2xl p-4 shadow-xs relative">
      {idea.is_active === false && (
        <span className="absolute top-2 right-2 z-10 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
          📝 Draft
        </span>
      )}
      <img src={idea.foto_aktivitas} className="w-full h-44 object-cover rounded-xl mb-4" alt={idea.judul_aktivitas} />
      <h3 className="font-bold text-base text-slate-800 mb-2">{idea.judul_aktivitas}</h3>
      <div className="space-y-1 text-xs text-slate-500 mb-4">
        <p>⏱️ {idea.durasi}</p>
        <p>🏠 {idea.lokasi}</p>
      </div>
      <button className="w-full border border-[#FFC89A] text-[#633806] font-medium py-2 rounded-xl text-sm bg-[#faeeda] hover:bg-[#FFC89A]/40">
        Lihat Detail
      </button>
    </div>
  )
}
