'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from './cards/ProductCard'

export default function ProductFavorit2({ includeDrafts = false }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    async function load() {
      let query = supabase
        .from('products')
        .select('*')
        .eq('kategori', 'Hampers')
        .limit(3)

      if (!includeDrafts) query = query.eq('is_active', true)

      const { data } = await query

      setProducts(data || [])
    }
    load()
  }, [includeDrafts])

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

      {products.length === 0 ? (
        <div className="bg-card-orange border border-card-orange rounded-2xl p-8 text-center text-sm text-main-muted">
          Belum ada produk hampers saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          {products.map((item) => (
            <ProductCard key={item.id} item={item} variant="hampers" />
          ))}
        </div>
      )}
    </section>
  )
}
