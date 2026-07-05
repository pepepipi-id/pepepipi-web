'use client'

import { buildWaLink } from '../lib/wa'

export default function StickyWaBar() {
  return (
    <div className="sticky-cta-bar fixed bottom-0 left-0 right-0 md:hidden bg-warm-light border-t border-gray-200/50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] px-4 py-3">
      <a
        href={buildWaLink('Halo Pepepipi, saya tertarik tanya produknya!')}
        target="_blank"
        rel="noreferrer"
        className="btn-primary-pastel w-full flex items-center justify-center gap-2 rounded-full font-semibold text-sm py-3 shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 flex-shrink-0"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        Chat via WhatsApp
      </a>
    </div>
  )
}
