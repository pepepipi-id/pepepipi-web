import ProductCard from './cards/ProductCard'

export default function ProductFavorit1({ products }) {
  return (
    <section id="activities" className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">
          Aktivitas Anak Paling Seru
        </h2>
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-1">
          🔥 Paling Banyak Dicari Pekan Ini
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-6">
        {products.map((item) => (
          <ProductCard key={item.id} item={item} variant="aktivitas" />
        ))}
      </div>
    </section>
  )
}
