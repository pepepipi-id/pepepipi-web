'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminLogin from './AdminLogin'
import HomeContent from './HomeContent'

export default function PreviewGate() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div className="min-h-screen" />
  }

  if (!session) {
    return (
      <div className="bg-[#FAFAF8] text-gray-800 antialiased min-h-screen py-10 px-4">
        <AdminLogin />
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-[70] bg-amber-400 text-amber-950 text-xs md:text-sm font-bold px-4 py-2 flex items-center justify-between gap-3">
        <span>🔍 Mode Pratinjau — konten draf ikut tampil di sini, tidak untuk pengunjung publik.</span>
        <a href="/admin" className="underline whitespace-nowrap hover:text-amber-800">← Kembali ke Admin</a>
      </div>
      <HomeContent includeDrafts={true} />
    </div>
  )
}
