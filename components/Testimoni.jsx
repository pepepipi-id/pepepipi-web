import TestimonialCard from './cards/TestimonialCard'

export default function Testimoni({ testimonials }) {
  return (
    <section id="testimoni" className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">
          Apa Kata Bunda Lainnya
        </h2>
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-1">
          💬 Cerita dari Pelanggan Pepepipi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((item) => (
          <TestimonialCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
