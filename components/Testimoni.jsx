'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Testimoni() {
  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .limit(6)

        if (error) {
          console.error('Error Testimoni:', error)
          return
        }
        setTestimonials(data || [])
      } catch (error) {
        console.error('Gagal memuat testimoni, tetapi web tetap aman tampil:', error)
      }
    }
    load()
  }, [])

  if (testimonials.length === 0) return null

  return (
    <section id="testimoni" className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">
          Apa Kata Bunda Lainnya
        </h2>
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-1">
          💬 Cerita dari Pelanggan Pepepipi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              {item.foto_url && (
                <img src={item.foto_url} loading="lazy" className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt={item.nama_klien} />
              )}
              <h3 className="font-bold text-sm text-[#1e293b]">{item.nama_klien}</h3>
            </div>
            <p className="text-sm text-main-muted leading-relaxed">{item.isi_testimoni}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
