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

export default function HomeContent({ includeDrafts = false }) {
  const [hasAktivitas, setHasAktivitas] = useState(true)
  const [hasHampers, setHasHampers] = useState(true)
  const [hasTestimoni, setHasTestimoni] = useState(true)
  const [hasSimulator, setHasSimulator] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        let aktivitasQuery = supabase.from('products').select('*').eq('kategori', 'Aktivitas').limit(3)
        if (!includeDrafts) aktivitasQuery = aktivitasQuery.eq('is_active', true)
        const { data: aktivitas, error: errAktivitas } = await aktivitasQuery

        if (errAktivitas) {
          console.error('Error Aktivitas:', errAktivitas)
        }

        setHasAktivitas(aktivitas && aktivitas.length > 0)

        let hampersQuery = supabase.from('products').select('*').eq('kategori', 'Hampers').limit(3)
        if (!includeDrafts) hampersQuery = hampersQuery.eq('is_active', true)
        const { data: hampers, error: errHampers } = await hampersQuery

        if (errHampers) {
          console.error('Error Hampers:', errHampers)
        }

        setHasHampers(hampers && hampers.length > 0)

        let testimoniQuery = supabase.from('testimonials').select('*').limit(6)
        if (!includeDrafts) testimoniQuery = testimoniQuery.eq('is_active', true)
        const { data: testimoni, error: errTestimoni } = await testimoniQuery

        if (errTestimoni) {
          console.error('Error Testimoni:', errTestimoni)
        }

        setHasTestimoni(testimoni && testimoni.length > 0)

        let simulatorQuery = supabase.from('activity_ideas').select('id').limit(1)
        if (!includeDrafts) simulatorQuery = simulatorQuery.eq('is_active', true)
        const { data: simulatorIdeas, error: errSimulator } = await simulatorQuery

        if (errSimulator) {
          console.error('Error Simulator:', errSimulator)
        }

        setHasSimulator(simulatorIdeas && simulatorIdeas.length > 0)
      } catch (error) {
        console.error('Gagal memuat data, tetapi web tetap aman tampil:', error)
      }
    }
    load()
  }, [includeDrafts])

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-800 antialiased font-sans pb-20 md:pb-0">
      <Navbar />
      <MainBanner />
      {hasSimulator && <ActivitySimulator includeDrafts={includeDrafts} />}
      {hasAktivitas && <ProductFavorit1 includeDrafts={includeDrafts} />}
      {hasHampers && <ProductFavorit2 includeDrafts={includeDrafts} />}
      {hasTestimoni && <Testimoni includeDrafts={includeDrafts} />}
      <CallToAction />
      <MainFooter />
      <StickyWaBar />
    </div>
  )
}
