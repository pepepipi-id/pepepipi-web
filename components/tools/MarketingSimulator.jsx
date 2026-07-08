'use client'

import { useMemo, useReducer } from 'react'
import { fmtRupiah, fmtCount, fmtPercent, formatRupiahString, parseFormattedNum } from '../lib/format'
import {
  BIZ,
  calcMetrics,
  calcMetricsForBaseline,
  calcUnitsNeededForTarget,
  calcBalancedDistribution,
  computeElasticity,
  solveConstraints,
  calcParetoOptions,
  buildAdvisoryTips,
  buildReport,
  buildOwnerReport,
} from './marketingCalc'
import SweetSpotChart from './marketing/SweetSpotChart'

const CATEGORY_OPTIONS = [
  { value: 'ecomm-commodity', label: 'E-commerce — Commodity / Mass Market (Sembako, Gadget, Grosir)' },
  { value: 'ecomm-niche', label: 'E-commerce — Niche / Spesialisasi (Hobi, Onderdil Premium, Diet)' },
  { value: 'ecomm-premium', label: 'E-commerce — Premium / Luxury (Brand Eksklusif, Perhiasan Kustom)' },
  { value: 'retail-commodity', label: 'Retail Offline — Mass Market (Toko Bangunan, Sembako)' },
  { value: 'retail-niche', label: 'Retail Offline — Spesalis (Hobi, Butik Khusus)' },
  { value: 'retail-premium', label: 'Retail Offline — Premium (Luxury Goods, High-end Showroom)' },
  { value: 'service-relational', label: 'Jasa Profesional / Relasional (Kontraktor Konstruksi, Agensi B2B)' },
]

const TONE_STYLES = {
  warn: 'bg-red-50 border-red-300 text-red-700',
  danger: 'bg-red-50 border-red-400 text-red-700 font-medium',
  good: 'bg-green-50 border-green-300 text-green-800',
  blue: 'bg-blue-50 border-blue-300 text-blue-800',
  purple: 'bg-purple-50 border-purple-300 text-purple-800',
  neutral: 'bg-slate-50 border-slate-200 text-slate-600',
}

const initialState = {
  bizCat: 'ecomm-commodity',
  bizDetail: '',
  customElastActive: false,
  celastT: 5,
  celastCr: 8,
  price: 200000,
  cogs: 170000,
  traffic: 50000,
  cr: 3.0,
  retention: 0,
  fixed: 30000000,
  blendedPct: 15,
  priceMode: false,
  capMode: 'strict',
  lastFreeInput: 'traffic',
  locks: { price: false, cogs: false, traffic: false, cr: false, rev: false, gp: false },
  targetRev: 0,
  targetGp: 0,
  mktTab: 'simple',
  mkt: { cpc: 0, plat: 0, pgw: 0, ship: 0, affPct: 0, affFix: 0, dist: 0, ads: 0, kol: 0 },
  isBaselineLocked: false,
  storedBaselineData: { price: 200000, cogs: 170000, traffic: 50000, cr: 0.03, fixed: 30000000, retention: 0, tDrop: 0.15, crDrop: 0.18 },
  initialTrafficBeforeDrag: 50000,
  initialCrBeforeDrag: 3.0,
  savedScenarios: [],
  splitRatio: 70,
  reportFormat: 'txt',
  ownerReportFormat: 'txt',
  priceWarning: null,
}

function getElastModifiers(s) {
  if (s.customElastActive) return { tDrop: (s.celastT || 0) / 100, crDrop: (s.celastCr || 0) / 100 }
  const biz = BIZ[s.bizCat]
  return { tDrop: biz.tDrop / 100, crDrop: biz.crDrop / 100 }
}

function applyDerivation(s) {
  const biz = BIZ[s.bizCat]
  let { price, cogs, traffic, cr, blendedPct } = s
  const { priceMode, lastFreeInput, capMode } = s

  if (priceMode || lastFreeInput === 'margin') {
    if (lastFreeInput === 'margin') {
      cogs = price * (1 - blendedPct / 100)
    } else {
      blendedPct = price > 0 ? (1 - cogs / price) * 100 : 0
    }
  } else {
    if (lastFreeInput === 'price') {
      cogs = price * (1 - blendedPct / 100)
    } else if (lastFreeInput === 'cogs') {
      price = blendedPct < 100 ? cogs / (1 - blendedPct / 100) : cogs
    }
  }

  if (capMode === 'strict') {
    if (lastFreeInput === 'price' && price < cogs) price = cogs
    else if (lastFreeInput === 'cogs' && cogs > price) price = cogs
  }

  let priceWarning = null
  if (lastFreeInput === 'price' && s.isBaselineLocked && priceMode) {
    const elastic = computeElasticity({
      price,
      dynamicBaselinePrice: s.storedBaselineData.price,
      tDropFactor: s.storedBaselineData.tDrop,
      crDropFactor: s.storedBaselineData.crDrop,
      initialTrafficBeforeDrag: s.storedBaselineData.traffic,
      initialCrBeforeDrag: s.storedBaselineData.cr * 100,
    })
    if (elastic) {
      traffic = elastic.targetTraffic
      cr = elastic.targetCr
      priceWarning = elastic
    }
  }

  if (s.locks.rev || s.locks.gp) {
    const anchorT = s.isBaselineLocked ? s.storedBaselineData.traffic : s.initialTrafficBeforeDrag
    const anchorCrPct = s.isBaselineLocked ? s.storedBaselineData.cr * 100 : s.initialCrBeforeDrag
    const solved = solveConstraints({
      price, cogs, traffic, cr: cr / 100, fixed: s.fixed, retention: s.retention / 100,
      mktTab: s.mktTab, mkt: s.mkt,
      targetRev: s.targetRev, targetGp: s.targetGp,
      lockRev: s.locks.rev, lockGp: s.locks.gp,
      lastFreeInput,
      biz, anchorT, anchorCr: anchorCrPct / 100, splitRatio: s.splitRatio / 100,
    })
    if (solved) {
      traffic = solved.traffic
      cr = solved.cr * 100
    }
  }

  return { ...s, price, cogs, traffic, cr, blendedPct, priceWarning }
}

function applyParetoAdjustmentIfNeeded(s) {
  if (!s.locks.gp || s.targetGp <= 0) return s
  const biz = BIZ[s.bizCat]
  const unitsNeeded = calcUnitsNeededForTarget(s.price, s.cogs, s.cr / 100, s.retention / 100, s.targetGp, s.mktTab, s.mkt)
  const dist = calcBalancedDistribution(unitsNeeded, s.traffic, s.cr / 100, biz, s.splitRatio / 100)
  return { ...s, traffic: dist.traffic, cr: dist.cr * 100, locks: { ...s.locks, traffic: false, cr: false }, lastFreeInput: 'traffic' }
}

