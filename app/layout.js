import './globals.css'

const SITE_URL = 'https://pepepipi.id'
const TITLE = 'Pepepipi — Ide Aktivitas Anak & Hampers Bermakna'
const DESCRIPTION =
  'Ide aktivitas edukatif, paket bahan bermain, dan hampers spesial untuk menemani tumbuh kembang si kecil. Cari ide main sesuai usia anak dan pesan lewat WhatsApp.'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s | Pepepipi' },
  description: DESCRIPTION,
  applicationName: 'Pepepipi',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Pepepipi',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Mama dan anak bermain aktivitas kreatif Pepepipi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/images/og-image.jpg'],
  },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@700&family=Plus+Jakarta+Sans:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
