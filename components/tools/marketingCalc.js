// Pure unit-economics calculation engine, ported from the standalone
// "Pepi Marketing Simulator v3" HTML tool (github.com/silverfx18/Simulator).
// All functions here are DOM-free: they take explicit params and return values,
// so the React layer can call them from useMemo/reducers without side effects.

import { fmtRupiah, fmtCount, fmtPercent } from '../lib/format'

// Master database of industry benchmarks + price elasticity defaults per business category.
export const BIZ = {
  'ecomm-commodity': { label: 'E-commerce Commodity', effortT: 'Sedang', effortCR: 'Tinggi', crNorm: 1.2, crMin: 0.1, crMax: 10.0, splitDefault: 0.70, tDrop: 15, crDrop: 18 },
  'ecomm-niche': { label: 'E-commerce Niche', effortT: 'Tinggi', effortCR: 'Rendah', crNorm: 3.0, crMin: 0.5, crMax: 20.0, splitDefault: 0.30, tDrop: 5, crDrop: 8 },
  'ecomm-premium': { label: 'E-commerce Premium / Luxury', effortT: 'Tinggi', effortCR: 'Tinggi', crNorm: 1.8, crMin: 0.2, crMax: 15.0, splitDefault: 0.50, tDrop: 2, crDrop: 3 },
  'retail-commodity': { label: 'Retail Offline Mass Market', effortT: 'Tinggi', effortCR: 'Rendah', crNorm: 15.0, crMin: 2.0, crMax: 60.0, splitDefault: 0.30, tDrop: 8, crDrop: 12 },
  'retail-niche': { label: 'Retail Offline Niche/Spesialis', effortT: 'Sedang', effortCR: 'Rendah', crNorm: 20.0, crMin: 5.0, crMax: 70.0, splitDefault: 0.40, tDrop: 4, crDrop: 6 },
  'retail-premium': { label: 'Retail Offline Premium', effortT: 'Sedang', effortCR: 'Sedang', crNorm: 10.0, crMin: 1.0, crMax: 40.0, splitDefault: 0.50, tDrop: 2, crDrop: 3 },
  'service-relational': { label: 'Jasa Profesional Relasional', effortT: 'Sedang', effortCR: 'Tinggi', crNorm: 5.0, crMin: 1.0, crMax: 40.0, splitDefault: 0.70, tDrop: 4, crDrop: 5 },
}

export const DEFAULT_MKT = {
  cpc: 0,
  plat: 0, pgw: 0, ship: 0, affPct: 0, affFix: 0, dist: 0, ads: 0, kol: 0,
}

// Unit contribution margin (Rp) per sale, before fixed costs.
export function calcUnitContribution(price, cogs, cr, retention, mktTab, mkt) {
  let vMktUnit = 0
  if (mktTab === 'adv') {
    const plat = (mkt.plat || 0) / 100
    const pgw = (mkt.pgw || 0) / 100
    const affPct = (mkt.affPct || 0) / 100
    vMktUnit = (plat + pgw + affPct) * price
    vMktUnit += mkt.ship || 0
    vMktUnit += mkt.affFix || 0
    vMktUnit += mkt.dist || 0
  }
  let contrib = (price - cogs - vMktUnit) * (1 + retention)
  if (mktTab === 'simple') contrib -= (mkt.cpc || 0) / (cr > 0 ? cr : 0.01)
  return contrib
}

// How many units are needed to reach a target gross profit.
export function calcUnitsNeededForTarget(price, cogs, cr, retention, targetGP, mktTab, mkt) {
  const contrib = calcUnitContribution(price, cogs, cr, retention, mktTab, mkt)
  const adsPool = mktTab === 'adv' ? ((mkt.ads || 0) + (mkt.kol || 0)) : 0
  if (contrib <= 0) return 0
  return (targetGP + adsPool) / (contrib / (1 + retention))
}

