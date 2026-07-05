'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildWaLink } from '../lib/wa'

export default function ProductFavorit1() {
  const [products, setProducts] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: aktivitas, error: errAktivitas } = await supabase
          .from('products')
          .select('*')
          .eq('kategori', 'Aktivitas')
          .eq('is_active', true)
          .limit(3)

        if (errAktivitas) {
          console.error('Terjadi error pada fetch aktivitas:', errAktivitas)
        }
        setProducts(aktivitas || [])
      } catch (error) {
        console.error('Gagal memuat data, tetapi web tetap aman tampil:', error)
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [])

  return (
    <section id="activities" className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">
          Aktivitas Anak Paling Seru
        </h2>
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-1">
          🔥 Paling Banyak Dicari Pekan Ini
        </p>
      </div>

      {loaded && products.length === 0 ? (
        <div className="bg-card-blue border border-card-blue rounded-2xl p-8 text-center text-sm text-main-muted">
          Belum ada produk aktivitas saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-card-blue border border-card-blue rounded-2xl p-2 md:p-5 shadow-xs hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-full aspect-[1/1] bg-white rounded-xl overflow-hidden mb-2 md:mb-4 border border-card-blue">
                  <img src={item.foto_url} loading="lazy" className="w-full h-full object-cover" alt={item.nama_produk} />
                </div>

                <h3 className="font-bold text-[10px] md:text-base text-[#1e293b] mb-1.5 md:mb-2 leading-snug line-clamp-2 min-h-[28px] md:min-h-[46px]">
                  {item.nama_produk}
                </h3>
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-2 md:mb-4">
                  <span className="bg-[#BDE2F7] text-[#0c447c] text-[8px] md:text-[10px] font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md uppercase tracking-wide w-fit">
                    Terjual {item.label_terjual}+
                  </span>
                  <span className="text-[9px] md:text-xs font-bold text-[#d97706]">
                    Rp {item.harga.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <a
                href={buildWaLink('Halo Pepepipi, saya tertarik untuk memesan produk Aktivitas: Beli ' + item.nama_produk)}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-[#5CA7D4] text-white text-[10px] md:text-xs font-bold py-2 md:py-3 rounded-xl hover:bg-[#4a96c3] transition-all"
              >
                <span className="md:hidden">Pesan 💬</span>
                <span className="hidden md:inline">Pesan via WA 💬</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
