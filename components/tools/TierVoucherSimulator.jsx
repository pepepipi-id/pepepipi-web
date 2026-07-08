'use client'

import { useMemo, useState } from 'react'
import { formatRupiahString } from '../lib/format'

// Data struktur default berbasis database "Targeted Margin - PPIP"
const DEFAULT_TIERS = [
  { id: 1, name: 'Tier 1', hint: 'Paling mudah dicapai (Ambang batas AOV minimum)', nominal: 10000, voucher: 200, defaultBarColor: '#BDE2F7' },
  { id: 2, name: 'Tier 2', hint: 'Sekitar rata-rata transaksi (AOV berjalan)', nominal: 16000, voucher: 500, defaultBarColor: '#FFC89A' },
  { id: 3, name: 'Tier 3', hint: 'Akselerator kenaikan keranjang (Push target penjualan)', nominal: 30000, voucher: 1200, defaultBarColor: '#FFD1E6' },
  { id: 4, name: 'Tier 4', hint: 'Bulk Whale Khusus (Tarik volume transaksi besar)', nominal: 150000, voucher: 7500, defaultBarColor: '#A7C7E7' },
]

const DANGER_COLOR = '#FFB3A7'

// Card tint per tier index, mirroring the original .tier-card-N pastel backgrounds
const TIER_CARD_TINT = [
  'bg-[#BDE2F7]/10 border-[#BDE2F7]',
  'bg-[#FFC89A]/10 border-[#FFC89A]',
  'bg-[#FFD1E6]/10 border-[#FFD1E6]',
  'bg-[#A7C7E7]/10 border-[#A7C7E7]',
]

