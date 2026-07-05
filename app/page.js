'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import Navbar from '../components/Navbar'
import MainBanner from '../components/MainBanner'
import ProductFavorit1 from '../components/ProductFavorit1'
import ProductFavorit2 from '../components/ProductFavorit2'
import ActivitySimulator from '../components/ActivitySimulator'
import Testimoni from '../components/Testimoni'
import CallToAction from '../components/CallToAction'
import MainFooter from '../components/MainFooter'
import StickyWaBar from '../components/StickyWaBar'

export default function Home() {
  const [hasAktivitas, setHasAktivitas] = useState(true)
  const [hasHampers, setHasHampers] = useState(true)
  const [hasTestimoni, setHasTestimoni] = useState(true)
  const [hasSimulator, setHasSimulator] = useState(true)

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
          console.error('Error Aktivitas:', errAktivitas)
        }

        setHasAktivitas(aktivitas && aktivitas.length > 0)

        const { data: hampers, error: errHampers } = await supabase
          .from('products')
          .select('*')
          .eq('kategori', 'Hampers')
          .eq('is_active', true)
          .limit(3)

        if (errHampers) {
          console.error('Error Hampers:', errHampers)
        }

        setHasHampers(hampers && hampers.length > 0)

        const { data: testimoni, error: errTestimoni } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .limit(6)

        if (errTestimoni) {
          console.error('Error Testimoni:', errTestimoni)
        }

        setHasTestimoni(testimoni && testimoni.length > 0)

        const { data: simulatorIdeas, error: errSimulator } = await supabase
          .from('activity_ideas')
          .select('id')
          .eq('is_active', true)
          .limit(1)

        if (errSimulator) {
          console.error('Error Simulator:', errSimulator)
        }

        setHasSimulator(simulatorIdeas && simulatorIdeas.length > 0)
      } catch (error) {
        console.error('Gagal memuat data, tetapi web tetap aman tampil:', error)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-800 antialiased font-sans pb-20 md:pb-0">
      <Navbar />
      <MainBanner />
      {hasSimulator && <ActivitySimulator />}
      {hasAktivitas && <ProductFavorit1 />}
      {hasHampers && <ProductFavorit2 />}
      {hasTestimoni && <Testimoni />}
      <CallToAction />
      <MainFooter />
      <StickyWaBar />
    </div>
  )
}