// Full metrics dashboard for a given set of inputs.
export function calcMetrics(price, cogs, traffic, cr, fixed, retention, mktTab, mkt) {
  const qty = traffic * cr
  const baseRev = qty * price
  const repeatQty = qty * retention
  const extraRev = repeatQty * price

  const totalQty = qty + repeatQty
  const totalRev = baseRev + extraRev

  let mktVarTotal = 0
  let mktFixedTotal = 0

  if (mktTab === 'simple') {
    mktVarTotal = (mkt.cpc || 0) * traffic
  } else {
    const platFee = ((mkt.plat || 0) / 100) * totalRev
    const pgwFee = ((mkt.pgw || 0) / 100) * totalRev
    const shipSub = (mkt.ship || 0) * totalQty
    const affPct = ((mkt.affPct || 0) / 100) * totalRev
    const affFix = (mkt.affFix || 0) * totalQty
    const distFee = (mkt.dist || 0) * totalQty

    mktVarTotal = platFee + pgwFee + shipSub + affPct + affFix + distFee
    mktFixedTotal = (mkt.ads || 0) + (mkt.kol || 0)
  }

  const totalMarketingCost = mktVarTotal + mktFixedTotal
  const totalCOGS = totalQty * cogs
  const grossProfit = totalRev - totalCOGS - totalMarketingCost
  const netProfit = grossProfit - fixed

  const roas = mktFixedTotal > 0 ? (totalRev / mktFixedTotal) : 0
  const marginPct = totalRev > 0 ? (grossProfit / totalRev * 100) : 0

  return { totalQty, totalRev, totalCOGS, mktTotal: totalMarketingCost, grossProfit, netProfit, marginPct, baseQty: qty, baseRev, roas }
}

// Simplified profit-only metrics used for the dashed "locked baseline" curve on the chart.
export function calcMetricsForBaseline(price, cogs, traffic, cr, baseData, mktTab, mkt) {
  const qty = traffic * cr
  const totalQty = qty * (1 + baseData.retention)
  const totalRev = totalQty * price

  let mktCost = 0
  if (mktTab === 'simple') {
    mktCost = (mkt.cpc || 0) * traffic
  } else {
    const plat = (mkt.plat || 0) / 100
    const pgw = (mkt.pgw || 0) / 100
    const affPct = (mkt.affPct || 0) / 100
    mktCost = (plat + pgw + affPct) * totalRev
    mktCost += ((mkt.ship || 0) + (mkt.affFix || 0) + (mkt.dist || 0)) * totalQty
    mktCost += (mkt.ads || 0) + (mkt.kol || 0)
  }

  return totalRev - (totalQty * cogs) - mktCost
}

// Phased-growth reverse solver: raise CR to industry norm first, then split remaining
// growth between traffic/CR according to splitRatio (0..1, weight on traffic).
export function calcBalancedDistribution(unitsNeeded, anchorT, anchorCr, biz, splitRatio) {
  const crNorm = biz.crNorm / 100
  const crMax = biz.crMax / 100
  const crMin = biz.crMin / 100
  const targetQty = unitsNeeded
  const currentQty = anchorT * anchorCr

  let finalT, finalCr

  if (targetQty > currentQty) {
    const qtyAtNorm = anchorT * Math.max(anchorCr, crNorm)
    if (targetQty <= qtyAtNorm) {
      finalT = anchorT
      finalCr = targetQty / anchorT
    } else {
      const extraGrowthNeeded = targetQty / qtyAtNorm
      finalT = anchorT * Math.pow(extraGrowthNeeded, splitRatio)
      finalCr = Math.max(anchorCr, crNorm) * Math.pow(extraGrowthNeeded, 1 - splitRatio)
    }
  } else {
    const g = currentQty > 0 ? (targetQty / currentQty) : 1
    finalT = anchorT * Math.pow(g, splitRatio)
    finalCr = anchorCr * Math.pow(g, 1 - splitRatio)
  }

  if (finalCr > crMax) { finalCr = crMax; finalT = targetQty / crMax }
  else if (finalCr < crMin) { finalCr = crMin; finalT = targetQty / crMin }

  return { traffic: finalT, cr: finalCr }
}

