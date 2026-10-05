'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import Navbar from './Navbar'
import MainBanner from './MainBanner'
import ProductFavorit1 from './ProductFavorit1'
import ProductFavorit2 from './ProductFavorit2'
import ActivitySimulator from './ActivitySimulator'
import Testimoni from './Testimoni'
import CallToAction from './CallToAction'
import MainFooter from './MainFooter'
import StickyWaBar from './StickyWaBar'

// Ambil semua data beranda sekali, paralel, lalu oper ke tiap section
// (sebelumnya tiap section fetch ulang data yang sama).
async function fetchRows(label, query) {
  const { data, error } = await query
  if (error) console.error(`Error ${label}:`, error)
  return data || []
}

export default function HomeContent({ includeDrafts = false }) {
  const [aktivitas, setAktivitas] = useState([])
  const [hampers, setHampers] = useState([])
  const [testimoni, setTestimoni] = useState([])
  const [hasSimulator, setHasSimulator] = useState(true)

  useEffect(() => {
    let cancelled = false

    const withDrafts = (query) => (includeDrafts ? query : query.eq('is_active', true))
    const products = (kategori) =>
      withDrafts(supabase.from('products').select('*').eq('kategori', kategori).limit(3))

    async function load() {
      try {
        const [aktivitasRows, hampersRows, testimoniRows, simulatorRows] = await Promise.all([
          fetchRows('Aktivitas', products('Aktivitas')),
          fetchRows('Hampers', products('Hampers')),
          fetchRows('Testimoni', withDrafts(supabase.from('testimonials').select('*').limit(6))),
          fetchRows('Simulator', withDrafts(supabase.from('activity_ideas').select('id').limit(1))),
        ])
        if (cancelled) return
        setAktivitas(aktivitasRows)
        setHampers(hampersRows)
        setTestimoni(testimoniRows)
        setHasSimulator(simulatorRows.length > 0)
      } catch (error) {
        console.error('Gagal memuat data, tetapi web tetap aman tampil:', error)
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [includeDrafts])

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-800 antialiased font-sans pb-20 md:pb-0">
      <Navbar />
      <MainBanner />
      {hasSimulator && <ActivitySimulator includeDrafts={includeDrafts} />}
      {aktivitas.length > 0 && <ProductFavorit1 products={aktivitas} />}
      {hampers.length > 0 && <ProductFavorit2 products={hampers} />}
      {testimoni.length > 0 && <Testimoni testimonials={testimoni} />}
      <CallToAction />
      <MainFooter />
      <StickyWaBar />
    </div>
  )
}
