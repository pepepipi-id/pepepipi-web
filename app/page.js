import HomeContent from '../components/HomeContent'

export const metadata = {
  alternates: { canonical: '/' },
}

// Data terstruktur buat Google (nama brand, akun sosial, kontak WA).
const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pepepipi',
  url: 'https://pepepipi.id',
  sameAs: [
    'https://instagram.com/pepepipi.id',
    'https://tiktok.com/@pepepipi.id',
    'https://tokopedia.com/pepepipi',
    'https://shopee.co.id/pepepipi',
  ],
  ...(waNumber && {
    contactPoint: { '@type': 'ContactPoint', telephone: `+${waNumber}`, contactType: 'customer service', availableLanguage: 'Indonesian' },
  }),
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <HomeContent includeDrafts={false} />
    </>
  )
}