// Price-elasticity model: given a price change vs. the locked baseline price, compute
// the resulting traffic/CR (only meaningful when a baseline is locked and "Mode Harga" is on).
export function computeElasticity({ price, dynamicBaselinePrice, tDropFactor, crDropFactor, initialTrafficBeforeDrag, initialCrBeforeDrag }) {
  if (price === dynamicBaselinePrice) return null

  const priceRatio = price / dynamicBaselinePrice
  const smoothedIntervals = Math.log(priceRatio) / Math.log(1.10)

  const trafficMult = 1 - (smoothedIntervals * tDropFactor)
  const crMult = 1 - (smoothedIntervals * crDropFactor)

  const targetTraffic = Math.max(10, Math.min(initialTrafficBeforeDrag * 3, Math.round(initialTrafficBeforeDrag * trafficMult)))
  const targetCr = Math.max(0.1, Math.min(100, +(initialCrBeforeDrag * crMult).toFixed(2)))

  return {
    targetTraffic,
    targetCr,
    isIncrease: price > dynamicBaselinePrice,
    trafficDropPct: (1 - trafficMult) * 100,
    crDropPct: (1 - crMult) * 100,
    priceDeltaPct: (priceRatio - 1) * 100,
  }
}

// Reverse solver: given a locked target revenue/GP, compute the traffic/CR needed.
// Mirrors the source's solveConstraints(): which field moves depends on lastFreeInput.
export function solveConstraints({ price, cogs, traffic, cr, fixed, retention, mktTab, mkt, targetRev, targetGp, lockRev, lockGp, lastFreeInput, biz, anchorT, anchorCr, splitRatio }) {
  const tRev = lockRev ? targetRev : null
  const tGP = lockGp ? targetGp : null
  if (!tRev && !tGP) return null

  const crMin = biz.crMin / 100
  const crMax = biz.crMax / 100

  const currentMetrics = calcMetrics(price, cogs, traffic, cr, fixed, retention, mktTab, mkt)
  if (tRev !== null && currentMetrics.totalRev >= tRev) return null
  if (tGP !== null && currentMetrics.grossProfit >= tGP) return null

  const unitContrib = calcUnitContribution(price, cogs, cr, retention, mktTab, mkt)
  if (unitContrib <= 0 && tGP !== null) return null

  let unitsNeeded = 0
  if (tRev !== null && tRev > 0) {
    const totalPerUnit = price * (1 + retention)
    if (totalPerUnit <= 0) return null
    unitsNeeded = tRev / totalPerUnit
  } else if (tGP !== null && tGP > 0) {
    unitsNeeded = calcUnitsNeededForTarget(price, cogs, cr, retention, tGP, mktTab, mkt)
  }
  if (unitsNeeded <= 0) return null

  let finalTraffic = traffic
  let finalCr = cr

  if (lastFreeInput === 'cr') {
    finalTraffic = cr > 0 ? (unitsNeeded / cr) : 0
  } else if (lastFreeInput === 'traffic') {
    finalCr = traffic > 0 ? (unitsNeeded / traffic) : 0
    if (finalCr > crMax) { finalCr = crMax; finalTraffic = crMax > 0 ? (unitsNeeded / crMax) : 0 }
    else if (finalCr < crMin) { finalCr = crMin; finalTraffic = crMin > 0 ? (unitsNeeded / crMin) : 0 }
  } else {
    const dist = calcBalancedDistribution(unitsNeeded, anchorT, anchorCr, biz, splitRatio)
    finalTraffic = dist.traffic
    finalCr = dist.cr
  }

  return { traffic: finalTraffic, cr: finalCr }
}

