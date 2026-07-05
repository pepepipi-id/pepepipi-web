'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildWaLink } from '../lib/wa'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [requestName, setRequestName] = useState('')
  const [requestEmail, setRequestEmail] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setSubmitting(false)
    }
    // On success, the auth listener in AdminGate picks up the session change.
  }

  const requestAccessLink = buildWaLink(
    `Halo Pepepipi, saya ingin request akses admin untuk website.\nNama: ${requestName || '-'}\nEmail: ${requestEmail || '-'}`
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-[#5CA7D4] mb-1 text-center">🔒 Admin Pepepipi</h1>
        <p className="text-xs text-gray-500 mb-6 text-center">Masuk untuk mengelola konten website</p>

        {error && (
          <div className="p-3 rounded-xl mb-4 text-xs font-medium bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="admin@pepepipi.id"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#5CA7D4] hover:bg-[#4b96c2] text-white py-2.5 rounded-xl font-bold shadow-sm transition cursor-pointer text-center block disabled:opacity-50"
          >
            {submitting ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3 text-center">Belum punya akun? Request akses ke admin.</p>
          <div className="space-y-2 mb-3">
            <input
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              type="text"
              placeholder="Nama kamu"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5CA7D4]"
            />
            <input
              value={requestEmail}
              onChange={(e) => setRequestEmail(e.target.value)}
              type="email"
              placeholder="Email kamu"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5CA7D4]"
            />
          </div>
          <a
            href={requestAccessLink}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center bg-white border border-[#5CA7D4] text-[#5CA7D4] py-2.5 rounded-xl font-semibold text-sm hover:bg-[#F3F8FC] transition"
          >
            Request Akses via WhatsApp 💬
          </a>
        </div>
      </div>
    </div>
  )
}