export default function TierVoucherSimulator() {
  const [tiers, setTiers] = useState(() => JSON.parse(JSON.stringify(DEFAULT_TIERS)))

  // 1. Hitung seluruh nilai persentase (diskon rasio) tiap tier
  const computedPercentages = useMemo(
    () => tiers.map((tier) => (tier.nominal > 0 ? (tier.voucher / tier.nominal) * 100 : 0)),
    [tiers]
  )

  // 2. Pengecekan kepatuhan aturan bisnis (Tier N harus >= Tier N-1)
  const { overallValid, tierErrorFlags } = useMemo(() => {
    let valid = true
    const flags = tiers.map(() => false)
    for (let i = 1; i < computedPercentages.length; i++) {
      if (computedPercentages[i] < computedPercentages[i - 1]) {
        valid = false
        flags[i] = true
      }
    }
    return { overallValid: valid, tierErrorFlags: flags }
  }, [computedPercentages, tiers])

  function handleInputChange(index, field, rawInputValue) {
    let rawValue = rawInputValue.replace(/\D/g, '')
    if (rawValue === '') rawValue = '0'
    const parsed = parseInt(rawValue, 10)

    setTiers((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: parsed }
      return next
    })
  }

  function resetToDefault() {
    setTiers(JSON.parse(JSON.stringify(DEFAULT_TIERS)))
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800">🎟️ Tier Voucher Margin Simulator</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Atur konfigurasi ambang batas nominal belanja dan nilai voucher pemasaran di sini. Sistem akan otomatis
          memvalidasi keharmonisan skema bergradasi agar benefit pembeli tetap terjaga.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Konfigurasi Aturan Tier</h2>
              <button
                type="button"
                onClick={resetToDefault}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                🔄 Reset ke Default
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {tiers.map((tier, index) => {
                const pct = computedPercentages[index]
                const hasError = tierErrorFlags[index]
                return (
                  <div
                    key={tier.id}
                    className={`rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1.5fr_1.2fr] gap-4 items-center transition ${
                      hasError ? 'border-red-300 bg-red-50/40' : TIER_CARD_TINT[index % TIER_CARD_TINT.length]
                    }`}
                  >
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">{tier.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{tier.hint}</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">Nominal Belanja</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-sm font-semibold text-gray-400">Rp</span>
                        <input
                          type="text"
                          value={formatRupiahString(tier.nominal)}
                          onChange={(e) => handleInputChange(index, 'nominal', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4] text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">Nilai Voucher</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-sm font-semibold text-gray-400">Rp</span>
                        <input
                          type="text"
                          value={formatRupiahString(tier.voucher)}
                          onChange={(e) => handleInputChange(index, 'voucher', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4] text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end justify-center">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Diskon Rasio</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {hasError && <span>⚠️</span>}
                        <span className={`text-lg font-bold ${hasError ? 'text-red-600' : 'text-gray-800'}`}>
                          {pct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {overallValid ? (
            <div className="flex gap-3 items-start p-5 rounded-2xl border border-green-200 bg-green-50 text-green-800">
              <span className="text-xl leading-none">✅</span>
              <div>
                <div className="text-sm font-bold">Skema Struktur Pemasaran Valid!</div>
                <div className="text-xs leading-relaxed opacity-90 mt-0.5">
                  Persentase diskon bergradasi naik secara harmonis. Next step check dengan ketersediaan profit margin..
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 items-start p-5 rounded-2xl border border-red-200 bg-red-50 text-red-700">
              <span className="text-xl leading-none">⚠️</span>
              <div>
                <div className="text-sm font-bold">Pelanggaran Logika Komparasi Tier!</div>
                <div className="text-xs leading-relaxed opacity-90 mt-0.5">
                  Terdeteksi penurunan nilai rasio diskon. Bar visual di kanan berubah merah sebagai tanda
                  ketidaksesuaian sistem gradasi persentase. Selesaikan baris bertanda warning ⚠️.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800">Gradasi Keuntungan Visual</h2>
          <p className="text-xs text-gray-400 mt-1">
            Semakin tinggi tingkatan tier, rasio daya tarik promosi harus dibuat seimbang &amp; bergradasi harmonis.
          </p>

          <div className="flex flex-col gap-5 mt-6 mb-6">
            {tiers.map((tier, index) => {
              const pct = computedPercentages[index]
              const barColor = overallValid ? tier.defaultBarColor : DANGER_COLOR
              const barWidth = Math.min(pct * 12, 100) || 4
              return (
                <div key={tier.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-800">{tier.name}</span>
                    <span className={overallValid ? 'text-gray-500' : 'text-red-600'}>{pct.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#F3F8FC] rounded-full overflow-hidden border border-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-xs font-bold text-gray-800 mb-3">💡 Evaluasi Logika Pasar</h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-500 leading-relaxed">
              <li className="relative pl-3.5">
                <span className="absolute left-0 text-orange-300 font-bold">•</span>
                <strong className="text-gray-700">Tier 1 Baseline:</strong> Menjaring konversi pertama pembeli baru pada
                batas Rp {formatRupiahString(tiers[0].nominal)}.
              </li>
              <li className="relative pl-3.5">
                <span className="absolute left-0 text-orange-300 font-bold">•</span>
                <strong className="text-gray-700">Tier 2 AOV Booster:</strong> Ditempatkan pas untuk mendongkrak
                rata-rata transaksi organik harian agar naik ke Rp {formatRupiahString(tiers[1].nominal)}. Sesuai
                dengan rata rata transaksi yang sudah terjadi.
              </li>
              <li className="relative pl-3.5">
                <span className="absolute left-0 text-orange-300 font-bold">•</span>
                <strong className="text-gray-700">Tier 3 Profit Maximizer:</strong> Di desain agar pengguna menambah
                barang bawaan belanja hingga Rp {formatRupiahString(tiers[2].nominal)}.
              </li>
              <li className="relative pl-3.5">
                <span className="absolute left-0 text-orange-300 font-bold">•</span>
                <strong className="text-gray-700">Tier 4 Bulk Whale:</strong> Ada kemungkinan pembeli adalah
                distributor/grosir besar pada batas transaksi Rp {formatRupiahString(tiers[3].nominal)}. Follow up
                pembeli untuk retensi lanjutan.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
