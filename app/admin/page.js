import AdminGate from '../../components/AdminGate'

export const metadata = {
  title: '✨ Admin Panel Pepepipi',
}

export default function AdminPage() {
  return (
    <div className="bg-[#FAFAF8] text-gray-800 antialiased min-h-screen py-10 px-4">
      <AdminGate />
    </div>
  )
}
