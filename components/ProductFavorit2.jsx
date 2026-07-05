'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildWaLink } from '../lib/wa'

const MOCK_PRODUCTS = [
  { id: 1, nama_produk: 'Hampers Custom Baby Born Box (Pastel Edition)', harga: 249000, foto_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500', label_terjual: '1.5 Juta' },
  { id: 2, nama_produk: 'Premium Kids Birthday Gift Set A', harga: 175000, foto_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=500', label_terjual: '800' },
  { id: 3, nama_produk: 'Paket Hampers Hari Raya & Syukuran Keluarga', harga: 320000, foto_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500', label_terjual: '2.1 Juta' },
]

export default function ProductFavorit2() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('kategori', 'Hampers')
        .eq('is_active', true)
        .limit(3)

      setProducts(data && data.length > 0 ? data : MOCK_PRODUCTS)
    }
    load()
  }, [])

  return (
    <section id="hampers" className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">
          Hampers Terfavorit Pilihan Bunda
        </h2>
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-1">
          ✨ Bingkisan Premium untuk Momen Spesial
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-6">
        {products.map((item) => (
          <div
            key={item.id}
            className="bg-card-orange border border-card-orange rounded-2xl p-2 md:p-5 shadow-xs hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-full aspect-[1/1] bg-white rounded-xl overflow-hidden mb-2 md:mb-4 border border-card-orange">
                <img src={item.foto_url} loading="lazy" className="w-full h-full object-cover" alt={item.nama_produk} />
              </div>

              <h3 className="font-bold text-[10px] md:text-base text-[#1e293b] mb-1.5 md:mb-2 leading-snug line-clamp-2 min-h-[28px] md:min-h-[46px]">
                {item.nama_produk}
              </h3>
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-2 md:mb-4">
                <span className="text-[8px] md:text-[12px] px-1.5 md:px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold w-fit">
                  🔥 Terjual {item.label_terjual}+
                </span>
                <span className="text-[9px] md:text-xs font-bold text-[#d97706]">
                  Rp {item.harga.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <a
              href={buildWaLink('Halo Pepepipi, saya tertarik untuk memesan produk Hampers:  ' + item.nama_produk + ' yang ada di website.')}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-[#5CA7D4] text-white text-[10px] md:text-s font-bold py-2 md:py-3 rounded-xl hover:bg-[#4188b2] transition-all"
            >
              <span className="md:hidden">Pesan 💬</span>
              <span className="hidden md:inline">Pesan via WA 💬</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
