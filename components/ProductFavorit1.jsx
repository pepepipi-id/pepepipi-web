'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from './cards/ProductCard'

export default function ProductFavorit1({ includeDrafts = false }) {
  const [products, setProducts] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('kategori', 'Aktivitas')
          .limit(3)

        if (!includeDrafts) query = query.eq('is_active', true)

        const { data: aktivitas, error: errAktivitas } = await query

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
  }, [includeDrafts])

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
            <ProductCard key={item.id} item={item} variant="aktivitas" />
          ))}
        </div>
      )}
    </section>
  )
}
