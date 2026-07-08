// Shared Rupiah/number formatting helpers used across the marketing tools.

export function formatRupiahString(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function parseFormattedNum(str) {
  if (str === undefined || str === null) return 0
  return parseFloat(str.toString().replace(/\./g, '')) || 0
}

export function fmtRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID')
}

export function fmtCount(n) {
  return Math.round(n || 0).toLocaleString('id-ID')
}

export function fmtPercent(n) {
  return (n || 0).toFixed(2) + '%'
}