// Option A/B/C Pareto matrix for hitting a locked target gross profit.
export function calcParetoOptions({ inputs, targetGp, biz, anchorT, anchorCr, splitRatio }) {
  const crMin = biz.crMin / 100
  const crMax = biz.crMax / 100
  const unitsNeeded = calcUnitsNeededForTarget(inputs.price, inputs.cogs, inputs.cr, inputs.retention, targetGp, inputs.mktTab, inputs.mkt)

  // Option A: optimize CR, traffic anchored
  let crNeeded = anchorT > 0 ? (unitsNeeded / anchorT) : 0
  let tNeededForA = anchorT
  if (crNeeded > crMax) { crNeeded = crMax; tNeededForA = crMax > 0 ? (unitsNeeded / crMax) : 0 }
  else if (crNeeded < crMin) { crNeeded = crMin; tNeededForA = crMin > 0 ? (unitsNeeded / crMin) : 0 }
  const crDeltaA = anchorCr > 0 ? ((crNeeded - anchorCr) / anchorCr * 100) : 0
  const tDeltaA = anchorT > 0 ? ((tNeededForA - anchorT) / anchorT * 100) : 0

  // Option B: scale traffic, CR anchored
  let tNeeded = anchorCr > 0 ? (unitsNeeded / anchorCr) : 0
  let crNeededForB = anchorCr
  if (tNeeded > 1000000) { tNeeded = 1000000; crNeededForB = Math.min(crMax, unitsNeeded / 1000000) }
  const tDeltaB = anchorT > 0 ? ((tNeeded - anchorT) / anchorT * 100) : 0
  const crDeltaB = anchorCr > 0 ? ((crNeededForB - anchorCr) / anchorCr * 100) : 0

  // Option C: balanced growth
  const dist = calcBalancedDistribution(unitsNeeded, anchorT, anchorCr, biz, splitRatio)
  const balTDelta = anchorT > 0 ? ((dist.traffic - anchorT) / anchorT * 100) : 0
  const balCrDelta = anchorCr > 0 ? ((dist.cr - anchorCr) / anchorCr * 100) : 0

  const isCrPareto = biz.effortCR === 'Rendah'

  return {
    unitsNeeded,
    isCrPareto,
    optionA: { cr: crNeeded, traffic: tNeededForA, crDelta: crDeltaA, tDelta: tDeltaA, recommended: isCrPareto },
    optionB: { traffic: tNeeded, cr: crNeededForB, tDelta: tDeltaB, crDelta: crDeltaB, recommended: !isCrPareto },
    optionC: { traffic: dist.traffic, cr: dist.cr, tDelta: balTDelta, crDelta: balCrDelta },
  }
}

