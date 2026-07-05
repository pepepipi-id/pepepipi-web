'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminLogin from './AdminLogin'
import AdminPanel from './AdminPanel'

export default function AdminGate() {
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
    return <AdminLogin />
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-6 flex items-center justify-between text-sm">
        <span className="text-gray-500">Masuk sebagai <span className="font-semibold text-gray-700">{session.user.email}</span></span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-red-500 hover:text-red-600 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>
      <AdminPanel />
    </div>
  )
}
