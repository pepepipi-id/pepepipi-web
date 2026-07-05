'use client'

import { useState } from 'react'
import { buildWaLink } from '../lib/wa'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-[#FAFAF8]/90 backdrop-blur-md sticky top-0 left-0 right-0 z-50 border-b border-gray-200/50 shadow-sm w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center w-full">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="md:hidden p-2 rounded-md text-main-dark hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {!isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>

            <div className="flex-shrink-0 flex items-center">
              <span className="brand-logo text-lg font-bold">pepepipi</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-8">

            <div className="hidden md:flex space-x-8 items-center">
              <a href="#activities" className="text-main-dark hover:text-brand-blue font-medium transition-colors">Aktivitas</a>
              <a href="#hampers" className="text-main-dark hover:text-brand-blue font-medium transition-colors">Hampers</a>
              <a href="#simulator" className="text-main-dark hover:text-brand-blue font-medium transition-colors">Ide Aktivitas Anak</a>
            </div>

            <a
              href={buildWaLink('Halo Pepepipi, saya tertarik tanya produknya!')}
              target="_blank"
              rel="noreferrer"
              className="btn-primary-pastel rounded-full font-medium shadow-sm transition-all hover:scale-[1.02] flex items-center justify-center flex-shrink-0
                     h-10 w-10 p-0 md:h-auto md:w-auto md:px-5 md:py-2"
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
              <span className="hidden md:block ml-2">Hubungi Kami</span>
            </a>

          </div>

        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-[#FAFAF8] border-t border-gray-200/50 shadow-inner px-4 pt-2 pb-4 space-y-1">
          <a
            href="#activities"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-main-dark hover:bg-gray-100 hover:text-brand-blue transition-colors"
          >
            Aktivitas
          </a>
          <a
            href="#hampers"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-main-dark hover:bg-gray-100 hover:text-brand-blue transition-colors"
          >
            Hampers
          </a>
          <a
            href="#simulator"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-main-dark hover:bg-gray-100 hover:text-brand-blue transition-colors"
          >
            Ide Aktivitas Anak
          </a>
        </div>
      )}
    </nav>
  )
}