// Contextual advisory tips (public + owner-only). Mirrors renderContextualTips().
export function buildAdvisoryTips({ inputs, m, biz, bizCat, isBaselineLocked, storedBaselineData, savedScenarios, mktTab }) {
  const tips = []
  let ownerTip = null
  const crPct = inputs.cr * 100

  if (isBaselineLocked) {
    const baseCrPct = storedBaselineData.cr * 100
    if (baseCrPct < biz.crNorm) {
      let crAdvice = 'perkuat portfolio studi kasus klien.'
      if (bizCat.includes('ecomm')) crAdvice = 'optimasi visual aset dan copywriting produk.'
      else if (bizCat.includes('retail')) crAdvice = 'perbaikan merchandising dan training staf.'
      tips.push({ tone: 'warn', text: `DIAGNOSA BASELINE: CR riil Anda (${baseCrPct.toFixed(1)}%) di bawah rata-rata industri (${biz.crNorm}%). Skenario simulasi saat ini bersifat 'What-if', namun secara fundamental Anda wajib melakukan ${crAdvice}` })
    }

    const baseMetrics = calcMetrics(storedBaselineData.price, storedBaselineData.cogs, storedBaselineData.traffic, storedBaselineData.cr, storedBaselineData.fixed, storedBaselineData.retention, mktTab, inputs.mkt)
    const deltaProfit = m.grossProfit - baseMetrics.grossProfit
    if (deltaProfit > 0) {
      tips.push({ tone: 'good', text: `Analisis Skenario: Eksperimen ini berpotensi meningkatkan profit sebesar ${fmtRupiah(deltaProfit)} dibanding kondisi Baseline.` })
    } else if (deltaProfit < 0) {
      tips.push({ tone: 'danger', text: `Peringatan Skenario: Langkah ini menurunkan profit ${fmtRupiah(Math.abs(deltaProfit))} dibanding Baseline. Periksa kembali kebijakan harga dan elastisitas.` })
    }
  }

  if (savedScenarios.length > 0) {
    const bestSaved = savedScenarios.reduce((prev, curr) => (prev.grossProfit > curr.grossProfit) ? prev : curr)
    if (m.grossProfit > bestSaved.grossProfit) {
      tips.push({ tone: 'purple', text: 'Eksperimen Terbaik: Simulasi aktif saat ini mengungguli semua skenario yang pernah Anda simpan!' })
    } else if (m.grossProfit < bestSaved.grossProfit) {
      tips.push({ tone: 'neutral', text: `Info Komparasi: ${bestSaved.label} masih lebih menguntungkan (Selisih: ${fmtRupiah(bestSaved.grossProfit - m.grossProfit)}) dibanding simulasi saat ini.` })
    }
  }

  if (!isBaselineLocked) {
    if (crPct < biz.crNorm) {
      tips.push({ tone: 'warn', text: `Audit Konversi: Rasio ${fmtPercent(crPct)} di bawah rata-rata industri. Fokus pada kualitas traffic.` })
    } else {
      tips.push({ tone: 'good', text: `Konversi Solid: Rasio konversi Anda melampaui standar industri. Infrastruktur penjualan Anda sudah solid.` })
    }
  }

  if (biz.effortT === 'Sedang') {
    const trafficMethod = bizCat.includes('ecomm') ? 'optimasi Meta/TikTok Ads dan SEO konten' : 'optimalisasi Google Maps (GMB) dan event komunitas lokal'
    tips.push({ tone: 'blue', text: `Prioritas Scaling: Kejar traffic dahulu karena ini yang termudah di lini bisnis Anda. Naikkan jumlah pengunjung melalui ${trafficMethod}.` })
  } else if (biz.effortCR === 'Rendah') {
    tips.push({ tone: 'purple', text: `Efisiensi Biaya: Di kategori ${biz.label}, optimasi Konversi biasanya memberikan ROI lebih cepat dengan biaya lebih rendah dibanding mengejar traffic yang sangat kompetitif.` })
  }

  const marginPerUnit = m.totalQty > 0 ? (m.grossProfit / m.totalQty) : 0
  if (marginPerUnit > 0) {
    const bepUnits = inputs.fixed / marginPerUnit
    if (m.totalQty < bepUnits) {
      const lack = Math.ceil(bepUnits - m.totalQty)
      const marginGap = m.totalQty > 0 ? (inputs.fixed - m.grossProfit) / m.totalQty : 0
      ownerTip = { tone: 'danger', text: `PERINGATAN OPERASIONAL: Laba kotor belum menutupi biaya tetap. Solusi Volume: tambah penjualan minimal ${fmtCount(lack)} unit lagi. Solusi Margin: atau naikkan margin kontribusi sebesar ${fmtRupiah(marginGap)} per unit.` }
    }
  } else if (m.grossProfit <= 0) {
    ownerTip = { tone: 'danger', text: 'KRITIS: Margin kontribusi negatif. Bisnis merugi di setiap unit yang terjual. Segera evaluasi Harga Jual atau HPP!' }
  }

  if (mktTab === 'adv' && m.roas > 0) {
    if (m.roas < 2.5) {
      tips.push({ tone: 'warn', text: `Efisiensi Iklan Rendah: ROAS ${m.roas.toFixed(1)}x menunjukkan biaya akuisisi terlalu mahal. Perbaiki materi kreatif iklan atau naikkan AOV.` })
    } else if (m.roas > 6) {
      tips.push({ tone: 'blue', text: `Peluang Scaling: ROAS Anda sangat sehat (${m.roas.toFixed(1)}x). Saatnya menambah budget akuisisi di Klaster C.` })
    }
  }

  if (bizCat === 'ecomm-niche') {
    tips.push({ tone: 'neutral', text: 'Saran Niche: Fokus bangun lingkaran loyalitas (WA Group/Telegram) karena konversi pembeli lama jauh lebih murah.' })
  }

  return { tips, ownerTip }
}

function buildMktInfoText(mktTab, mkt) {
  if (mktTab === 'simple') {
    return `- Mode: Blended CPC\n- Biaya per Klik (CPC): ${fmtRupiah(mkt.cpc)}`
  }
  return `- Klaster A (Platform): Fee ${mkt.plat}% + PGW ${mkt.pgw}% + Subsidi ${fmtRupiah(mkt.ship)}/unit\n` +
    `- Klaster B (Distribusi): Affiliate ${mkt.affPct}% / Sales Fix ${fmtRupiah(mkt.affFix)} + Dist ${fmtRupiah(mkt.dist)}/unit\n` +
    `- Klaster C (Akuisisi): Ads ${fmtRupiah(mkt.ads)} | KOL & Event ${fmtRupiah(mkt.kol)}`
}

