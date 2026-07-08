import Link from 'next/link'
import MarketingSimulator from '../../../components/tools/MarketingSimulator'

export const metadata = {
  title: 'Marketing Simulator v3 — Pepepipi Hub',
}

export default function MarketingSimulatorPage() {
  return (
    <div className="bg-[#FAFAF8] text-gray-800 antialiased min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Link href="/marketing" className="text-sm font-semibold text-[#0B447C] hover:underline">← Kembali ke Hub</Link>
      </div>
      <MarketingSimulator />
    </div>
  )
}
