export function buildWaLink(message) {
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
}