function buildBaselineSummaryText(isBaselineLocked, storedBaselineData, mktTab, mkt) {
  if (!isBaselineLocked) return ''
  const b = storedBaselineData
  const bm = calcMetrics(b.price, b.cogs, b.traffic, b.cr, b.fixed, b.retention, mktTab, mkt)
  return `DATA BASELINE (KONDISI AWAL SAAT INI):\n- Harga Jual: ${fmtRupiah(b.price)} | HPP: ${fmtRupiah(b.cogs)}\n- Traffic: ${fmtCount(b.traffic)} | CR: ${(b.cr * 100).toFixed(1)}% | Profit: ${fmtRupiah(bm.grossProfit)}\n\n`
}

function buildSavedScenariosText(savedScenarios) {
  if (savedScenarios.length === 0) return ''
  let text = 'PERBANDINGAN SKENARIO EKSPERIMEN (SAVED SCENARIOS):\n'
  savedScenarios.forEach((s) => {
    text += `- ${s.label}: AOV ${fmtRupiah(s.price)} | Traffic ${fmtCount(s.traffic)} | CR ${(s.cr * 100).toFixed(2)}% | Retensi ${(s.retention * 100).toFixed(0)}% | Profit ${fmtRupiah(s.grossProfit)}\n`
  })
  return text + '\n'
}

