import Image from 'next/image'
import { buildWaLink } from '../lib/wa'

export default function MainFooter() {
  return (
    <footer className="bg-warm-light border-t border-slate-100 py-16 mt-20 text-left text-main-dark">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          <div className="flex flex-col space-y-6">
            <h2 className="brand-logo text-4xl tracking-tight">pepepipi</h2>
            <p className="text-main-muted text-sm max-w-xs leading-relaxed">
              Teman belanja Hampers dan Alat tulis anak. Dengan produk dan hampers pilihan terbaik demi kebahagiaan dan tumbuh kembang keluarga Anda.
            </p>

            <div className="flex items-center gap-5">
              <a href="https://instagram.com/pepepipi.id" target="_blank" rel="noreferrer" className="transition-all transform hover:scale-110 block">
                <Image src="/images/logo-instagram.png" alt="Instagram Pepepipi" width={24} height={24} className="w-6 h-6 object-contain" />
              </a>
              <a href="https://tiktok.com/@pepepipi.id" target="_blank" rel="noreferrer" className="transition-all transform hover:scale-110 block">
                <Image src="/images/logo-tiktok.png" alt="TikTok Pepepipi" width={24} height={24} className="w-6 h-6 object-contain" />
              </a>
              <a href="https://tokopedia.com/pepepipi" target="_blank" rel="noreferrer" className="transition-all transform hover:scale-110 block">
                <Image src="/images/logo-tokopedia.png" alt="Tokopedia Pepepipi" width={24} height={24} className="w-6 h-6 object-contain" />
              </a>
              <a href="https://shopee.co.id/pepepipi" target="_blank" rel="noreferrer" className="transition-all transform hover:scale-110 block">
                <Image src="/images/logo-shopee.png" alt="Shopee Pepepipi" width={24} height={24} className="w-6 h-6 object-contain" />
              </a>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-main-dark opacity-80"><br />Tentang Kami</h3>
            <p className="text-main-muted text-sm leading-relaxed">
              Sejak tahun 2019, Pepepipi hadir dengan berbagai alat tulis anak dan hampers pilihan.<br />Kami ingin menjadi teman yang terbaik bagi pada ibu dalam proses tumbuh kembang anak tercinta. Menciptakan momen seru, interaktif, dan edukatif bersama si kecil.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-main-dark opacity-80"><br />Kontak Kami</h3>
            <ul className="text-main-muted text-sm space-y-3">
              <li className="flex items-start gap-3">
                <span className="font-bold text-main-dark min-w-[80px]">Jam Buka:</span>
                <span>Senin - Jumat <br /> 09.00 - 16.30 WIB<br />Sabtu <br /> 09.00-12.00</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="font-bold text-main-dark min-w-[80px]">WhatsApp:</span>
                <a href={buildWaLink('Halo Pepepipi, saya tertarik tanya produknya!')} target="_blank" rel="noreferrer" className="hover:text-main-dark transition-colors underline decoration-dotted">+62 812-181 181 38</a>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-main-dark min-w-[80px]">Alamat:</span>
                <span>Taman Kaliandra no 26, Bandung, Jawa Barat, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-main-muted">&copy; 2019 pepepipi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