function resetBenchmarks(s) {
  if (s.isBaselineLocked) {
    return { ...s, initialTrafficBeforeDrag: s.storedBaselineData.traffic, initialCrBeforeDrag: s.storedBaselineData.cr * 100 }
  }
  return { ...s, initialTrafficBeforeDrag: s.traffic, initialCrBeforeDrag: s.cr }
}

function reducer(state, action) {
  switch (action.type) {
    case 'EDIT': {
      const next = { ...state, [action.field]: action.value, lastFreeInput: action.field }
      return applyDerivation(next)
    }
    case 'EDIT_SIDE': {
      // retention/fixed: no lastFreeInput change, no margin coupling needed
      const next = { ...state, [action.field]: action.value }
      return applyDerivation(next)
    }
    case 'SET_BIZ_CAT': {
      const biz = BIZ[action.value]
      let next = { ...state, bizCat: action.value, splitRatio: biz.splitDefault * 100 }
      if (!next.customElastActive) next.cr = biz.crNorm
      next = resetBenchmarks(next)
      next = applyDerivation(next)
      next = applyParetoAdjustmentIfNeeded(next)
      return next
    }
    case 'SET_BIZ_DETAIL':
      return { ...state, bizDetail: action.value }
    case 'TOGGLE_CUSTOM_ELAST':
      return { ...state, customElastActive: !state.customElastActive }
    case 'SET_CELAST':
      return { ...state, [action.field]: action.value }
    case 'TOGGLE_PRICE_MODE':
      return applyDerivation({ ...state, priceMode: !state.priceMode })
    case 'TOGGLE_CAP_MODE': {
      const nextMode = state.capMode === 'strict' ? 'allow' : 'strict'
      let next = { ...state, capMode: nextMode }
      if (nextMode === 'strict' && next.cogs > next.price) next.price = next.cogs
      return next
    }
    case 'TOGGLE_LOCK': {
      const key = action.key
      let locks = { ...state.locks }
      if (key === 'rev' && locks.gp) locks.gp = false
      if (key === 'gp' && locks.rev) locks.rev = false
      locks[key] = !locks[key]
      let next = { ...state, locks }
      if (key === 'gp' && locks.gp) next = applyParetoAdjustmentIfNeeded(next)
      return applyDerivation(next)
    }
    case 'SET_TARGET':
      return applyDerivation({ ...state, [action.key === 'rev' ? 'targetRev' : 'targetGp']: action.value })
    case 'SET_MKT_TAB':
      return applyDerivation({ ...state, mktTab: action.value })
    case 'SET_MKT_FIELD': {
      const mkt = { ...state.mkt, [action.field]: action.value }
      if (action.field === 'affPct' && action.value > 0) mkt.affFix = 0
      if (action.field === 'affFix' && action.value > 0) mkt.affPct = 0
      return applyDerivation({ ...state, mkt })
    }
    case 'LOCK_BASELINE': {
      if (state.isBaselineLocked) {
        return { ...state, isBaselineLocked: false, capMode: 'strict' }
      }
      const mods = getElastModifiers(state)
      const storedBaselineData = {
        price: state.price, cogs: state.cogs, traffic: state.traffic, cr: state.cr / 100,
        fixed: state.fixed, retention: state.retention / 100, tDrop: mods.tDrop, crDrop: mods.crDrop,
      }
      return {
        ...state,
        isBaselineLocked: true,
        capMode: 'allow',
        storedBaselineData,
        initialTrafficBeforeDrag: state.traffic,
        initialCrBeforeDrag: state.cr,
      }
    }
    case 'RESTORE_BASELINE': {
      if (!state.isBaselineLocked) return state
      const b = state.storedBaselineData
      let next = {
        ...state,
        price: b.price, cogs: b.cogs, traffic: b.traffic, cr: b.cr * 100,
        fixed: b.fixed, retention: b.retention * 100,
      }
      next = resetBenchmarks(next)
      return applyDerivation(next)
    }
    case 'SET_SPLIT_RATIO':
      return applyDerivation({ ...state, splitRatio: action.value })
    case 'APPLY_PARETO_PRESET': {
      const biz = BIZ[state.bizCat]
      const anchorT = state.isBaselineLocked ? state.storedBaselineData.traffic : state.initialTrafficBeforeDrag
      const anchorCr = (state.isBaselineLocked ? state.storedBaselineData.cr * 100 : state.initialCrBeforeDrag) / 100
      const unitsNeeded = calcUnitsNeededForTarget(state.price, state.cogs, state.cr / 100, state.retention / 100, state.targetGp, state.mktTab, state.mkt)
      const crMin = biz.crMin / 100
      const crMax = biz.crMax / 100
      let finalT = anchorT
      let finalCr = anchorCr
      let locks = { ...state.locks }
      let lastFreeInput = state.lastFreeInput

      if (action.option === 'A') {
        finalCr = unitsNeeded / anchorT
        if (finalCr > crMax) { finalCr = crMax; finalT = crMax > 0 ? unitsNeeded / crMax : 0 }
        else if (finalCr < crMin) { finalCr = crMin; finalT = crMin > 0 ? unitsNeeded / crMin : 0 }
        locks.cr = false; locks.traffic = true; lastFreeInput = 'cr'
      } else if (action.option === 'B') {
        finalT = anchorCr > 0 ? unitsNeeded / anchorCr : 0
        if (finalT > 1000000) { finalT = 1000000; finalCr = Math.min(crMax, unitsNeeded / 1000000) }
        locks.traffic = false; locks.cr = true; lastFreeInput = 'traffic'
      } else {
        const dist = calcBalancedDistribution(unitsNeeded, anchorT, anchorCr, biz, state.splitRatio / 100)
        finalT = dist.traffic; finalCr = dist.cr
        locks.traffic = false; locks.cr = false; lastFreeInput = 'traffic'
      }

      return applyDerivation({ ...state, traffic: finalT, cr: finalCr * 100, locks, lastFreeInput })
    }
    case 'SAVE_SCENARIO': {
      const inputs = { price: state.price, cogs: state.cogs, traffic: state.traffic, cr: state.cr / 100, fixed: state.fixed, retention: state.retention / 100 }
      const m = calcMetrics(inputs.price, inputs.cogs, inputs.traffic, inputs.cr, inputs.fixed, inputs.retention, state.mktTab, state.mkt)
      let savedScenarios = [...state.savedScenarios]
      if (savedScenarios.length >= 5) savedScenarios.shift()
      savedScenarios.push({ label: `Skenario ${savedScenarios.length + 1}`, ...inputs, grossProfit: m.grossProfit })
      return { ...state, savedScenarios }
    }
    case 'CLEAR_SCENARIOS':
      return { ...state, savedScenarios: [] }
    case 'SET_REPORT_FORMAT':
      return { ...state, reportFormat: action.value }
    case 'SET_OWNER_REPORT_FORMAT':
      return { ...state, ownerReportFormat: action.value }
    default:
      return state
  }
}