// Public "Integrasi AI" report — pure string/JSON templating, no network calls.
export function buildReport({ format, inputs, m, biz, bizDetail, tips, isBaselineLocked, storedBaselineData, savedScenarios }) {
  const compiledTipsArray = tips.map((t) => t.text)
  const compiledTipsText = compiledTipsArray.map((t, i) => `${i + 1}. ${t}`).join('\n')
  const mktInfo = buildMktInfoText(inputs.mktTab, inputs.mkt)
  const baselineSummaryText = buildBaselineSummaryText(isBaselineLocked, storedBaselineData, inputs.mktTab, inputs.mkt)
  const savedScenariosText = buildSavedScenariosText(savedScenarios)

  if (format === 'json') {
    return JSON.stringify({
      prompt_context: {
        role: 'Senior Business Consultant dan Ahli Strategi Growth Hacking',
        objective: 'Analisis data simulasi bisnis dan berikan rekomendasi strategis untuk meningkatkan profitabilitas.',
      },
      data_metrik: {
        model_bisnis: biz.label,
        deskripsi_bisnis: bizDetail,
        harga_jual_aov: inputs.price,
        hpp_cogs_unit: inputs.cogs,
        traffic_pengunjung: inputs.traffic,
        conversion_rate_aktual_pct: inputs.cr * 100,
        retention_pct: inputs.retention * 100,
        rata_rata_industri_cr_pct: biz.crNorm,
        estimasi_omset: m.totalRev,
        gross_profit_marketing: m.grossProfit,
        blended_roas_mer: parseFloat(m.roas.toFixed(1)),
        struktur_biaya_marketing: inputs.mkt,
      },
      rekomendasi_sistem: compiledTipsArray.length > 0 ? compiledTipsArray : ['Seluruh metrik saat ini terpantau berada dalam batas wajar industri.'],
      instruksi_analisis_ai: [
        'Berikan evaluasi mendalam apakah struktur harga (AOV) dan biaya (HPP) sudah memberikan ruang margin yang sehat untuk melakukan scaling.',
        "Bandingkan performa Skenario Aktif dengan Baseline dan Skenario Eksperimen lainnya untuk menentukan mana yang paling 'feasible' (mudah dijalankan dengan risiko terkontrol).",
        "Interpretasikan 'Blended ROAS' sebagai MER (Marketing Efficiency Ratio). Jika angkanya sangat tinggi (>10x), pertimbangkan adanya kontribusi traffic organik yang besar dalam simulasi ini. Jangan hanya memuji efisiensi iklan.",
        'Berdasarkan data MER dan perbandingan CR terhadap rata-rata industri, identifikasi di mana kebocoran profit terbesar terjadi.',
        'Berikan 3 langkah taktis prioritas yang harus dilakukan pemilik bisnis minggu ini untuk meningkatkan laba bersih tanpa harus menaikkan budget iklan secara drastis.',
      ],
      perintah_tambahan: [
        'Gunakan framework SWOT atau Funnel Audit dalam analisismu.',
        'Sajikan output dalam poin-poin yang mudah dieksekusi (Actionable).',
      ],
      metadata: { timestamp: new Date().toISOString() },
      baseline: isBaselineLocked ? storedBaselineData : null,
      saved_scenarios: savedScenarios,
    }, null, 2)
  }

  return `Bertindaklah sebagai Senior Business Consultant dan Ahli Strategi Growth Hacking. Analisis data simulasi bisnis di bawah ini dan berikan rekomendasi strategis yang tajam untuk meningkatkan profitabilitas perusahaan.

${baselineSummaryText}DATA METRIK BISNIS SAAT INI (SKENARIO AKTIF):
- Model Bisnis: ${biz.label}
- Deskripsi Spesifik: ${bizDetail}
- Harga Jual (AOV): ${fmtRupiah(inputs.price)}
- HPP (COGS) per Unit: ${fmtRupiah(inputs.cogs)}
- Traffic Pengunjung: ${fmtCount(inputs.traffic)} Kunjungan/Bulan
- Conversion Rate (CR): ${fmtPercent(inputs.cr * 100)} (Rata-rata Industri: ${fmtPercent(biz.crNorm)})
- Retensi Pelanggan: ${fmtPercent(inputs.retention * 100)}
- Estimasi Omset: ${fmtRupiah(m.totalRev)}
- Gross Profit: ${fmtRupiah(m.grossProfit)}
- Blended ROAS (MER): ${m.roas.toFixed(1)}x

STRUKTUR BIAYA MARKETING:
${mktInfo}

${savedScenariosText}REKOMENDASI SISTEM CALCULATOR:
${compiledTipsText || 'Seluruh metrik saat ini terpantau berada dalam batas wajar industri.'}

INSTRUKSI ANALISIS UNTUK AI:
1. Berikan evaluasi mendalam apakah struktur harga (AOV) dan biaya (HPP) sudah memberikan ruang margin yang sehat untuk melakukan scaling.
2. Bandingkan performa Skenario Aktif dengan Baseline dan skenario yang disimpan. Mana yang paling logis dan memungkinkan untuk dieksekusi tim di lapangan (feasible) berdasarkan perubahan Traffic dan CR yang dibutuhkan?
3. Interpretasikan 'Blended ROAS' sebagai MER (Marketing Efficiency Ratio). Jika angkanya sangat tinggi (>10x), pertimbangkan faktor kontribusi traffic organik yang dominan.
4. Berdasarkan data MER dan perbandingan CR terhadap rata-rata industri, identifikasi di mana kebocoran profit terbesar terjadi.
5. Berikan 3 langkah taktis prioritas yang harus dilakukan pemilik bisnis minggu ini untuk meningkatkan laba bersih tanpa harus menaikkan budget iklan secara drastis.

Gunakan framework Funnel Audit dalam analisismu dan sajikan output dalam poin-poin yang mudah dieksekusi (Actionable).`
}

