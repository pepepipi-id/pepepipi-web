'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildWaLink } from '../lib/wa'
import ActivityResultCard from './cards/ActivityResultCard'

export default function ActivitySimulator({ includeDrafts = false }) {
  const [filter, setFilter] = useState({
    usia: '5 Tahun',
    durasi: '20 Menit',
    lokasi: 'Dalam Rumah',
  })
  const [hasilIde, setHasilIde] = useState(null)
  const [bahanBaku, setBahanBaku] = useState([])

  async function cariIde() {
    let query = supabase
      .from('activity_ideas')
      .select('*')
      .eq('usia', filter.usia)
      .eq('durasi', filter.durasi)
      .eq('lokasi', filter.lokasi)

    if (!includeDrafts) query = query.eq('is_active', true)

    const { data: ide } = await query.maybeSingle()

    setHasilIde(ide)

    if (ide) {
      const { data: bahan } = await supabase
        .from('activity_materials')
        .select('*')
        .eq('activity_id', ide.id)
      setBahanBaku(bahan || [])
    } else {
      setBahanBaku([])
      alert('Ide belum tersedia untuk kombinasi filter ini.')
    }
  }

  const generateWaLink = () => {
    if (!hasilIde) return '#'
    const templateTeks = `Halo Pepepipi, saya mau pesan paket bahan untuk aktivitas "${hasilIde.judul_aktivitas}" (${filter.usia}).`
    return buildWaLink(templateTeks)
  }

  return (
    <section id="simulator" className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-[#BDE2F7] shadow-xs">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFC89A] p-2.5 rounded-xl text-[#0c447c]">
                🔍
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Bingung Main Apa?</h2>
                <p className="text-xs text-slate-500">Temukan ide aktivitas si kecil.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Usia Anak</label>
                <select
                  value={filter.usia}
                  onChange={(e) => setFilter({ ...filter, usia: e.target.value })}
                  className="w-full bg-[#F3F8FC] border border-[#BDE2F7] rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#d97706]"
                >
                  <option value="3 Tahun">3 Tahun</option>
                  <option value="5 Tahun">5 Tahun</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Durasi</label>
                <select
                  value={filter.durasi}
                  onChange={(e) => setFilter({ ...filter, durasi: e.target.value })}
                  className="w-full bg-[#F3F8FC] border border-[#BDE2F7] rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#d97706]"
                >
                  <option value="20 Menit">20 Menit</option>
                  <option value="45 Menit">45 Menit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Lokasi</label>
                <select
                  value={filter.lokasi}
                  onChange={(e) => setFilter({ ...filter, lokasi: e.target.value })}
                  className="w-full bg-[#F3F8FC] border border-[#BDE2F7] rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#d97706]"
                >
                  <option value="Dalam Rumah">Dalam Rumah</option>
                  <option value="Luar Rumah">Luar Rumah</option>
                </select>
              </div>
            </div>

            <button onClick={cariIde} className="w-full bg-[#5CA7D4] text-white font-bold py-3.5 rounded-2xl hover:bg-[#4a96c3] shadow-xs transition-all flex justify-center items-center gap-2">
              <span>Cari Ide Aktivitas</span> 🚀
            </button>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📍 Rekomendasi Ide</p>
            {hasilIde ? (
              <ActivityResultCard idea={hasilIde} />
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
                Pilih filter di kiri lalu klik Cari Ide
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🛍️ Produk yang Dibutuhkan</p>
            {hasilIde && bahanBaku.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {bahanBaku.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-2 text-center shadow-xs">
                      <div className="w-full h-14 bg-slate-50 rounded-lg mb-1 flex items-center justify-center overflow-hidden">
                        <img src={item.foto_url} className="object-cover max-h-full max-w-full" alt={item.nama_barang} />
                      </div>
                      <p className="text-[10px] font-medium text-slate-700 truncate">{item.nama_barang}</p>
                      <p className="text-[9px] text-[#d97706] font-bold">Rp {item.harga.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>

                <a href={generateWaLink()} target="_blank" rel="noreferrer" className="block w-full text-center bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-emerald-700 shadow-xs transition-all">
                  Beli Paket Bahan via WA 💬
                </a>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
                Bahan produk akan muncul setelah ide ditemukan
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  )
}
