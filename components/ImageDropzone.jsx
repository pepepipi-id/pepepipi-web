'use client'

import { useRef, useState } from 'react'

export default function ImageDropzone({ existingUrl, onSelect, onRemove }) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  function handleFile(selected) {
    if (!selected.type.startsWith('image/')) {
      alert('File harus berupa gambar!')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target.result)
    reader.readAsDataURL(selected)
    onSelect(selected)
  }

  function handleRemove(e) {
    e.stopPropagation()
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRemove()
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        const files = e.dataTransfer.files
        if (files.length) handleFile(files[0])
      }}
      className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100/50 hover:border-[#5CA7D4] transition cursor-pointer relative overflow-hidden group ${dragActive ? 'border-[#5CA7D4] bg-blue-50/30' : 'border-gray-200'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => { if (e.target.files.length) handleFile(e.target.files[0]) }}
      />

      {(previewUrl || existingUrl) && (
        <img src={previewUrl || existingUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
      )}

      {!previewUrl && !existingUrl && (
        <div className="text-center pointer-events-none space-y-1">
          <span className="text-2xl block">📸</span>
          <p className="text-xs font-semibold text-gray-600">Drag & Drop gambar ke sini</p>
          <p className="text-[10px] text-gray-400">Atau klik untuk pilih file</p>
        </div>
      )}

      {previewUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition"
        >
          Hapus X
        </button>
      )}

      {!previewUrl && existingUrl && (
        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg">
          Klik untuk ganti foto
        </span>
      )}
    </div>
  )
}