// Owner-exclusive "Mega-Prompt" report (fixed cost / net profit / break-even focused).
export function buildOwnerReport({ format, inputs, m, biz, bizDetail, tips, ownerTip, isBaselineLocked, storedBaselineData, savedScenarios }) {
  const compiledTipsArray = tips.map((t) => t.text)
  const compiledTipsText = compiledTipsArray.map((t, i) => `${i + 1}. ${t}`).join('\n')
  const ownerTipsText = ownerTip ? ownerTip.text : ''
  const mktInfo = buildMktInfoText(inputs.mktTab, inputs.mkt)
  const baselineSummaryText = buildBaselineSummaryText(isBaselineLocked, storedBaselineData, inputs.mktTab, inputs.mkt)
  const savedScenariosText = buildSavedScenariosText(savedScenarios)

  if (format === 'json') {
    return JSON.stringify({
      prompt_context: {
        role: 'Chief Financial Officer (CFO) dan Senior Business Strategist',
        objective: 'Evaluasi kesehatan finansial makro perusahaan, analisis struktur biaya tetap, dan proyeksi laba bersih.',
      },
      data_sensitif_owner: {
        fixed_costs: inputs.fixed,
        deskripsi_bisnis: bizDetail,
        net_profit_akhir: m.netProfit,
        margin_kontribusi_per_unit: (m.grossProfit / m.totalQty) || 0,
        break_even_point_units: (inputs.fixed / ((m.grossProfit / m.totalQty) || 1)),
      },
      data_operasional: {
        aov: inputs.price,
        gross_profit: m.grossProfit,
        total_unit_terjual: m.totalQty,
        blended_roas_mer: parseFloat(m.roas.toFixed(1)),
        struktur_biaya_marketing: inputs.mkt,
      },
      temuan_owner_tool: ownerTipsText || 'Struktur biaya tetap tertutup dengan aman oleh profit operasional.',
      rekomendasi_sistem_marketing: compiledTipsArray,
      baseline: isBaselineLocked ? storedBaselineData : null,
      saved_scenarios: savedScenarios,
      instruksi_analisis_finansial: [
        'Bandingkan performa finansial Skenario Aktif dengan Baseline dan skenario tersimpan lainnya. Apakah strategi ini memberikan pertumbuhan laba yang sehat dan berkelanjutan?',
        'Analisis apakah laba bersih saat ini sudah ideal dibandingkan dengan risiko biaya tetap (overhead) yang ditanggung.',
        'Evaluasi kapasitas perusahaan untuk melakukan ekspansi, reinvestasi ke marketing, atau pembagian dividen.',
        'Berikan saran mengenai efisiensi biaya tetap (overhead) dan bagaimana dampaknya terhadap penurunan harga jual (Price War) jika diperlukan.',
      ],
      focus: 'Business Sustainability & Shareholder Value',
    }, null, 2)
  }

  return `Bertindaklah sebagai Chief Financial Officer (CFO) dan Strategic Business Owner. Gunakan data finansial makro di bawah ini untuk menganalisis keberlanjutan bisnis dan efisiensi struktur biaya.

${baselineSummaryText}RINGKASAN EKSEKUTIF FINANSIAL (SKENARIO AKTIF):
- Biaya Tetap (Overhead): ${fmtRupiah(inputs.fixed)}
- Bisnis: ${bizDetail}
- Laba Bersih (Net Profit): ${fmtRupiah(m.netProfit)}
- Harga Jual (AOV): ${fmtRupiah(inputs.price)}
- Gross Profit: ${fmtRupiah(m.grossProfit)}
- Total Unit Terjual: ${fmtCount(m.totalQty)} unit
- Blended ROAS (MER): ${m.roas.toFixed(1)}x

DETAIL BIAYA MARKETING:
${mktInfo}

${savedScenariosText}TEMUAN & REKOMENDASI SISTEM:
${compiledTipsText || 'Seluruh metrik operasional terpantau berada dalam batas wajar industri.'}

TEMUAN OWNER'S ADVISORY TOOL:
${ownerTipsText || 'Struktur biaya operasional terpantau sehat dan menutup seluruh beban tetap.'}

INSTRUKSI ANALISIS STRATEGIS OWNER:
1. Bandingkan performa finansial Skenario Aktif dengan Baseline dan skenario tersimpan lainnya. Apakah peningkatan laba bersih sebanding dengan perubahan budget atau target traffic yang ditetapkan?
2. Analisis ketahanan bisnis terhadap fluktuasi biaya tetap. Apakah margin kontribusi saat ini sudah cukup aman untuk menyerap kenaikan biaya overhead (seperti sewa atau gaji) di masa depan?
3. Berdasarkan Net Profit yang dihasilkan, berikan saran apakah laba sebaiknya diinvestasikan kembali ke marketing (Klaster C) untuk pertumbuhan, atau digunakan untuk penguatan cadangan kas perusahaan.
4. Identifikasi skenario 'Worst Case' berdasarkan angka Breakeven yang ada; berapa penurunan traffic maksimal yang bisa ditoleransi sebelum perusahaan mengalami kerugian bersih?

Fokuslah pada Business Sustainability dan Shareholder Value dalam memberikan rekomendasi.`
}
