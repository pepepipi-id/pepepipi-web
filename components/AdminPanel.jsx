'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/uploadImage'
import ImageDropzone from './ImageDropzone'

const TABS = [
  { id: 'produk', label: '🛍️ Produk' },
  { id: 'aktivitas', label: '🧩 Ide Aktivitas' },
  { id: 'testimoni', label: '💬 Testimoni' },
]

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('produk')

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition ${
              activeTab === tab.id
                ? 'bg-white text-[#5CA7D4] border border-b-0 border-gray-100'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'produk' && <ProdukTab />}
      {activeTab === 'aktivitas' && <AktivitasTab />}
      {activeTab === 'testimoni' && <TestimoniTab />}
    </div>
  )
}

function StatusBanner({ statusMsg }) {
  if (!statusMsg) return null
  return (
    <div className={`p-3 rounded-xl mb-4 text-xs font-medium block ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {statusMsg.text}
    </div>
  )
}

/* ============================= PRODUK TAB ============================= */

function ProdukTab() {
  const [editingId, setEditingId] = useState(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState(null)
  const [nama, setNama] = useState('')
  const [kategori, setKategori] = useState('aktivitas')
  const [harga, setHarga] = useState('')
  const [labelTerjual, setLabelTerjual] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [statusMsg, setStatusMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [dropzoneKey, setDropzoneKey] = useState(0)

  const [aktivitasItems, setAktivitasItems] = useState([])
  const [hampersItems, setHampersItems] = useState([])
  const [loadingList, setLoadingList] = useState(true)

  async function fetchAndRenderProducts() {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAktivitasItems(products.filter((p) => p.kategori && p.kategori.toLowerCase() === 'aktivitas'))
      setHampersItems(products.filter((p) => p.kategori && p.kategori.toLowerCase() === 'hampers'))
    } catch (err) {
      console.error('Gagal memuat daftar produk:', err.message)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchAndRenderProducts()
  }, [])

  async function deleteProduct(id, nama) {
    if (!confirm(`Apakah kamu yakin ingin menghapus "${nama}"?`)) return
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('foto_url')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (product.foto_url && !product.foto_url.includes('placehold.co')) {
        const fileName = product.foto_url.split('/').pop()
        const { error: storageError } = await supabase.storage
          .from('pepepipi-assets')
          .remove([fileName])
        if (storageError) throw storageError
      }

      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error

      fetchAndRenderProducts()
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  function resetForm() {
    setEditingId(null)
    setExistingFotoUrl(null)
    setNama('')
    setKategori('aktivitas')
    setHarga('')
    setLabelTerjual('')
    setImageFile(null)
    setDropzoneKey((k) => k + 1)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setExistingFotoUrl(item.foto_url)
    setNama(item.nama_produk || '')
    setKategori((item.kategori || 'aktivitas').toLowerCase())
    setHarga(item.harga ?? '')
    setLabelTerjual(item.label_terjual || '')
    setImageFile(null)
    setStatusMsg(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!editingId && !imageFile) {
      setStatusMsg({ type: 'error', text: 'Semua field wajib diisi termasuk foto produk.' })
      return
    }

    setSubmitting(true)
    setStatusMsg(null)

    try {
      const finalImageUrl = imageFile ? await uploadImage(imageFile) : existingFotoUrl

      const formattedKategori = kategori.charAt(0).toUpperCase() + kategori.slice(1)

      const payload = {
        nama_produk: nama,
        kategori: formattedKategori,
        harga: parseInt(harga),
        label_terjual: labelTerjual,
        foto_url: finalImageUrl,
      }

      if (editingId) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', editingId)
        if (updateError) throw updateError
        setStatusMsg({ type: 'success', text: `Berhasil memperbarui "${nama}"!` })
      } else {
        const { error: insertError } = await supabase.from('products').insert([{ ...payload, is_active: true }])
        if (insertError) throw insertError
        setStatusMsg({ type: 'success', text: `Berhasil menambahkan "${nama}"!` })
      }

      resetForm()
      fetchAndRenderProducts()
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Gagal: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-10">
        <h2 className="text-xl font-bold text-[#5CA7D4] mb-6">
          {editingId ? '✏️ Edit Produk' : '🚀 Input Produk Baru'}
        </h2>

        <StatusBanner statusMsg={statusMsg} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Nama Produk</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              type="text"
              placeholder="Contoh: Sensory Play Kit"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            >
              <option value="aktivitas">Aktivitas Anak (Kartu Biru)</option>
              <option value="hampers">Paket Hampers (Kartu Oranye)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Harga (Rp)</label>
            <input
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              type="number"
              placeholder="Contoh: 85000"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Label Terjual</label>
            <input
              value={labelTerjual}
              onChange={(e) => setLabelTerjual(e.target.value)}
              type="text"
              placeholder="Contoh: 620"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">Cukup angka. Kata "Terjual" dan tanda + ditambahkan otomatis di halaman utama.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Foto Produk</label>
            <ImageDropzone key={dropzoneKey} existingUrl={existingFotoUrl} onSelect={setImageFile} onRemove={() => setImageFile(null)} />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#5CA7D4] hover:bg-[#4b96c2] text-white py-2.5 rounded-xl font-bold shadow-sm transition cursor-pointer text-center block disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : editingId ? 'Update Produk' : 'Simpan ke Supabase'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductList title="Aktivitas Anak" dotColor="bg-[#5CA7D4]" countColor="bg-blue-50 text-[#5CA7D4]" items={aktivitasItems} loading={loadingList} emptyText="Belum ada data aktivitas" onDelete={deleteProduct} onEdit={startEdit} />
        <ProductList title="Paket Hampers" dotColor="bg-orange-400" countColor="bg-orange-50 text-orange-500" items={hampersItems} loading={loadingList} emptyText="Belum ada data hampers" onDelete={deleteProduct} onEdit={startEdit} />
      </div>
    </div>
  )
}

function ProductList({ title, dotColor, countColor, items, loading, emptyText, onDelete, onEdit }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${dotColor}`}></span> {title}
        </h3>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${countColor}`}>{items.length}</span>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {loading && <p className="text-sm text-gray-400 italic text-center py-4">Memuat data...</p>}
        {!loading && items.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-4">{emptyText}</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition group">
            <div className="min-w-0 flex-1 pr-2 flex items-center gap-3">
              <img
                src={item.foto_url}
                className="w-10 h-10 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image' }}
                alt={item.nama_produk || 'Produk'}
              />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-800 truncate">{item.nama_produk || 'Tanpa Nama'}</h4>
                <p className="text-xs text-gray-500 font-medium">Rp {Number(item.harga).toLocaleString('id-ID')}</p>
                <p className="text-[11px] text-orange-500 font-semibold">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">
                    🔥 Terjual {item.label_terjual || '0'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 opacity-80 md:opacity-0 group-hover:opacity-100">
              <button
                onClick={() => onEdit(item)}
                className="text-xs text-[#5CA7D4] hover:text-[#4b96c2] font-medium cursor-pointer p-1 rounded hover:bg-blue-50 transition"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => onDelete(item.id, item.nama_produk || 'Produk')}
                className="text-xs text-red-400 hover:text-red-600 font-medium cursor-pointer p-1 rounded hover:bg-red-50 transition"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================= AKTIVITAS TAB ============================= */

function AktivitasTab() {
  const [ideas, setIdeas] = useState([])
  const [loadingIdeas, setLoadingIdeas] = useState(true)

  const [usia, setUsia] = useState('5 Tahun')
  const [durasi, setDurasi] = useState('20 Menit')
  const [lokasi, setLokasi] = useState('Dalam Rumah')
  const [judul, setJudul] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [dropzoneKey, setDropzoneKey] = useState(0)
  const [statusMsg, setStatusMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [selectedIdeaId, setSelectedIdeaId] = useState('')
  const [materials, setMaterials] = useState([])
  const [namaBarang, setNamaBarang] = useState('')
  const [hargaBarang, setHargaBarang] = useState('')
  const [materialImageFile, setMaterialImageFile] = useState(null)
  const [materialDropzoneKey, setMaterialDropzoneKey] = useState(0)
  const [materialStatusMsg, setMaterialStatusMsg] = useState(null)
  const [materialSubmitting, setMaterialSubmitting] = useState(false)

  async function fetchIdeas() {
    try {
      const { data, error } = await supabase
        .from('activity_ideas')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setIdeas(data || [])
    } catch (err) {
      console.error('Gagal memuat ide aktivitas:', err.message)
    } finally {
      setLoadingIdeas(false)
    }
  }

  async function fetchMaterials(activityId) {
    if (!activityId) {
      setMaterials([])
      return
    }
    const { data } = await supabase
      .from('activity_materials')
      .select('*')
      .eq('activity_id', activityId)
    setMaterials(data || [])
  }

  useEffect(() => {
    fetchIdeas()
  }, [])

  useEffect(() => {
    fetchMaterials(selectedIdeaId)
  }, [selectedIdeaId])

  async function deleteIdea(id, title) {
    if (!confirm(`Hapus ide aktivitas "${title}"? Bahan terkait juga akan terhapus.`)) return
    try {
      await supabase.from('activity_materials').delete().eq('activity_id', id)
      const { error } = await supabase.from('activity_ideas').delete().eq('id', id)
      if (error) throw error
      if (selectedIdeaId === id) setSelectedIdeaId('')
      fetchIdeas()
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  async function deleteMaterial(id) {
    if (!confirm('Hapus bahan ini?')) return
    try {
      const { error } = await supabase.from('activity_materials').delete().eq('id', id)
      if (error) throw error
      fetchMaterials(selectedIdeaId)
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  async function handleIdeaSubmit(e) {
    e.preventDefault()
    if (!imageFile) {
      setStatusMsg({ type: 'error', text: 'Foto aktivitas wajib diisi.' })
      return
    }

    setSubmitting(true)
    setStatusMsg(null)

    try {
      const fotoUrl = await uploadImage(imageFile)

      const { error } = await supabase.from('activity_ideas').insert([
        {
          usia,
          durasi,
          lokasi,
          judul_aktivitas: judul,
          foto_aktivitas: fotoUrl,
          is_active: true,
        },
      ])

      if (error) throw error

      setStatusMsg({ type: 'success', text: `Berhasil menambahkan "${judul}"!` })
      setJudul('')
      setImageFile(null)
      setDropzoneKey((k) => k + 1)
      fetchIdeas()
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Gagal: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMaterialSubmit(e) {
    e.preventDefault()
    if (!selectedIdeaId) {
      setMaterialStatusMsg({ type: 'error', text: 'Pilih ide aktivitas dulu.' })
      return
    }
    if (!materialImageFile) {
      setMaterialStatusMsg({ type: 'error', text: 'Foto bahan wajib diisi.' })
      return
    }

    setMaterialSubmitting(true)
    setMaterialStatusMsg(null)

    try {
      const fotoUrl = await uploadImage(materialImageFile)

      const { error } = await supabase.from('activity_materials').insert([
        {
          activity_id: selectedIdeaId,
          nama_barang: namaBarang,
          harga: parseInt(hargaBarang),
          foto_url: fotoUrl,
        },
      ])

      if (error) throw error

      setMaterialStatusMsg({ type: 'success', text: `Berhasil menambahkan "${namaBarang}"!` })
      setNamaBarang('')
      setHargaBarang('')
      setMaterialImageFile(null)
      setMaterialDropzoneKey((k) => k + 1)
      fetchMaterials(selectedIdeaId)
    } catch (err) {
      setMaterialStatusMsg({ type: 'error', text: 'Gagal: ' + err.message })
    } finally {
      setMaterialSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-[#5CA7D4] mb-6">🧩 Input Ide Aktivitas</h2>

          <StatusBanner statusMsg={statusMsg} />

          <form onSubmit={handleIdeaSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Judul Aktivitas</label>
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                type="text"
                placeholder="Contoh: Bermain Pasir Kinetik"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Usia Anak</label>
              <select value={usia} onChange={(e) => setUsia(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]">
                <option value="3 Tahun">3 Tahun</option>
                <option value="5 Tahun">5 Tahun</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Durasi</label>
              <select value={durasi} onChange={(e) => setDurasi(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]">
                <option value="20 Menit">20 Menit</option>
                <option value="45 Menit">45 Menit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Lokasi</label>
              <select value={lokasi} onChange={(e) => setLokasi(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]">
                <option value="Dalam Rumah">Dalam Rumah</option>
                <option value="Luar Rumah">Luar Rumah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Foto Aktivitas</label>
              <ImageDropzone key={dropzoneKey} onSelect={setImageFile} onRemove={() => setImageFile(null)} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5CA7D4] hover:bg-[#4b96c2] text-white py-2.5 rounded-xl font-bold shadow-sm transition cursor-pointer text-center block disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Ide Aktivitas'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-bold text-gray-800">📋 Daftar Ide Aktivitas</h3>
            <span className="text-xs font-bold bg-blue-50 text-[#5CA7D4] px-2.5 py-0.5 rounded-full">{ideas.length}</span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loadingIdeas && <p className="text-sm text-gray-400 italic text-center py-4">Memuat data...</p>}
            {!loadingIdeas && ideas.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4">Belum ada ide aktivitas</p>
            )}
            {ideas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => setSelectedIdeaId(idea.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition group cursor-pointer ${selectedIdeaId === idea.id ? 'border-[#5CA7D4] bg-blue-50/40' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}
              >
                <div className="min-w-0 flex-1 pr-2 flex items-center gap-3">
                  <img
                    src={idea.foto_aktivitas}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image' }}
                    alt={idea.judul_aktivitas}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{idea.judul_aktivitas}</h4>
                    <p className="text-xs text-gray-500">{idea.usia} · {idea.durasi} · {idea.lokasi}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteIdea(idea.id, idea.judul_aktivitas) }}
                  className="text-xs text-red-400 hover:text-red-600 font-medium cursor-pointer p-1 rounded hover:bg-red-50 transition opacity-80 md:opacity-0 group-hover:opacity-100"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-[#0c447c] mb-2">🛍️ Tambah Bahan Produk</h2>
          <p className="text-xs text-gray-500 mb-4">
            {selectedIdeaId ? 'Bahan untuk ide yang dipilih di kiri.' : 'Klik salah satu ide aktivitas di daftar untuk memilih.'}
          </p>

          <StatusBanner statusMsg={materialStatusMsg} />

          <form onSubmit={handleMaterialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Nama Barang</label>
              <input
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                type="text"
                placeholder="Contoh: Pasir Kinetik 1kg"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Harga (Rp)</label>
              <input
                value={hargaBarang}
                onChange={(e) => setHargaBarang(e.target.value)}
                type="number"
                placeholder="Contoh: 45000"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Foto Barang</label>
              <ImageDropzone key={materialDropzoneKey} onSelect={setMaterialImageFile} onRemove={() => setMaterialImageFile(null)} />
            </div>

            <button
              type="submit"
              disabled={materialSubmitting || !selectedIdeaId}
              className="w-full bg-[#0c447c] hover:bg-[#0b3a69] text-white py-2.5 rounded-xl font-bold shadow-sm transition cursor-pointer text-center block disabled:opacity-50"
            >
              {materialSubmitting ? 'Menyimpan...' : 'Simpan Bahan'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-bold text-gray-800">📦 Bahan untuk Ide Terpilih</h3>
            <span className="text-xs font-bold bg-blue-50 text-[#5CA7D4] px-2.5 py-0.5 rounded-full">{materials.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {!selectedIdeaId && (
              <p className="col-span-full text-xs text-gray-400 italic text-center py-4">Pilih ide aktivitas dulu di atas</p>
            )}
            {selectedIdeaId && materials.length === 0 && (
              <p className="col-span-full text-xs text-gray-400 italic text-center py-4">Belum ada bahan untuk ide ini</p>
            )}
            {materials.map((item) => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center relative group">
                <img
                  src={item.foto_url}
                  className="w-full h-16 object-cover rounded-lg mb-1 bg-gray-100"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image' }}
                  alt={item.nama_barang}
                />
                <p className="text-[11px] font-medium text-gray-700 truncate">{item.nama_barang}</p>
                <p className="text-[10px] text-[#d97706] font-bold">Rp {Number(item.harga).toLocaleString('id-ID')}</p>
                <button
                  onClick={() => deleteMaterial(item.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================= TESTIMONI TAB ============================= */

function TestimoniTab() {
  const [testimonials, setTestimonials] = useState([])
  const [loadingList, setLoadingList] = useState(true)

  const [nama, setNama] = useState('')
  const [isi, setIsi] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [dropzoneKey, setDropzoneKey] = useState(0)
  const [statusMsg, setStatusMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function fetchTestimonials() {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setTestimonials(data || [])
    } catch (err) {
      console.error('Gagal memuat testimoni:', err.message)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function deleteTestimonial(id) {
    if (!confirm('Hapus testimoni ini?')) return
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id)
      if (error) throw error
      fetchTestimonials()
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setSubmitting(true)
    setStatusMsg(null)

    try {
      let fotoUrl = null
      if (imageFile) {
        fotoUrl = await uploadImage(imageFile)
      }

      const { error } = await supabase.from('testimonials').insert([
        {
          nama_klien: nama,
          isi_testimoni: isi,
          foto_url: fotoUrl,
          is_active: true,
        },
      ])

      if (error) throw error

      setStatusMsg({ type: 'success', text: `Berhasil menambahkan testimoni dari "${nama}"!` })
      setNama('')
      setIsi('')
      setImageFile(null)
      setDropzoneKey((k) => k + 1)
      fetchTestimonials()
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Gagal: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
        <h2 className="text-xl font-bold text-[#5CA7D4] mb-6">💬 Input Testimoni</h2>

        <StatusBanner statusMsg={statusMsg} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Nama Pelanggan</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              type="text"
              placeholder="Contoh: Bunda Rani"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Isi Testimoni</label>
            <textarea
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              rows={4}
              placeholder="Tulis testimoni pelanggan di sini..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5CA7D4]"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Foto Pelanggan (opsional)</label>
            <ImageDropzone key={dropzoneKey} onSelect={setImageFile} onRemove={() => setImageFile(null)} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#5CA7D4] hover:bg-[#4b96c2] text-white py-2.5 rounded-xl font-bold shadow-sm transition cursor-pointer text-center block disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Testimoni'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-bold text-gray-800">📋 Daftar Testimoni</h3>
          <span className="text-xs font-bold bg-blue-50 text-[#5CA7D4] px-2.5 py-0.5 rounded-full">{testimonials.length}</span>
        </div>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {loadingList && <p className="text-sm text-gray-400 italic text-center py-4">Memuat data...</p>}
          {!loadingList && testimonials.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-4">Belum ada testimoni</p>
          )}
          {testimonials.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition group">
              <div className="min-w-0 flex-1 pr-2 flex items-start gap-3">
                {item.foto_url && (
                  <img src={item.foto_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt={item.nama_klien} />
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800">{item.nama_klien}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.isi_testimoni}</p>
                </div>
              </div>
              <button
                onClick={() => deleteTestimonial(item.id)}
                className="text-xs text-red-400 hover:text-red-600 font-medium cursor-pointer p-1 rounded hover:bg-red-50 transition opacity-80 md:opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