export default function MarketingSimulator() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const biz = BIZ[state.bizCat]
  const mods = getElastModifiers(state)

  const inputs = useMemo(() => ({
    price: state.price, cogs: state.cogs, traffic: state.traffic, cr: state.cr / 100,
    fixed: state.fixed, retention: state.retention / 100, mktTab: state.mktTab, mkt: state.mkt,
  }), [state.price, state.cogs, state.traffic, state.cr, state.fixed, state.retention, state.mktTab, state.mkt])

  const m = useMemo(() => calcMetrics(inputs.price, inputs.cogs, inputs.traffic, inputs.cr, inputs.fixed, inputs.retention, inputs.mktTab, inputs.mkt), [inputs])

  const isLoss = state.cogs > state.price
  const isBreakEven = state.cogs === state.price

  const chartData = useMemo(() => {
    if (!state.priceMode) return null
    const pricePoints = []
    const profitPoints = []
    const baseProfitPoints = []
    let currentBaselineIndex = null

    for (let i = -4; i <= 4; i++) {
      const factor = 1 + i * 0.08
      const testPrice = state.price * factor
      let testTraffic = state.traffic
      let testCR = inputs.cr

      if (state.isBaselineLocked) {
        const priceRatio = testPrice / state.storedBaselineData.price
        const smoothedIntervals = Math.log(priceRatio) / Math.log(1.10)
        testTraffic = Math.max(10, state.traffic * (1 - smoothedIntervals * mods.tDrop))
        testCR = Math.max(0.001, inputs.cr * (1 - smoothedIntervals * mods.crDrop))
      }

      const gp = calcMetrics(testPrice, state.cogs, Math.max(10, testTraffic), Math.max(0.001, testCR), state.fixed, inputs.retention, state.mktTab, state.mkt).grossProfit
      pricePoints.push(Math.round(testPrice).toLocaleString('id-ID'))
      profitPoints.push(gp)

      if (state.isBaselineLocked) {
        const b = state.storedBaselineData
        let baseTraffic = b.traffic
        let baseCR = b.cr
        const priceRatio = testPrice / b.price
        const smoothedIntervals = Math.log(priceRatio) / Math.log(1.10)
        baseTraffic = Math.max(10, b.traffic * (1 - smoothedIntervals * b.tDrop))
        baseCR = Math.max(0.001, b.cr * (1 - smoothedIntervals * b.crDrop))
        baseProfitPoints.push(calcMetricsForBaseline(testPrice, b.cogs, Math.max(10, baseTraffic), Math.max(0.001, baseCR), b, state.mktTab, state.mkt))

        const baseFactor = b.price / state.price
        const fractionalI = (baseFactor - 1) / 0.08
        currentBaselineIndex = fractionalI + 4
      }
    }

    let baselineMeta = null
    if (state.isBaselineLocked && currentBaselineIndex !== null) {
      const b = state.storedBaselineData
      const bm = calcMetrics(b.price, b.cogs, b.traffic, b.cr, b.fixed, b.retention, state.mktTab, state.mkt)
      baselineMeta = { index: currentBaselineIndex, grossProfit: bm.grossProfit }
    }

    return { pricePoints, profitPoints, baseProfitPoints, baselineMeta }
  }, [state.priceMode, state.price, state.cogs, state.traffic, state.fixed, state.isBaselineLocked, state.storedBaselineData, state.mktTab, state.mkt, inputs.cr, inputs.retention, mods.tDrop, mods.crDrop])

  const paretoData = useMemo(() => {
    if (!state.locks.gp || state.targetGp <= 0) return null
    const anchorT = state.isBaselineLocked ? state.storedBaselineData.traffic : state.initialTrafficBeforeDrag
    const anchorCr = (state.isBaselineLocked ? state.storedBaselineData.cr * 100 : state.initialCrBeforeDrag) / 100
    return calcParetoOptions({ inputs, targetGp: state.targetGp, biz, anchorT, anchorCr, splitRatio: state.splitRatio / 100 })
  }, [state.locks.gp, state.targetGp, state.isBaselineLocked, state.storedBaselineData, state.initialTrafficBeforeDrag, state.initialCrBeforeDrag, inputs, biz, state.splitRatio])

  const { tips, ownerTip } = useMemo(() => buildAdvisoryTips({
    inputs, m, biz, bizCat: state.bizCat, isBaselineLocked: state.isBaselineLocked,
    storedBaselineData: state.storedBaselineData, savedScenarios: state.savedScenarios, mktTab: state.mktTab,
  }), [inputs, m, biz, state.bizCat, state.isBaselineLocked, state.storedBaselineData, state.savedScenarios, state.mktTab])

  const reportText = useMemo(() => buildReport({
    format: state.reportFormat, inputs, m, biz, bizDetail: state.bizDetail, tips,
    isBaselineLocked: state.isBaselineLocked, storedBaselineData: state.storedBaselineData, savedScenarios: state.savedScenarios,
  }), [state.reportFormat, inputs, m, biz, state.bizDetail, tips, state.isBaselineLocked, state.storedBaselineData, state.savedScenarios])

  const ownerReportText = useMemo(() => buildOwnerReport({
    format: state.ownerReportFormat, inputs, m, biz, bizDetail: state.bizDetail, tips, ownerTip,
    isBaselineLocked: state.isBaselineLocked, storedBaselineData: state.storedBaselineData, savedScenarios: state.savedScenarios,
  }), [state.ownerReportFormat, inputs, m, biz, state.bizDetail, tips, ownerTip, state.isBaselineLocked, state.storedBaselineData, state.savedScenarios])

  const baselineDeltas = useMemo(() => {
    if (!state.isBaselineLocked) return null
    const b = state.storedBaselineData
    return {
      price: ((state.price - b.price) / b.price) * 100,
      cogs: ((state.cogs - b.cogs) / b.cogs) * 100,
      traffic: ((state.traffic - b.traffic) / b.traffic) * 100,
      cr: (((state.cr) - (b.cr * 100)) / (b.cr * 100)) * 100,
    }
  }, [state.isBaselineLocked, state.storedBaselineData, state.price, state.cogs, state.traffic, state.cr])

  function edit(field, value) {
    dispatch({ type: 'EDIT', field, value })
  }
  function editSide(field, value) {
    dispatch({ type: 'EDIT_SIDE', field, value })
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // clipboard API unavailable — silently ignore, no backend fallback needed
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800">📊 Pepi Marketing Simulator v3</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Gunakan alat ini untuk mensimulasikan unit ekonomi bisnis Anda secara makro. Lakukan komparasi performa antara target profit, volume transaksi, dan AOV berdasarkan indikator tingkat elastisitas harga pasar secara real-time.
        </p>
      </div>

      {/* Setup & Konfigurasi Bisnis */}
      <div className="bg-white rounded-2xl p-6 border border-[#BDE2F7] shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">⚙️ Setup &amp; Konfigurasi Bisnis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Kategori Bisnis</label>
            <select
              value={state.bizCat}
              onChange={(e) => dispatch({ type: 'SET_BIZ_CAT', value: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200"
            >
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1.5">Nama / Deskripsi Bisnis Spesifik</label>
              <input
                type="text"
                value={state.bizDetail}
                onChange={(e) => dispatch({ type: 'SET_BIZ_DETAIL', value: e.target.value })}
                placeholder="Contoh: Brand Skincare Organik, Jasa Fotografi Wedding..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-gray-500">Indikator Elastisitas Sektoral Aktif</label>
              <label className="text-[11px] text-blue-600 flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={state.customElastActive} onChange={() => dispatch({ type: 'TOGGLE_CUSTOM_ELAST' })} /> Custom Elastisitas
              </label>
            </div>
            <div className="bg-[#F3F8FC] rounded-xl px-3 py-2.5 text-sm font-medium">
              {state.customElastActive
                ? `Custom Sektoral (Drop Traffic: -${state.celastT}% | Drop CR: -${state.celastCr}%)`
                : `${biz.label} (Default Industri: Drop Traffic -${biz.tDrop}% | Drop CR -${biz.crDrop}%)`}
            </div>
            {state.customElastActive && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-[11px] text-gray-500">Drop Traffic% (Per +10% Harga)</label>
                  <input type="number" min="0" max="100" value={state.celastT} onChange={(e) => dispatch({ type: 'SET_CELAST', field: 'celastT', value: +e.target.value || 0 })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500">Drop CR% (Per +10% Harga)</label>
                  <input type="number" min="0" max="100" value={state.celastCr} onChange={(e) => dispatch({ type: 'SET_CELAST', field: 'celastCr', value: +e.target.value || 0 })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(isLoss || isBreakEven) && (
        <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${isLoss ? 'bg-red-50 border border-red-300 text-red-700' : 'bg-amber-50 border border-amber-300 text-amber-700'}`}>
          <strong>{isLoss ? 'MARGIN NEGATIF (LOSS):' : 'BREAK EVEN POINT:'}</strong> HPP unit ({fmtRupiah(state.cogs)}) {isLoss ? 'melebihi' : 'menyamai'} Harga Jual ({fmtRupiah(state.price)}). Simulasi tetap menghitung proyeksi kerugian.
        </div>
      )}
      {state.priceWarning && (
        <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${state.priceWarning.isIncrease ? 'bg-red-50 border border-red-300 text-red-700' : 'bg-blue-50 border border-blue-300 text-blue-700'}`}>
          {state.priceWarning.isIncrease ? (
            <><strong>Efek Elastisitas (Penalti):</strong> Kenaikan harga +{state.priceWarning.priceDeltaPct.toFixed(0)}% menurunkan kapasitas pasar (Traffic: -{state.priceWarning.trafficDropPct.toFixed(1)}% | CR: -{state.priceWarning.crDropPct.toFixed(1)}%).</>
          ) : (
            <><strong>Efek Elastisitas (Insentif):</strong> Penurunan harga {Math.abs(state.priceWarning.priceDeltaPct).toFixed(0)}% meningkatkan potensi pasar (Traffic: +{Math.abs(state.priceWarning.trafficDropPct).toFixed(1)}% | CR: +{Math.abs(state.priceWarning.crDropPct).toFixed(1)}%).</>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        {/* Parameter panel */}
        <div className="bg-white rounded-2xl p-6 border border-[#BDE2F7] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">🎚️ Parameter Operasional &amp; Marketing</h2>
              <div className="flex gap-2">
                <button onClick={() => dispatch({ type: 'LOCK_BASELINE' })} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#BDE2F7] text-[#0c447c]">
                  🎯 {state.isBaselineLocked ? 'Lepas Baseline' : 'Kunci Baseline'}
                </button>
                {state.isBaselineLocked && (
                  <button onClick={() => dispatch({ type: 'RESTORE_BASELINE' })} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200">↺ Reset</button>
                )}
              </div>
            </div>

            {/* AOV */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button onClick={() => dispatch({ type: 'TOGGLE_LOCK', key: 'price' })} className={`w-6 h-6 rounded-lg border text-xs ${state.locks.price ? 'bg-amber-200 border-amber-400' : 'border-gray-200'}`}>{state.locks.price ? '🔒' : '🔓'}</button>
                  <label className="text-gray-600 font-medium">AOV / Harga Jual (Rp) {baselineDeltas && <span className="text-[10px] text-gray-400 font-normal">Awal: {fmtRupiah(state.storedBaselineData.price)} ({baselineDeltas.price >= 0 ? '+' : ''}{baselineDeltas.price.toFixed(0)}%)</span>}</label>
                </div>
                <input type="text" inputMode="numeric" value={formatRupiahString(Math.round(state.price))} onChange={(e) => edit('price', parseFormattedNum(e.target.value))} className="w-32 text-sm px-2 py-1.5 rounded-lg border border-gray-200 text-right" />
              </div>
              <input type="range" min={0} max={Math.max(2000000, state.price * 2)} step={1000} value={state.price} onChange={(e) => edit('price', +e.target.value)} className="w-full accent-[#BDE2F7]" />
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-[11px] font-semibold text-gray-500">Margin</span>
                <input type="number" min={1} max={99} value={Math.round(state.blendedPct)} onChange={(e) => dispatch({ type: 'EDIT', field: 'blendedPct', value: +e.target.value || 0 })} className="w-14 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#F3F8FC] border border-gray-200" />
                <span className="text-[11px] text-blue-600 font-semibold">%</span>
                <label className="text-[11px] text-gray-500 flex items-center gap-1 ml-2 cursor-pointer">
                  <input type="checkbox" checked={state.priceMode} onChange={() => dispatch({ type: 'TOGGLE_PRICE_MODE' })} /> <strong>Mode Harga</strong>
                </label>
                <button onClick={() => dispatch({ type: 'TOGGLE_CAP_MODE' })} className={`text-[10px] px-2 py-0.5 rounded-lg border ${state.capMode === 'allow' ? 'bg-[#BDE2F7] border-transparent' : 'border-gray-200'}`}>Izinkan HPP &gt; AOV</button>
              </div>
            </div>

            {/* COGS */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={() => dispatch({ type: 'TOGGLE_LOCK', key: 'cogs' })} className={`w-6 h-6 rounded-lg border text-xs ${state.locks.cogs ? 'bg-amber-200 border-amber-400' : 'border-gray-200'}`}>{state.locks.cogs ? '🔒' : '🔓'}</button>
                  <label className="text-gray-600 font-medium">HPP / COGS Unit (Rp) {baselineDeltas && <span className="text-[10px] text-gray-400 font-normal">Awal: {fmtRupiah(state.storedBaselineData.cogs)} ({baselineDeltas.cogs >= 0 ? '+' : ''}{baselineDeltas.cogs.toFixed(0)}%)</span>}</label>
                </div>
                <input type="text" inputMode="numeric" value={formatRupiahString(Math.round(state.cogs))} onChange={(e) => edit('cogs', parseFormattedNum(e.target.value))} className="w-32 text-sm px-2 py-1.5 rounded-lg border border-gray-200 text-right" />
              </div>
              <input type="range" min={0} max={Math.max(2000000, state.cogs * 2)} step={1000} value={state.cogs} onChange={(e) => edit('cogs', +e.target.value)} className="w-full accent-[#BDE2F7]" />
            </div>

            {/* Traffic */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={() => dispatch({ type: 'TOGGLE_LOCK', key: 'traffic' })} className={`w-6 h-6 rounded-lg border text-xs ${state.locks.traffic ? 'bg-amber-200 border-amber-400' : 'border-gray-200'}`}>{state.locks.traffic ? '🔒' : '🔓'}</button>
                  <label className="text-gray-600 font-medium">Traffic Inbound {baselineDeltas && <span className="text-[10px] text-gray-400 font-normal">Awal: {fmtCount(state.storedBaselineData.traffic)} ({baselineDeltas.traffic >= 0 ? '+' : ''}{baselineDeltas.traffic.toFixed(0)}%)</span>}</label>
                </div>
                <input type="text" inputMode="numeric" value={formatRupiahString(Math.round(state.traffic))} onChange={(e) => edit('traffic', Math.max(10, parseFormattedNum(e.target.value)))} className="w-32 text-sm px-2 py-1.5 rounded-lg border border-gray-200 text-right" />
              </div>
              <input type="range" min={100} max={Math.max(500000, state.traffic * 1.5)} step={100} value={state.traffic} onChange={(e) => edit('traffic', +e.target.value)} className="w-full accent-[#BDE2F7]" />
            </div>

            {/* CR */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={() => dispatch({ type: 'TOGGLE_LOCK', key: 'cr' })} className={`w-6 h-6 rounded-lg border text-xs ${state.locks.cr ? 'bg-amber-200 border-amber-400' : 'border-gray-200'}`}>{state.locks.cr ? '🔒' : '🔓'}</button>
                  <label className="text-gray-600 font-medium">Conversion Rate (%) {baselineDeltas && <span className="text-[10px] text-gray-400 font-normal">Awal: {(state.storedBaselineData.cr * 100).toFixed(1)}% ({baselineDeltas.cr >= 0 ? '+' : ''}{baselineDeltas.cr.toFixed(0)}%)</span>}</label>
                </div>
                <input type="number" step={0.1} value={state.cr} onChange={(e) => edit('cr', Math.max(0.1, +e.target.value || 0))} className="w-32 text-sm px-2 py-1.5 rounded-lg border border-gray-200 text-right" />
              </div>
              <input type="range" min={biz.crMin} max={biz.crMax} step={0.1} value={Math.min(biz.crMax, state.cr)} onChange={(e) => edit('cr', +e.target.value)} className="w-full accent-[#BDE2F7]" />
            </div>

            {/* Retention */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-600 font-medium">% Repeat Buyer (Retensi/bln)</label>
                <input type="number" min={0} max={80} value={state.retention} onChange={(e) => editSide('retention', +e.target.value || 0)} className="w-32 text-sm px-2 py-1.5 rounded-lg border border-gray-200 text-right" />
              </div>
              <input type="range" min={0} max={80} value={state.retention} onChange={(e) => editSide('retention', +e.target.value)} className="w-full accent-[#BDE2F7]" />
              {state.retention > 0 && <div className="text-[10px] text-gray-400 mt-0.5">Efek LTV: +{state.retention.toFixed(0)}% volume transaksi dari pelanggan lama.</div>}
            </div>

            <hr className="my-4 border-gray-100" />
            <div className="text-xs font-bold text-gray-500 uppercase mb-3">Target Reverse Solver (Batas Minimal)</div>

            <div className="mb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={() => dispatch({ type: 'TOGGLE_LOCK', key: 'rev' })} className={`w-6 h-6 rounded-lg border text-xs ${state.locks.rev ? 'bg-amber-200 border-amber-400' : 'border-gray-200'}`}>{state.locks.rev ? '🔒' : '🔓'}</button>
                  <label className="text-gray-600 font-medium">Target Omset Minimal (Rp)</label>
                </div>
                <input type="text" inputMode="numeric" placeholder="Set target..." value={state.targetRev ? formatRupiahString(state.targetRev) : ''} onChange={(e) => dispatch({ type: 'SET_TARGET', key: 'rev', value: parseFormattedNum(e.target.value) })} className="w-36 text-sm px-2 py-1.5 rounded-lg border border-gray-200 text-right" />
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={() => dispatch({ type: 'TOGGLE_LOCK', key: 'gp' })} className={`w-6 h-6 rounded-lg border text-xs ${state.locks.gp ? 'bg-amber-200 border-amber-400' : 'border-gray-200'}`}>{state.locks.gp ? '🔒' : '🔓'}</button>
                  <label className="text-gray-600 font-medium">Target Gross Profit Minimal (Rp)</label>
                </div>
                <input type="text" inputMode="numeric" placeholder="Set target..." value={state.targetGp ? formatRupiahString(state.targetGp) : ''} onChange={(e) => dispatch({ type: 'SET_TARGET', key: 'gp', value: parseFormattedNum(e.target.value) })} className="w-36 text-sm px-2 py-1.5 rounded-lg border border-gray-200 text-right" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => dispatch({ type: 'CLEAR_SCENARIOS' })} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200">🗑️ Hapus Semua</button>
              <button onClick={() => dispatch({ type: 'SAVE_SCENARIO' })} className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#BDE2F7] text-[#0c447c]">🔖 Simpan Skenario</button>
            </div>
          </div>
        </div>

        {/* Sweet spot chart */}
        {state.priceMode && chartData && (
          <div className="bg-white rounded-2xl p-6 border border-[#BDE2F7] shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">📈 Proyeksi Sweet Spot Kurva Maksimal</h2>
            <SweetSpotChart
              pricePoints={chartData.pricePoints}
              profitPoints={chartData.profitPoints}
              baseProfitPoints={chartData.baseProfitPoints}
              isBaselineLocked={state.isBaselineLocked}
              baselineMeta={chartData.baselineMeta}
            />
          </div>
        )}
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-[#F3F8FC] rounded-xl p-4"><div className="text-[11px] font-bold text-gray-500 uppercase">Total Volume Jual</div><div className="text-lg font-semibold text-gray-800">{fmtCount(m.totalQty)} Unit</div></div>
        <div className="bg-[#F3F8FC] rounded-xl p-4"><div className="text-[11px] font-bold text-gray-500 uppercase">Revenue Omset</div><div className="text-lg font-semibold text-gray-800">{fmtRupiah(m.totalRev)}</div></div>
        <div className="bg-[#F3F8FC] rounded-xl p-4"><div className="text-[11px] font-bold text-emerald-600 uppercase">Gross Profit</div><div className="text-lg font-semibold text-emerald-700">{fmtRupiah(m.grossProfit)}</div></div>
        <div className="bg-[#F3F8FC] rounded-xl p-4"><div className="text-[11px] font-bold text-gray-500 uppercase">Gross Margin %</div><div className="text-lg font-semibold text-gray-800">{fmtPercent(m.marginPct)}</div></div>
        <div className="bg-[#F3F8FC] rounded-xl p-4"><div className="text-[11px] font-bold text-amber-600 uppercase">Biaya Marketing</div><div className="text-lg font-semibold text-amber-700">{fmtRupiah(m.mktTotal)}</div></div>
      </div>

      {/* Marketing cost panel */}
      <div className="bg-white rounded-2xl p-6 border border-[#BDE2F7] shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">💵 Detail Biaya Finansial Pemasaran</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => dispatch({ type: 'SET_MKT_TAB', value: 'simple' })} className={`text-xs font-semibold px-3.5 py-2 rounded-xl border ${state.mktTab === 'simple' ? 'bg-[#BDE2F7] border-transparent text-[#0c447c]' : 'border-gray-200 text-gray-500'}`}>Simple</button>
          <button onClick={() => dispatch({ type: 'SET_MKT_TAB', value: 'adv' })} className={`text-xs font-semibold px-3.5 py-2 rounded-xl border ${state.mktTab === 'adv' ? 'bg-[#BDE2F7] border-transparent text-[#0c447c]' : 'border-gray-200 text-gray-500'}`}>Detail Lanjutan</button>
        </div>

        {state.mktTab === 'simple' ? (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Average Blended CPC (Rp)</label>
            <input type="text" inputMode="numeric" value={formatRupiahString(state.mkt.cpc)} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'cpc', value: parseFormattedNum(e.target.value) })} className="w-48 text-sm px-2 py-1.5 rounded-lg border border-gray-200" />
            <div className="text-[11px] text-gray-400 mt-1.5">ℹ️ Angka biaya per klik rata-rata terhitung proporsional terhadap total traffic campuran.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#BDE2F7] rounded-xl p-4">
              <div className="text-[11px] font-bold text-gray-500 mb-2">KLASTER A: Transaksi</div>
              <div className="mb-2"><label className="block text-xs text-gray-500">Platform Fee (%)</label><input type="number" step={0.1} value={state.mkt.plat} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'plat', value: +e.target.value || 0 })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Komisi Shopee/TikTok Shop (4-27%)</span></div>
              <div className="mb-2"><label className="block text-xs text-gray-500">Payment Gateway (%)</label><input type="number" step={0.1} value={state.mkt.pgw} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'pgw', value: +e.target.value || 0 })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Midtrans/Xendit/Website (1.5-3%)</span></div>
              <div><label className="block text-xs text-gray-500">Subsidi Ongkir (Rp)</label><input type="text" inputMode="numeric" value={formatRupiahString(state.mkt.ship)} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'ship', value: parseFormattedNum(e.target.value) })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Gunakan untuk menaikkan Konversi (CR)</span></div>
            </div>
            <div className="bg-white border border-[#BDE2F7] rounded-xl p-4">
              <div className="text-[11px] font-bold text-gray-500 mb-2">KLASTER B: Distribusi</div>
              <div className="mb-2"><label className="block text-xs text-gray-500">Komisi Affiliate (%)</label><input type="number" step={0.5} value={state.mkt.affPct} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'affPct', value: +e.target.value || 0 })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Cocok untuk E-commerce/B2B</span></div>
              <div className="mb-2"><label className="block text-xs text-gray-500">Komisi Sales Fix (Rp)</label><input type="text" inputMode="numeric" value={formatRupiahString(state.mkt.affFix)} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'affFix', value: parseFormattedNum(e.target.value) })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Cocok untuk Reseller/Sales Lapangan</span></div>
              <div><label className="block text-xs text-gray-500">Biaya Distribusi (Rp)</label><input type="text" inputMode="numeric" value={formatRupiahString(state.mkt.dist)} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'dist', value: parseFormattedNum(e.target.value) })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Biaya delivery armada sendiri per unit</span></div>
            </div>
            <div className="bg-white border border-[#BDE2F7] rounded-xl p-4 flex flex-col">
              <div className="text-[11px] font-bold text-gray-500 mb-2">KLASTER C: Akuisisi</div>
              <div className="mb-2"><label className="block text-xs text-gray-500">Digital Ads Spend (Rp)</label><input type="text" inputMode="numeric" value={formatRupiahString(state.mkt.ads)} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'ads', value: parseFormattedNum(e.target.value) })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Budget Meta/Google/TikTok Ads</span></div>
              <div className="mb-3"><label className="block text-xs text-gray-500">KOL / Event (Rp)</label><input type="text" inputMode="numeric" value={formatRupiahString(state.mkt.kol)} onChange={(e) => dispatch({ type: 'SET_MKT_FIELD', field: 'kol', value: parseFormattedNum(e.target.value) })} className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200" /><span className="text-[10px] text-gray-400">💡 Biaya endorsement/booth bulanan</span></div>
              <div className="bg-[#F3F8FC] border border-[#BDE2F7] rounded-lg p-3 text-center mt-auto">
                <div className="text-[11px] font-bold text-[#0c447c]">Blended ROAS (MER)</div>
                <div className="text-2xl font-bold text-[#0c447c]">{m.roas.toFixed(1)}x</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pareto matrix */}
      <div className="bg-white rounded-2xl p-6 border border-[#BDE2F7] shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">🎯 Matriks Titik Ungkit Sektoral &amp; Komparasi Pareto</h2>
        {!paretoData ? (
          <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Silakan isi <strong>Target Gross Profit Minimal (Rp)</strong> dan klik tombol kunci 🔓 di sebelah kiri untuk mengaktifkan analisis optimasi Pareto.
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-3">🎯 Target acuan Gross Profit minimum solver saat ini: <strong>{fmtRupiah(state.targetGp)}</strong> (Klik kartu opsi di bawah untuk menerapkan rekomendasi ke slider)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <button onClick={() => dispatch({ type: 'APPLY_PARETO_PRESET', option: 'A' })} className={`text-left border rounded-xl p-3.5 hover:border-amber-300 hover:-translate-y-0.5 transition ${paretoData.optionA.recommended ? 'border-2 border-emerald-300 bg-emerald-50' : 'border-[#BDE2F7]'}`}>
                <div className="text-xs font-semibold mb-1.5">Opsi A: Optimasi Konversi {paretoData.optionA.recommended && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded ml-1">Pareto</span>}</div>
                <div className="text-[10px] bg-lime-100 text-lime-800 inline-block px-2 py-0.5 rounded mb-1">Effort: {biz.effortCR}</div>
                <div className="text-xs font-semibold mt-1">CR Rasio: <strong>{(paretoData.optionA.cr * 100).toFixed(2)}%</strong></div>
                <div className="text-[11px] text-blue-600">Delta dari Baseline: {paretoData.optionA.crDelta >= 0 ? '+' : ''}{paretoData.optionA.crDelta.toFixed(1)}%</div>
              </button>
              <button onClick={() => dispatch({ type: 'APPLY_PARETO_PRESET', option: 'B' })} className={`text-left border rounded-xl p-3.5 hover:border-amber-300 hover:-translate-y-0.5 transition ${paretoData.optionB.recommended ? 'border-2 border-emerald-300 bg-emerald-50' : 'border-[#BDE2F7]'}`}>
                <div className="text-xs font-semibold mb-1.5">Opsi B: Scale Traffic {paretoData.optionB.recommended && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded ml-1">Pareto</span>}</div>
                <div className="text-[10px] bg-red-100 text-red-800 inline-block px-2 py-0.5 rounded mb-1">Effort: {biz.effortT}</div>
                <div className="text-xs font-semibold mt-1">Traffic: <strong>{fmtCount(paretoData.optionB.traffic)} /bln</strong></div>
                <div className="text-[11px] text-blue-600">Delta dari Baseline: {paretoData.optionB.tDelta >= 0 ? '+' : ''}{paretoData.optionB.tDelta.toFixed(1)}%</div>
              </button>
              <button onClick={() => dispatch({ type: 'APPLY_PARETO_PRESET', option: 'C' })} className="text-left border border-[#BDE2F7] rounded-xl p-3.5 hover:border-amber-300 hover:-translate-y-0.5 transition">
                <div className="text-xs font-semibold mb-1.5">Opsi C: Balanced Growth</div>
                <div className="text-[10px] bg-blue-100 text-blue-800 inline-block px-2 py-0.5 rounded mb-1">Effort: Seimbang</div>
                <div className="text-xs font-semibold mt-1">Traffic: <strong>{fmtCount(paretoData.optionC.traffic)}</strong></div>
                <div className="text-[11px] text-blue-600 mb-0.5">Delta T: {paretoData.optionC.tDelta >= 0 ? '+' : ''}{paretoData.optionC.tDelta.toFixed(1)}%</div>
                <div className="text-xs font-semibold">CR Rasio: <strong>{(paretoData.optionC.cr * 100).toFixed(2)}%</strong></div>
                <div className="text-[11px] text-blue-600">Delta CR: {paretoData.optionC.crDelta >= 0 ? '+' : ''}{paretoData.optionC.crDelta.toFixed(1)}%</div>
              </button>
            </div>
            <div className="p-3 bg-[#F3F8FC] rounded-lg mb-4">
              <label className="text-xs">Alokasi Distribusi Beban Opsi C (Traffic vs CR): <span className="text-blue-600 font-bold">{Math.round(state.splitRatio)}% Traffic / {Math.round(100 - state.splitRatio)}% CR</span></label>
              <input type="range" min={10} max={90} value={state.splitRatio} onChange={(e) => dispatch({ type: 'SET_SPLIT_RATIO', value: +e.target.value })} className="w-full accent-[#BDE2F7]" />
            </div>
          </>
        )}

        <div className="mt-2">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">📋 Tabel Evaluasi Komparasi Skenario</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b-2 border-gray-100 bg-[#F3F8FC]">Metrik Finansial</th>
                  <th className="text-right p-2 border-b-2 border-gray-100 bg-[#F3F8FC]">Skenario Aktif</th>
                  {state.isBaselineLocked && <th className="text-right p-2 border-b-2 border-gray-100 bg-amber-50 text-amber-700">Baseline Terkunci</th>}
                  {state.savedScenarios.map((s) => <th key={s.label} className="text-right p-2 border-b-2 border-gray-100 bg-[#F3F8FC]">{s.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const b = state.isBaselineLocked ? state.storedBaselineData : null
                  const bm = b ? calcMetrics(b.price, b.cogs, b.traffic, b.cr, b.fixed, b.retention, state.mktTab, state.mkt) : null
                  const rows = [
                    { label: 'Harga Jual', active: fmtRupiah(state.price), base: b && fmtRupiah(b.price), scen: (s) => fmtRupiah(s.price) },
                    { label: 'Traffic /bln', active: fmtCount(state.traffic), base: b && fmtCount(b.traffic), scen: (s) => fmtCount(s.traffic) },
                    { label: 'Conversion Rate', active: fmtPercent(state.cr), base: b && fmtPercent(b.cr * 100), scen: (s) => fmtPercent(s.cr * 100) },
                    { label: 'Gross Profit', active: fmtRupiah(m.grossProfit), base: bm && fmtRupiah(bm.grossProfit), scen: (s) => fmtRupiah(s.grossProfit), strong: true },
                  ]
                  return rows.map((r) => (
                    <tr key={r.label} className="hover:bg-[#FFF4EA]">
                      <td className="text-left p-2 border-b border-gray-100 text-gray-500 font-medium">{r.label}</td>
                      <td className={`text-right p-2 border-b border-gray-100 ${r.strong ? 'text-emerald-700 font-semibold' : ''}`}>{r.active}</td>
                      {state.isBaselineLocked && <td className={`text-right p-2 border-b border-gray-100 bg-amber-50/50 ${r.strong ? 'text-emerald-700 font-semibold' : ''}`}>{r.base}</td>}
                      {state.savedScenarios.map((s) => <td key={s.label} className={`text-right p-2 border-b border-gray-100 ${r.strong ? 'text-emerald-700 font-semibold' : ''}`}>{r.scen(s)}</td>)}
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Advisory */}
      <div className="bg-white rounded-2xl p-6 border border-[#BDE2F7] shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">✨ Papan Strategi Rekomendasi Taktis</h2>
        <div className="flex flex-col gap-2">
          {tips.length === 0 && <div className="text-sm text-gray-400">Belum ada rekomendasi — sesuaikan parameter di atas.</div>}
          {tips.map((t, i) => (
            <div key={i} className={`rounded-lg px-3.5 py-2.5 text-xs border-l-4 ${TONE_STYLES[t.tone] || TONE_STYLES.neutral}`}>{t.text}</div>
          ))}
        </div>
      </div>

      {/* Report panel */}
      <div className="bg-white rounded-2xl p-6 border border-[#BDE2F7] shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">🤖 Integrasi Laporan Chatbot AI (Narasi &amp; JSON Data)</h2>
        <div className="flex gap-2 mb-3">
          <button onClick={() => dispatch({ type: 'SET_REPORT_FORMAT', value: 'txt' })} className={`text-xs font-semibold px-3.5 py-2 rounded-xl border ${state.reportFormat === 'txt' ? 'bg-[#BDE2F7] border-transparent text-[#0c447c]' : 'border-gray-200 text-gray-500'}`}>Format Narasi Teks</button>
          <button onClick={() => dispatch({ type: 'SET_REPORT_FORMAT', value: 'json' })} className={`text-xs font-semibold px-3.5 py-2 rounded-xl border ${state.reportFormat === 'json' ? 'bg-[#BDE2F7] border-transparent text-[#0c447c]' : 'border-gray-200 text-gray-500'}`}>Format JSON Data Bersih</button>
        </div>
        <pre className="bg-[#1A1A1A] text-slate-200 text-xs rounded-lg p-3.5 max-h-[300px] overflow-auto whitespace-pre-wrap font-mono">{reportText}</pre>
        <button onClick={() => copyToClipboard(reportText)} className="mt-3 text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 hover:bg-[#FFF4EA]">📋 Copy Data Report</button>
      </div>

      {/* Owner panel */}
      <OwnerPanel
        fixed={state.fixed}
        onFixedChange={(v) => editSide('fixed', v)}
        netProfit={m.netProfit}
        totalRev={m.totalRev}
        ownerTip={ownerTip}
        ownerReportFormat={state.ownerReportFormat}
        onFormatChange={(v) => dispatch({ type: 'SET_OWNER_REPORT_FORMAT', value: v })}
        ownerReportText={ownerReportText}
        onCopy={() => copyToClipboard(ownerReportText)}
      />
    </div>
  )
}

function OwnerPanel({ fixed, onFixedChange, netProfit, totalRev, ownerTip, ownerReportFormat, onFormatChange, ownerReportText, onCopy }) {
  const netMarginText = netProfit > 0 && totalRev > 0 ? ` (${((netProfit / totalRev) * 100).toFixed(1)}% dari Omset)` : ''
  return (
    <details className="mt-8 group">
      <summary className="flex justify-end px-1 py-1 text-[10px] font-medium text-gray-400 opacity-30 hover:opacity-80 transition-opacity cursor-pointer select-none list-none">📊 Detail Biaya & Profit</summary>
      <div className="border border-[#BDE2F7] rounded-2xl bg-white mt-2 overflow-hidden p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="bg-white border border-[#BDE2F7] rounded-xl p-4">
            <div className="text-[11px] font-bold text-gray-500 mb-2">Biaya Operasional Tetap / Fixed Cost (Rp)</div>
            <input type="text" inputMode="numeric" value={formatRupiahString(fixed)} onChange={(e) => onFixedChange(parseFormattedNum(e.target.value))} className="w-full text-lg font-bold px-3 py-3 rounded-xl border border-[#BDE2F7]" />
          </div>
          <div className="bg-white border border-[#BDE2F7] rounded-xl p-4">
            <div className="text-[11px] font-bold text-amber-600 mb-2">Net Profit Finansial Perusahaan</div>
            <div className={`text-lg font-bold px-3 py-3 rounded-xl border border-[#BDE2F7] min-h-[54px] flex items-center ${netProfit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {fmtRupiah(netProfit)}<span className="text-xs font-normal text-gray-500 ml-1">{netMarginText}</span>
            </div>
          </div>
        </div>

        {ownerTip && (
          <div className={`rounded-lg px-3.5 py-3 text-sm border-l-4 mt-4 ${TONE_STYLES[ownerTip.tone] || TONE_STYLES.danger}`}>{ownerTip.text}</div>
        )}

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-2.5">🤖 Mega-Prompt AI: Laporan Strategis Owner</h3>
          <div className="flex gap-2 mb-2.5">
            <button onClick={() => onFormatChange('txt')} className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border ${ownerReportFormat === 'txt' ? 'bg-[#BDE2F7] border-transparent text-[#0c447c]' : 'border-gray-200 text-gray-500'}`}>Format Narasi Prompt</button>
            <button onClick={() => onFormatChange('json')} className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border ${ownerReportFormat === 'json' ? 'bg-[#BDE2F7] border-transparent text-[#0c447c]' : 'border-gray-200 text-gray-500'}`}>Format JSON Owner</button>
          </div>
          <pre className="bg-slate-900 text-slate-200 text-[11px] rounded-lg p-3.5 max-h-[250px] overflow-auto whitespace-pre-wrap font-mono">{ownerReportText}</pre>
          <button onClick={onCopy} className="mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-[#FFF4EA]">📋 Salin Laporan Strategis Owner</button>
        </div>
      </div>
    </details>
  )
}
