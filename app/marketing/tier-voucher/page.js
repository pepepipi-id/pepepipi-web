import Link from 'next/link'
import TierVoucherSimulator from '../../../components/tools/TierVoucherSimulator'

export const metadata = {
  title: 'Tier Voucher Simulator — Pepepipi Hub',
}

export default function TierVoucherPage() {
  return (
    <div className="bg-[#FAFAF8] text-gray-800 antialiased min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Link href="/marketing" className="text-sm font-semibold text-[#0B447C] hover:underline">← Kembali ke Hub</Link>
      </div>
      <TierVoucherSimulator />
    </div>
  )
}
